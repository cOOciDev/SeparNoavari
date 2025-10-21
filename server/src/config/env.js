import path from "path";
import process from "process";
import dotenv from "dotenv";

dotenv.config();

const rawNodeEnv = process.env.NODE_ENV?.trim() || "development";
const isProduction = rawNodeEnv === "production";

const parseNumber = (value, defaultValue) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
};

const parseOrigins = (raw) => {
  if (!raw) {
    return ["http://127.0.0.1:5173", "http://localhost:5173"];
  }
  return raw
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const port = parseNumber(process.env.PORT, 5501);
const host = process.env.HOST?.trim() || "127.0.0.1";
const mongoUri =
  process.env.MONGO_URI?.trim() || "mongodb://localhost:27017/separnoavari";
const sessionSecret = process.env.SESSION_SECRET?.trim();

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be provided in environment variables");
}

const assignmentJudgeCount = (() => {
  const parsed = parseNumber(process.env.ASSIGNMENT_JUDGES_COUNT, 3);
  return parsed > 0 ? parsed : 3;
})();

const allowInsecureLocal = process.env.ALLOW_INSECURE_LOCAL === "1";
const trustProxy =
  process.env.TRUST_PROXY === "1" ||
  process.env.TRUST_PROXY?.toLowerCase() === "true";

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || "server/uploads/ideas"
);

const adminUsername = process.env.ADMIN_USERNAME?.trim() || null;
const adminPassword = process.env.ADMIN_PASSWORD || null;
const adminPasswordLooksHashed =
  typeof adminPassword === "string" && adminPassword.startsWith("$2");

const clientOrigins = parseOrigins(process.env.CLIENT_ORIGIN);

export default {
  nodeEnv: rawNodeEnv,
  isProduction,
  port,
  host,
  mongoUri,
  sessionSecret,
  allowInsecureLocal,
  trustProxy,
  assignmentJudgeCount,
  uploadDir,
  clientOrigins,
  admin: {
    username: adminUsername,
    password: adminPassword,
    passwordLooksHashed: adminPasswordLooksHashed,
  },
};
