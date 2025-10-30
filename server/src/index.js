// server/src/index.js
import app from "./app.js";
import env from "./config/env.js";
import { connectMongo, initIndexes, disconnectMongo } from "./config/db.js";
import logger from "./utils/logger.js";

let httpServer;

/**
 * Start HTTP server + connect Mongo + sync indexes
 */
export const startServer = async (customPort) => {
  if (httpServer) return httpServer;

  const port = Number(customPort || env.port) || 5501;
  const host = env.host || "0.0.0.0";

  if (env.nodeEnv === "test") {
    await connectMongo(env.mongoUri);
    await initIndexes();
  } else {
    // kick off Mongo connection attempt without blocking HTTP startup
    void (async () => {
      try {
        await connectMongo(env.mongoUri);
        await initIndexes();
        logger.info("Mongo connection established");
      } catch (error) {
        logger.error("Mongo connection attempt failed", { error });
      }
    })();
  }

  httpServer = await new Promise((resolve, reject) => {
    const instance = app
      .listen(port, host, () => {
        logger.info(`Server listening on http://${host}:${port}`);
        resolve(instance);
      })
      .on("error", (error) => {
        logger.error("Server failed to start", { error });
        reject(error);
      });
  });

  return httpServer;
};

/**
 * Stop HTTP server + disconnect Mongo
 */
export const stopServer = async () => {
  if (httpServer) {
    await new Promise((resolve, reject) => {
      httpServer.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    httpServer = undefined;
  }
  await disconnectMongo();
};

/**
 * Graceful shutdown handler
 */
const shutdown = async (signal) => {
  try {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    await stopServer();
    process.exit(0);
  } catch (err) {
    logger.error("Error during shutdown", { err });
    process.exit(1);
  }
};

if (env.nodeEnv !== "test") {
  // boot
  startServer().catch((error) => {
    logger.error("Startup failure", { error });
  });

  // signals
  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => shutdown(signal));
  });

  // hard errors
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", { reason });
    shutdown("unhandledRejection");
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", { error });
    shutdown("uncaughtException");
  });
}
