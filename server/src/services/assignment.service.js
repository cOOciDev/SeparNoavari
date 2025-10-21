import mongoose from "mongoose";
import createError from "http-errors";
import env from "../config/env.js";
import Idea from "../models/Idea.js";
import Judge from "../models/Judge.js";
import Assignment from "../models/Assignment.js";

const ObjectId = mongoose.Types.ObjectId;

const normalizeIds = (values = []) =>
  [...new Set(values.map((value) => String(value)))]
    .filter(Boolean)
    .map((value) => new ObjectId(value));

const loadJudges = async (ids) => {
  const judges = await Judge.find({ _id: { $in: ids }, active: true })
    .lean()
    .exec();
  if (judges.length !== ids.length) {
    throw createError(404, "One or more judges not found or inactive");
  }
  return judges;
};

const autoSelectJudges = async (required) => {
  const judges = await Judge.find({ active: true }).lean();
  if (judges.length < required) {
    throw createError(
      409,
      "Not enough active judges available for assignment"
    );
  }

  const loads = await Assignment.aggregate([
    { $group: { _id: "$judge", total: { $sum: 1 } } },
  ]);
  const loadMap = new Map(loads.map((row) => [String(row._id), row.total]));

  const sorted = judges
    .map((judge) => ({
      judge,
      load: loadMap.get(String(judge._id)) || 0,
    }))
    .sort((a, b) => a.load - b.load);

  return sorted.slice(0, required).map((entry) => entry.judge);
};

export const assignJudgesToIdeas = async ({
  ideaIds,
  judgeIds,
  assignedBy,
  requiredCount = env.assignmentJudgeCount,
}) => {
  if (!Array.isArray(ideaIds) || ideaIds.length === 0) {
    throw createError(400, "ideaIds array is required");
  }
  const normalizedIdeaIds = normalizeIds(ideaIds);
  const ideas = await Idea.find({ _id: { $in: normalizedIdeaIds } })
    .lean()
    .exec();
  if (ideas.length !== normalizedIdeaIds.length) {
    throw createError(404, "One or more ideas not found");
  }

  let judges;
  if (Array.isArray(judgeIds) && judgeIds.length > 0) {
    const normalizedJudgeIds = normalizeIds(judgeIds);
    if (normalizedJudgeIds.length < requiredCount) {
      throw createError(
        400,
        `At least ${requiredCount} unique judges are required`
      );
    }
    judges = await loadJudges(normalizedJudgeIds.slice(0, requiredCount));
  } else {
    judges = await autoSelectJudges(requiredCount);
  }

  const assignmentDocs = [];
  ideas.forEach((idea) => {
    judges.forEach((judge) => {
      assignmentDocs.push({
        idea: idea._id,
        judge: judge._id,
        assignedBy,
      });
    });
  });

  try {
    const created = await Assignment.insertMany(
      assignmentDocs.map((doc) => ({ ...doc })),
      { ordered: false }
    );
    return created;
  } catch (err) {
    if (err?.code === 11000) {
      throw createError(
        409,
        "One or more assignments already exist for these judges"
      );
    }
    throw err;
  }
};
