// server/src/config/db.js
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import env from "./env.js";

mongoose.set("strictQuery", true);
mongoose.set("sanitizeFilter", true);
mongoose.set("autoIndex", env.nodeEnv !== "production");
mongoose.set("debug", env.nodeEnv === "development");
mongoose.set("bufferCommands", false);

let eventsBound = false;
let connectPromise = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let lastUri = null;
let lastConnectedAt = null;
let lastDisconnectAt = null;
let lastError = null;
let manualDisconnect = false;

const TRANSIENT_ERROR_NAMES = new Set([
  "MongoNetworkError",
  "MongoServerSelectionError",
  "MongoTopologyClosedError",
  "MongoTimeoutError",
  "MongoNotConnectedError",
]);

const TRANSIENT_NODE_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
]);

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const captureErrorMeta = (error) => {
  if (!error) return null;
  return {
    name: error.name,
    message: error.message,
    code: error.code,
    labels: Array.isArray(error.errorLabels) ? [...error.errorLabels] : undefined,
  };
};

const READY_STATE_NAMES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const scheduleReconnect = (reason) => {
  if (!env.mongoAutoReconnect) return;
  if (manualDisconnect) return;
  if (!lastUri) return;
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) return;
  if (connectPromise) return;
  if (reconnectTimer) return;

  const attempt = reconnectAttempt + 1;
  const baseDelay = Math.max(250, Number(env.mongoReconnectInitialDelayMs || 0));
  const cappedDelay = Math.min(
    Number(env.mongoReconnectMaxDelayMs || 0) || 60_000,
    baseDelay * 2 ** Math.min(attempt - 1, 5)
  );
  const jitterRange = Math.max(0, Number(env.mongoReconnectJitterMs || 0));
  const jitter = jitterRange > 0 ? Math.floor(Math.random() * jitterRange) : 0;
  const waitMs = Math.max(250, cappedDelay + jitter);

  logger.warn(
    `MongoDB connection lost (reason=${reason}); scheduling reconnect attempt #${attempt} in ${waitMs}ms`
  );

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    reconnectAttempt = attempt;
    try {
      await connectMongo(lastUri);
    } catch (error) {
      lastError = captureErrorMeta(error);
      const canRetry = isTransientMongoError(error);
      if (canRetry) {
        logger.warn(
          `MongoDB auto-reconnect attempt #${attempt} failed (${error.name ?? "Error"}: ${
            error.message
          }). Retrying...`
        );
        scheduleReconnect("auto-retry-failed");
      } else {
        logger.error("MongoDB auto-reconnect aborted due to non-transient error", {
          error: lastError,
        });
      }
    }
  }, waitMs);
  reconnectTimer?.unref?.();
};

const isTransientMongoError = (error) => {
  if (!error) return false;
  if (TRANSIENT_ERROR_NAMES.has(error.name)) return true;
  if (error.code && TRANSIENT_NODE_CODES.has(error.code)) return true;
  if (typeof error.message === "string") {
    const lower = error.message.toLowerCase();
    if (
      lower.includes("timed out") ||
      lower.includes("timeout") ||
      lower.includes("econnreset")
    ) {
      return true;
    }
  }
  if (error.errorLabels && Array.isArray(error.errorLabels)) {
    if (
      error.errorLabels.some((label) =>
        ["TransientTransactionError", "RetryableWriteError", "ResetPool"].includes(label)
      )
    ) {
      return true;
    }
  }
  if (error.errorLabelSet && typeof error.errorLabelSet.has === "function") {
    if (
      ["TransientTransactionError", "RetryableWriteError", "ResetPool"].some((label) =>
        error.errorLabelSet.has(label)
      )
    ) {
      return true;
    }
  }
  if (error.cause) {
    return isTransientMongoError(error.cause);
  }
  return false;
};

