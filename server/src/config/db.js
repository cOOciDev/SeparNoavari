// server/src/config/db.js
import mongoose from "mongoose";
import logger from "../utils/logger.js";

mongoose.set("strictQuery", true);

// اگر خواستی: در پروداکشن autoIndex خاموش شود (اختیاری)
import env from "./env.js";
mongoose.set("autoIndex", env.nodeEnv !== "production");

let eventsBound = false;

function bindConnectionEvents() {
  if (eventsBound) return;
  eventsBound = true;

  mongoose.connection.on("connected", () => {
    const { name } = mongoose.connection;
    const host =
      mongoose.connection.host ||
      mongoose?.connection?.client?.options?.hosts?.[0]?.host ||
      "unknown-host";
    const port =
      mongoose.connection.port ||
      mongoose?.connection?.client?.options?.hosts?.[0]?.port ||
      "unknown-port";

    logger.info(`MongoDB connected (${name}) @ ${host}:${port}`);
  });

  mongoose.connection.on("error", (error) => {
    logger.error("MongoDB connection error", { error });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });
}

/**
 * Connect to Mongo and return the active connection
 */
export async function connectMongo(uri) {
  bindConnectionEvents();

  if (!uri) {
    throw new Error("MONGO_URI is not defined");
  }

  // 1 = connected, 2 = connecting
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (mongoose.connection.readyState === 2) {
    await new Promise((r) => mongoose.connection.once("connected", r));
    return mongoose.connection;
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });

  return mongoose.connection;
}

/**
 * Sync all indexes defined on models (safe alternative to ensureIndexes)
 * Make sure models are imported/registered before calling this!
 */
export async function initIndexes() {
  const models = Object.values(mongoose.models);
  for (const model of models) {
    if (typeof model.syncIndexes === "function") {
      await model.syncIndexes();
    }
  }
  logger.info("Mongoose indexes synced");
}

/**
 * Close the Mongo connection gracefully
 */
export async function disconnectMongo() {
  if (mongoose.connection.readyState === 0) return; // already disconnected
  await mongoose.connection.close(false);
}
