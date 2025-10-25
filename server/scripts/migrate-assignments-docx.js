#!/usr/bin/env node
import process from "process";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectMongo, disconnectMongo } from "../src/config/db.js";
import Assignment from "../src/models/Assignment.js";
import logger from "../src/utils/logger.js";

const now = new Date();
const VALID_STATUSES = new Set([
  "PENDING",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVIEWED",
  "LOCKED",
]);

async function migrateAssignments() {
  await connectMongo(env.mongoUri);

  const cursor = Assignment.find().cursor();
  let processed = 0;
  let updated = 0;

  for await (const assignment of cursor) {
    processed += 1;
    const updates = {};
    const status = assignment.status || "PENDING";
    if (!VALID_STATUSES.has(status)) {
      updates.status = "PENDING";
    }

    if (!assignment.template || !assignment.template.source) {
      updates["template.source"] = env.assignment.templateMode;
    }

    if (
      assignment.allowReuploadUntilLock === undefined ||
      assignment.allowReuploadUntilLock === null
    ) {
      updates.allowReuploadUntilLock = true;
    }

    if (!assignment.audit) {
      updates.audit = {
        createdAt: assignment.createdAt || now,
        updatedAt: assignment.updatedAt || now,
        events: [],
      };
    } else {
      if (!assignment.audit.createdAt) {
        updates["audit.createdAt"] = assignment.createdAt || now;
      }
      if (!assignment.audit.updatedAt) {
        updates["audit.updatedAt"] = assignment.updatedAt || now;
      }
      if (!Array.isArray(assignment.audit.events)) {
        updates["audit.events"] = [];
      }
    }

    if (Object.keys(updates).length > 0) {
      await Assignment.updateOne({ _id: assignment._id }, { $set: updates });
      updated += 1;
    }
  }

  await disconnectMongo();

  logger.info("Assignment migration complete", {
    processed,
    updated,
  });

  await mongoose.disconnect();
}

migrateAssignments()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Assignment migration failed", { error });
    process.exit(1);
  });
