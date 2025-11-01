import session from "express-session";
import MongoStore from "connect-mongo";
import env from "./env.js";
import { connectMongo } from "./db.js";
import logger from "../utils/logger.js";

const secureCookie = env.isProduction && !env.allowInsecureLocal;
const sameSite = secureCookie ? "none" : "lax";

const ttlSeconds = 60 * 60 * 24; // 1 day

let mongoStore;
let sharedClientPromise;

const getSharedClientPromise = () => {
  if (!sharedClientPromise) {
    sharedClientPromise = connectMongo(env.mongoUri)
      .then((connection) => connection.getClient())
      .catch((err) => {
        sharedClientPromise = undefined;
        logger.error("Failed to resolve MongoDB client for session store", {
          name: err?.name,
          message: err?.message,
          code: err?.code,
        });
        throw err;
      });
  }
  return sharedClientPromise;
};

const createMongoStore = () => {
  if (mongoStore) return mongoStore;
  mongoStore = MongoStore.create({
    clientPromise: getSharedClientPromise(),
    collectionName: "sessions",
    ttl: ttlSeconds,
    autoRemove: "interval",
    autoRemoveInterval: 10,
    touchAfter: 600, // only write to Mongo once every 10 minutes if session unchanged
  });
  mongoStore.on("error", (err) => {
    logger.error("Session store error", {
      name: err?.name,
      message: err?.message,
      code: err?.code,
    });
  });
  getSharedClientPromise()
    .then((client) => {
      const topology = client?.topology?.description;
      const type = topology?.type || "unknown";
      logger.info(`Session store connected (topology=${type})`);
    })
    .catch(() => {
      // Error already reported in getSharedClientPromise.
    });
  return mongoStore;
};

const sessionOptions = {
  name: "connect.sid",
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  proxy: env.trustProxy,
  store: createMongoStore(),
  cookie: {
    httpOnly: true,
    sameSite,
    secure: secureCookie,
    maxAge: ttlSeconds * 1000,
    path: "/",
  },
};

export const sessionMiddleware = session(sessionOptions);
export { sessionOptions };
