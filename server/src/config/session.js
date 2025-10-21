import session from "express-session";
import MongoStore from "connect-mongo";
import env from "./env.js";
import logger from "../utils/logger.js";

const secureCookie = env.isProduction && !env.allowInsecureLocal;
const sameSite = secureCookie ? "none" : "lax";

const ttlSeconds = 60 * 60 * 24; // 1 day

let mongoStore;

const createMongoStore = () => {
  if (mongoStore) return mongoStore;
  mongoStore = MongoStore.create({
    mongoUrl: env.mongoUri,
    collectionName: "sessions",
    ttl: ttlSeconds,
    autoRemove: "interval",
    autoRemoveInterval: 10,
  });
  mongoStore.on("error", (err) => {
    logger.error("Session store error", { err });
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
