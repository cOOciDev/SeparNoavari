import mongoose from "mongoose";
import createError from "http-errors";
import env from "../config/env.js";
import Idea from "../models/Idea.js";
import Judge from "../models/Judge.js";
import Assignment from "../models/Assignment.js";
import logger from "../utils/logger.js";

const { ObjectId } = mongoose.Types;

const normalizeObjectId = (value, label) => {
  if (!value) {
    throw createError(400, `${label} is required`);
  }
  const candidate = String(value).trim();
  if (!ObjectId.isValid(candidate)) {
    throw createError(400, `Invalid ${label}`);
  }
  return new ObjectId(candidate);
};

const normalizeJudgeIds = (values = []) => {
  const unique = [
    ...new Set(
      values
        .map((entry) => (entry ? String(entry).trim() : ""))
        .filter(Boolean)
    ),
  ];
  if (unique.length === 0) {
    throw createError(400, "At least one judge must be selected");
  }
  return unique.map((value) => {
    if (!ObjectId.isValid(value)) {
      throw createError(400, `Invalid judge id: ${value}`);
    }
    return new ObjectId(value);
  });
};

const buildJudgeLoadMap = async (judgeIds) => {
  if (judgeIds.length === 0) return new Map();
  const results = await Assignment.aggregate([
    {
      $match: {
        judge: { $in: judgeIds },
        status: { $ne: "LOCKED" },
      },
    },
    { $group: { _id: "$judge", count: { $sum: 1 } } },
  ]);
  return new Map(results.map((row) => [String(row._id), row.count]));
};

const buildCapacityError = (breaches) => {
  const error = createError(
    409,
    "One or more judges have reached their manual capacity"
  );
  error.code = "JUDGE_CAPACITY_REACHED";
  error.details = {
    judges: breaches.map((entry) => ({
      judgeId: String(entry.judgeId),
      capacity: entry.capacity,
      currentLoad: entry.currentLoad,
    })),
  };
  return error;
};

export const assignJudgesManually = async ({
  ideaId,
  judgeIds,
  assignedBy,
}) => {
  const ideaObjectId = normalizeObjectId(ideaId, "ideaId");
  const judgeObjectIds = normalizeJudgeIds(judgeIds);

  const idea = await Idea.findById(ideaObjectId).lean().exec();
  if (!idea) {
    const error = createError(404, "Idea not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  const activeJudges = await Judge.find({
    _id: { $in: judgeObjectIds },
    active: true,
  })
    .populate("user", "name email")
    .lean()
    .exec();

  if (activeJudges.length !== judgeObjectIds.length) {
    const error = createError(
      404,
      "One or more judges are inactive or missing"
    );
    error.code = "JUDGE_NOT_FOUND";
    throw error;
  }

  const existingAssignments = await Assignment.find({
    idea: ideaObjectId,
  })
    .select("judge")
    .lean()
    .exec();
  const alreadyAssigned = new Set(
    existingAssignments.map((item) => String(item.judge))
  );

  const availableSlots = Math.max(
    env.maxJudgesPerIdea - alreadyAssigned.size,
    0
  );
  if (availableSlots <= 0) {
    const error = createError(
      409,
      "Maximum number of judges reached for this idea"
    );
    error.code = "MAX_JUDGES_PER_IDEA";
    throw error;
  }

  const candidates = activeJudges.filter(
    (judge) => !alreadyAssigned.has(String(judge._id))
  );

  if (candidates.length === 0) {
    return { assignments: [], skipped: activeJudges.map((judge) => judge._id) };
  }

  if (candidates.length > availableSlots) {
    const error = createError(
      409,
      `Only ${availableSlots} assignment slots left for this idea`
    );
    error.code = "MAX_JUDGES_PER_IDEA";
    error.details = {
      assigned: alreadyAssigned.size,
      max: env.maxJudgesPerIdea,
      requested: candidates.length,
    };
    throw error;
  }

  const loadMap = await buildJudgeLoadMap(candidates.map((c) => c._id));
  const capacityBreaches = [];
  for (const judge of candidates) {
    const capacity =
      typeof judge.capacity === "number" && judge.capacity > 0
        ? judge.capacity
        : Number.POSITIVE_INFINITY;
    const currentLoad = loadMap.get(String(judge._id)) || 0;
    if (currentLoad >= capacity) {
      capacityBreaches.push({
        judgeId: judge._id,
        capacity,
        currentLoad,
      });
    }
  }

  if (capacityBreaches.length > 0) {
    throw buildCapacityError(capacityBreaches);
  }

  const payload = candidates.map((judge) => ({
    idea: ideaObjectId,
    judge: judge._id,
    assignedBy,
  }));

  try {
    const created = await Assignment.insertMany(payload, { ordered: false });
    const createdIds = created.map((row) => row._id);

    await Assignment.populate(created, [
      { path: "idea", select: "title status" },
      {
        path: "judge",
        populate: { path: "user", select: "name email role" },
      },
    ]);

    if (idea.status === "SUBMITTED") {
      await Idea.updateOne(
        { _id: ideaObjectId },
        { $set: { status: "UNDER_REVIEW" } }
      ).exec();
    }

    logger.info("Manual assignment completed", {
      ideaId: String(ideaObjectId),
      assignedBy: String(assignedBy),
      created: createdIds.length,
    });

    return { assignments: created };
  } catch (err) {
    if (err?.code === 11000) {
      const conflict = createError(
        409,
        "One or more assignments already exist for these judges"
      );
      conflict.code = "ASSIGNMENT_CONFLICT";
      throw conflict;
    }
    throw err;
  }
};
