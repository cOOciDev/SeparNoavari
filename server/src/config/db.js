import mongoose from "mongoose";
import env from "./env.js";
import logger from "../utils/logger.js";

mongoose.set("strictQuery", true);

let connectionPromise;

const connectionEventsBound = (() => {
  let bound = false;
  return () => {
    if (bound) return;
    bound = true;
    mongoose.connection.on("connected", () => {
      logger.info(`MongoDB connected (${mongoose.connection.name})`);
    });
    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });
    mongoose.connection.on("error", (error) => {
      logger.error("MongoDB connection error", { error });
    });
    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });
  };
})();

export const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  connectionEventsBound();

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 30000,
      autoIndex: env.nodeEnv !== "production",
    });
  }

  await connectionPromise;
  return mongoose.connection;
};

export const disconnectMongo = async () => {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  connectionPromise = undefined;
};
