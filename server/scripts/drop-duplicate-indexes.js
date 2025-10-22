#!/usr/bin/env node
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectMongo, disconnectMongo } from "../src/config/db.js";
import logger from "../src/utils/logger.js";

const TARGETS = [
  { modelName: "User", collectionName: "users", desiredIndexes: ["email_1"] },
  { modelName: "Judge", collectionName: "judges", desiredIndexes: ["user_1"] },
];

const apply = process.argv.includes("--apply");

async function dropDuplicateIndexes() {
  await connectMongo(env.mongoUri);

  for (const target of TARGETS) {
    const collection = mongoose.connection.collection(target.collectionName);
    const indexes = await collection.indexes();

    logger.info(\nCollection "" indexes:);
    indexes.forEach((idx) => {
      logger.info( -  -> );
    });

    for (const desired of target.desiredIndexes) {
      const matching = indexes.filter((idx) => idx.name === desired);
      if (matching.length <= 1) continue;

      // keep the first index, drop the rest
      const [, ...duplicates] = matching;
      for (const dup of duplicates) {
        logger.warn(Duplicate index detected: .);
        if (apply) {
          await collection.dropIndex(dup.name);
          logger.info(Dropped index );
        } else {
          logger.info(Planned drop for index  (run with --apply to execute));
        }
      }
    }
  }

  await disconnectMongo();
}

dropDuplicateIndexes()
  .then(() => {
    if (!apply) {
      logger.info("Dry run complete. Re-run with --apply to drop duplicate indexes.");
    }
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Index cleanup failed", { error });
    process.exit(1);
  });
