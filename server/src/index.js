import app from "./app.js";
import env from "./config/env.js";
import { connectMongo, disconnectMongo } from "./config/db.js";
import logger from "./utils/logger.js";

let server;

export const startServer = async (customPort) => {
  if (server) {
    return server;
  }

  await connectMongo();

  const port = customPort || env.port;

  server = await new Promise((resolve, reject) => {
    const instance = app
      .listen(port, env.host, () => {
        logger.info(`Server listening on http://${env.host}:${port}`);
        resolve(instance);
      })
      .on("error", (error) => {
        logger.error("Server failed to start", { error });
        reject(error);
      });
  });

  return server;
};

export const stopServer = async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    server = undefined;
  }
  await disconnectMongo();
};

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
  startServer().catch((error) => {
    logger.error("Startup failure", { error });
    process.exit(1);
  });

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => shutdown(signal));
  });
}
