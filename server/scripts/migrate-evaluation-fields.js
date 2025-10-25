#!/usr/bin/env node
import process from "process";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectMongo, disconnectMongo } from "../src/config/db.js";
import Assignment from "../src/models/Assignment.js";
import Judge from "../src/models/Judge.js";
import Idea from "../src/models/Idea.js";
import logger from "../src/utils/logger.js";

const VALID_STATUSES = new Set([
  "PENDING",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVIEWED",
  "LOCKED",
]);

async function migrate() {
  await connectMongo(env.mongoUri);

  const assignmentCursor = Assignment.find().cursor();
  let assignmentsUpdated = 0;

  for await (const assignment of assignmentCursor) {
    const updates = {};
    if (!VALID_STATUSES.has(assignment.status)) {
      updates.status = "PENDING";
    }
    if (
      assignment.allowReuploadUntilLock === undefined ||
      assignment.allowReuploadUntilLock === null
    ) {
      updates.allowReuploadUntilLock = true;
    }
    if (!assignment.audit) {
      updates.audit = {
        createdAt: assignment.createdAt || new Date(),
        updatedAt: assignment.updatedAt || new Date(),
        events: [],
      };
    } else {
      if (!assignment.audit.createdAt) {
        updates["audit.createdAt"] = assignment.createdAt || new Date();
      }
      if (!assignment.audit.updatedAt) {
        updates["audit.updatedAt"] = assignment.updatedAt || new Date();
      }
      if (!Array.isArray(assignment.audit.events)) {
        updates["audit.events"] = [];
      }
    }
    if (Object.keys(updates).length > 0) {
      await Assignment.updateOne({ _id: assignment._id }, { $set: updates });
      assignmentsUpdated += 1;
    }
  }

  const judgesResult = await Judge.updateMany(
    {
      $or: [{ capacity: { $exists: false } }, { capacity: { $lte: 0 } }],
    },
    { $unset: { capacity: "" } }
  );

  const ideasResult = await Idea.updateMany(
    { finalSummary: { $exists: false } },
    { $set: { finalSummary: null } }
  );

  await disconnectMongo();
  await mongoose.disconnect();

  logger.info("Evaluation migration completed", {
    assignmentsUpdated,
    judgesAdjusted: judgesResult.modifiedCount,
    ideasTouched: ideasResult.modifiedCount,
  });
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error("Migration failed", { error });
    process.exit(1);
  });
