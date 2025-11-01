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

const SKIP_REASONS = {
  NOT_FOUND: "NOT_FOUND",
  INACTIVE: "INACTIVE",
  ALREADY_ASSIGNED: "ALREADY_ASSIGNED",
  NO_SLOT: "NO_SLOT_AVAILABLE",
  CAPACITY: "CAPACITY_REACHED",
};

const pushSkip = (collection, judge, reason, details) => {
  const judgeId =
    judge && typeof judge === "object" && judge._id ? judge._id : judge;
  const judgeName =
    judge && typeof judge === "object"
      ? judge?.user?.name || judge?.user?.email || judge?.name || undefined
      : undefined;
  collection.push({
    judgeId: String(judgeId),
    reason,
    ...(judgeName ? { judgeName } : {}),
    ...(details ? { details } : {}),
  });
};

export const assignJudgesManually = async ({ ideaId, judgeIds, assignedBy }) => {
  const ideaObjectId = normalizeObjectId(ideaId, "ideaId");
  const judgeObjectIds = normalizeJudgeIds(judgeIds);
  const skipped = [];

  const idea = await Idea.findById(ideaObjectId).lean().exec();
  if (!idea) {
    const error = createError(404, "Idea not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  // const judgeDocs = await Judge.find({ _id: { $in: judgeObjectIds } })
  // const activeJudges = await Judge.find({ active: true })
  //   .where("_id")
  //   .in(judgeObjectIds)
  const judgeDocs = await Judge.find({ _id: { $in: judgeObjectIds } })
    .populate("user", "name email")
    .lean()
    .exec();

  const judgeMap = new Map(
    judgeDocs.map((judge) => [String(judge._id), judge])
  );

  const requestedOrder = judgeObjectIds.map((id) => String(id));
  const orderedCandidates = [];

  for (const id of requestedOrder) {
    const judge = judgeMap.get(id);
    if (!judge) {
      pushSkip(skipped, id, SKIP_REASONS.NOT_FOUND);
      continue;
    }
    if (!judge.active) {
      pushSkip(skipped, judge, SKIP_REASONS.INACTIVE);
      continue;
    }
    orderedCandidates.push(judge);
  }

  const existingAssignments = await Assignment.find({ idea: ideaObjectId })
    .select("judge")
    .lean()
    .exec();
  const alreadyAssigned = new Set(
    existingAssignments.map((item) => String(item.judge))
  );

  const initialSlots = Math.max(env.maxJudgesPerIdea - alreadyAssigned.size, 0);
  if (initialSlots === 0) {
    for (const candidate of orderedCandidates) {
      pushSkip(skipped, candidate, SKIP_REASONS.NO_SLOT, {
        max: env.maxJudgesPerIdea,
        assigned: alreadyAssigned.size,
      });
    }
    return { assignments: [], skipped, meta: { initialSlots, remainingSlots: 0 } };
  }

  const loadMap = await buildJudgeLoadMap(
    orderedCandidates.map((candidate) => candidate._id)
  );

  const queue = [];
  let planned = 0;

  for (const judge of orderedCandidates) {
    const judgeId = String(judge._id);

    if (alreadyAssigned.has(judgeId)) {
      pushSkip(skipped, judge, SKIP_REASONS.ALREADY_ASSIGNED);
      continue;
    }

    if (planned >= initialSlots) {
      pushSkip(skipped, judge, SKIP_REASONS.NO_SLOT, {
        max: env.maxJudgesPerIdea,
        assigned: alreadyAssigned.size + planned,
      });
      continue;
    }

    const capacity =
      typeof judge.capacity === "number" && judge.capacity > 0
        ? judge.capacity
        : Number.POSITIVE_INFINITY;
    const currentLoad = loadMap.get(judgeId) || 0;

    if (currentLoad >= capacity) {
      pushSkip(skipped, judge, SKIP_REASONS.CAPACITY, {
        capacity,
        currentLoad,
      });
      continue;
    }

    queue.push(judge);
    planned += 1;
    loadMap.set(judgeId, currentLoad + 1);
  }

  if (queue.length === 0) {
    return { assignments: [], skipped, meta: { initialSlots, remainingSlots: initialSlots } };
  }

  const created = [];

  for (const judge of queue) {
    try {
      const doc = await Assignment.create({
        idea: ideaObjectId,
        judge: judge._id,
        assignedBy,
      });
      await doc.populate([
        { path: "idea", select: "title status" },
        {
          path: "judge",
          populate: { path: "user", select: "name email role" },
        },
      ]);
      created.push(doc);
    } catch (err) {
      if (err?.code === 11000) {
        pushSkip(skipped, judge, SKIP_REASONS.ALREADY_ASSIGNED);
        continue;
      }
      throw err;
    }
  }

  if (created.length > 0 && idea.status === "SUBMITTED") {
    await Idea.updateOne(
      { _id: ideaObjectId },
      { $set: { status: "UNDER_REVIEW" } }
    ).exec();
  }

  logger.info("Manual assignment completed", {
    ideaId: String(ideaObjectId),
    assignedBy: String(assignedBy),
    created: created.length,
    skipped: skipped.length,
  });

  const payload = candidates.map((judge) => ({
    idea: ideaObjectId,
    judge: judge._id,
    assignedBy,
  }));
  const judgesToAdd = payload.map((entry) => entry.judge);

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
        {
          $set: { status: "UNDER_REVIEW" },
          $addToSet: { assignedJudges: { $each: judgesToAdd } },
        }
      ).exec();
    } else {
      await Idea.updateOne(
        { _id: ideaObjectId },
        { $addToSet: { assignedJudges: { $each: judgesToAdd } } }
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
  logger.info("Manual assignment completed", {
    ideaId: String(ideaObjectId),
    assignedBy: String(assignedBy),
    created: created.length,
    skipped: skipped.length,
  });

  return {
    assignments: created,
    skipped,
    meta: {
      initialSlots,
      remainingSlots: Math.max(initialSlots - created.length, 0),
    },
  };
};
