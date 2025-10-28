// server/src/config/db.js
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import env from "./env.js";

mongoose.set("strictQuery", true);
mongoose.set("sanitizeFilter", true);
mongoose.set("autoIndex", env.nodeEnv !== "production");
mongoose.set("debug", env.nodeEnv === "development");

let eventsBound = false;
let connectPromise = null;

function bindConnectionEvents() {
  if (eventsBound) return;
  eventsBound = true;

  mongoose.connection.on("connected", () => {
    const dbName = mongoose.connection.name;
    const clientOpts = mongoose.connection.client?.options || {};
    const appName = clientOpts.appName || "n/a";
    const hosts = Array.isArray(clientOpts.hosts) ? clientOpts.hosts.length : "srv";
    logger.info(`MongoDB connected db="${dbName}" app="${appName}" hosts=${hosts}`);
  });

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error", {
      name: err?.name,
      message: err?.message,
      code: err?.code,
    });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });
}

export async function connectMongo(uri) {
  bindConnectionEvents();
  if (!uri) throw new Error("MONGO_URI is not defined");

  const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  if (state === 1) return mongoose.connection;
  if (state === 2) {
    await new Promise((r) => mongoose.connection.once("connected", r));
    return mongoose.connection;
  }
  if (connectPromise) {
    await connectPromise;
    return mongoose.connection;
  }

  connectPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 20_000, // 20s
    socketTimeoutMS: 60_000,          // 60s
    connectTimeoutMS: 10_000,
    maxPoolSize: Number(env.dbMaxPool || 20),
    minPoolSize: Number(env.dbMinPool || 0),
    // family: 4, // uncomment if IPv6 causes trouble in your env
  });

  try {
    await connectPromise;
  } finally {
    connectPromise = null;
  }
  return mongoose.connection;
}

export async function initIndexes() {
  if (!(env.syncIndexesAtStartup === true || env.syncIndexesAtStartup === "true")) {
    logger.info("Skipping index sync (SYNC_INDEXES_AT_STARTUP not enabled)");
    return;
  }
  const models = Object.values(mongoose.models);
  for (const model of models) {
    if (typeof model.syncIndexes === "function") {
      await model.syncIndexes();
    }
  }
  logger.info("Mongoose indexes synced");
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.connection.close(false);
}