function bindConnectionEvents() {
  if (eventsBound) return;
  eventsBound = true;

  mongoose.connection.on("connected", () => {
    clearReconnectTimer();
    reconnectAttempt = 0;
    manualDisconnect = false;
    lastConnectedAt = new Date();
    lastError = null;
    const dbName = mongoose.connection.name;
    const clientOpts = mongoose.connection.client?.options || {};
    const appName = clientOpts.appName || "n/a";
    const hosts = Array.isArray(clientOpts.hosts) ? clientOpts.hosts.length : "srv";
    logger.info(`MongoDB connected db="${dbName}" app="${appName}" hosts=${hosts}`);
  });

  mongoose.connection.on("error", (err) => {
    lastError = captureErrorMeta(err);
    logger.error("MongoDB connection error", {
      name: err?.name,
      message: err?.message,
      code: err?.code,
    });
    if (isTransientMongoError(err)) {
      scheduleReconnect("error-event");
    }
  });

  mongoose.connection.on("disconnected", () => {
    lastDisconnectAt = new Date();
    logger.warn("MongoDB disconnected");
    scheduleReconnect("disconnect-event");
  });

  mongoose.connection.on("reconnected", () => {
    clearReconnectTimer();
    reconnectAttempt = 0;
    lastConnectedAt = new Date();
    lastError = null;
    logger.info("MongoDB reconnected");
  });
}

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled promise rejection", {
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
  });
});

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

  clearReconnectTimer();
  manualDisconnect = false;
  lastUri = uri;

  const connectionOptions = {
    serverSelectionTimeoutMS: 20_000, // 20s
    socketTimeoutMS: 60_000, // 60s
    connectTimeoutMS: 15_000,
    heartbeatFrequencyMS: 10_000,
    retryReads: true,
    retryWrites: true,
    maxPoolSize: Number(env.dbMaxPool || 20),
    minPoolSize: Number(env.dbMinPool || 0),
  };

  if (env.mongoServerApi) {
    connectionOptions.serverApi = env.mongoServerApi;
  }

  if (env.mongoPreferIpv4) {
    connectionOptions.family = 4;
  }

  const maxAttempts = Math.max(1, Number(env.mongoConnectRetries || 1));
  const retryDelay = Math.max(0, Number(env.mongoConnectRetryDelayMs || 0));

  connectPromise = (async () => {
    let lastAttemptError;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await mongoose.connect(uri, connectionOptions);
        lastConnectedAt = new Date();
        lastError = null;
        return mongoose.connection;
      } catch (error) {
        lastAttemptError = captureErrorMeta(error);
        lastError = lastAttemptError;
        const canRetry = attempt < maxAttempts && isTransientMongoError(error);
        if (!canRetry) {
          throw error;
        }
        logger.warn(
          `MongoDB connection attempt ${attempt} failed (${error.name ?? "Error"}): ${
            error.message
          }. Retrying in ${retryDelay}ms`
        );
        if (retryDelay > 0) {
          await wait(retryDelay);
        }
      }
    }
    throw lastAttemptError;
  })();

  try {
    await connectPromise;
  } finally {
    connectPromise = null;
  }
  return mongoose.connection;
}

export async function initIndexes() {
  if (!env.syncIndexesAtStartup) {
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
  manualDisconnect = true;
  clearReconnectTimer();
  if (mongoose.connection.readyState === 0) return;
  await mongoose.connection.close(false);
}

export function getMongoStatus() {
  const readyState = mongoose.connection.readyState;
  return {
    readyState,
    state: READY_STATE_NAMES[readyState] ?? "unknown",
    reconnecting: Boolean(reconnectTimer || connectPromise),
    reconnectAttempt,
    lastConnectedAt,
    lastDisconnectAt,
    lastError,
  };
}

export async function waitForMongoHealthy(timeoutMs = 5000) {
  const deadline = Date.now() + Math.max(0, timeoutMs);
  while (mongoose.connection.readyState !== 1 && Date.now() < deadline) {
    await wait(200);
  }
}

export function getMongoReadyState() {
  return mongoose.connection.readyState;
}

export function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}
