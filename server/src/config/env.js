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

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  return defaultValue;
};

const parseOrigins = (raw) => {
  if (!raw) {
    return ["http://127.0.0.1:5173", "http://localhost:5173","https://separnoavari.ir","https://www.separnoavari.ir"];
  }
  return raw
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const port = parseNumber(process.env.PORT, 5501);
const host = process.env.HOST?.trim() || "127.0.0.1";
const mongoUri =
  process.env.MONGO_URI?.trim() || "mongodb://localhost:27017/separ_noavari";
const sessionSecret = process.env.SESSION_SECRET?.trim();

const dbMaxPool = parseNumber(process.env.DB_MAX_POOL, 20);
const dbMinPool = parseNumber(process.env.DB_MIN_POOL, 0);
const syncIndexesAtStartup = parseBoolean(
  process.env.SYNC_INDEXES_AT_STARTUP,
  false
);
const mongoPreferIpv4 = parseBoolean(
  process.env.MONGO_PREFER_IPV4 ?? process.env.MONGO_FORCE_IPV4 ?? process.env.MONGO_IPV4_ONLY,
  process.platform === "win32"
);
const mongoConnectRetries = parseNumber(process.env.MONGO_CONNECT_RETRIES, 4);
const mongoConnectRetryDelayMs = parseNumber(
  process.env.MONGO_CONNECT_RETRY_DELAY_MS,
  2000
);

const mongoAutoReconnect = parseBoolean(
  process.env.MONGO_AUTO_RECONNECT,
  true
);
const mongoReconnectInitialDelayMs = parseNumber(
  process.env.MONGO_RECONNECT_INITIAL_DELAY_MS,
  Math.max(1000, mongoConnectRetryDelayMs)
);
const mongoReconnectMaxDelayMs = parseNumber(
  process.env.MONGO_RECONNECT_MAX_DELAY_MS,
  60000
);
const mongoReconnectJitterMs = parseNumber(
  process.env.MONGO_RECONNECT_JITTER_MS,
  500
);

const mongoServerApi = (() => {
  const disable = parseBoolean(process.env.MONGO_DISABLE_SERVER_API, false);
  if (disable) return null;
  const version = process.env.MONGO_SERVER_API_VERSION?.trim() || "1";
  if (!version) return null;
  return {
    version,
    strict: parseBoolean(process.env.MONGO_SERVER_API_STRICT, true),
    deprecationErrors: parseBoolean(
      process.env.MONGO_SERVER_API_DEPRECATION_ERRORS,
      true
    ),
  };
})();

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be provided in environment variables");
}

const judgeDefaultCapacity = (() => {
  const parsed = parseNumber(process.env.JUDGE_DEFAULT_CAPACITY, 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
})();

const assignmentMaxFileSizeMb = (() => {
  const candidate =
    process.env.EVAL_MAX_FILE_MB ??
    process.env.ASSIGNMENT_MAX_FILE_SIZE_MB ??
    process.env.EVALUATION_MAX_FILE_MB;
  const parsed = parseNumber(candidate, 30);
  return parsed > 0 ? parsed : 30;
})();

const assignmentAllowPdf = parseBoolean(
  process.env.EVAL_ALLOW_PDF ?? process.env.ASSIGNMENT_ALLOW_PDF,
  false
);

const assignmentTemplateMode = (() => {
  const value = process.env.ASSIGNMENT_TEMPLATE_MODE?.trim().toUpperCase();
  if (value && ["STATIC", "PER_IDEA", "GENERATED"].includes(value)) {
    return value;
  }
  return "STATIC";
})();

const allowInsecureLocal = process.env.ALLOW_INSECURE_LOCAL === "1";
const trustProxy =
  process.env.TRUST_PROXY === "1" ||
  process.env.TRUST_PROXY?.toLowerCase() === "true";

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || "server/uploads"
);

const adminUsername = process.env.ADMIN_USERNAME?.trim() || null;
const adminPassword = process.env.ADMIN_PASSWORD || null;
const adminPasswordLooksHashed =
  typeof adminPassword === "string" && adminPassword.startsWith("$2");

const clientOrigins = parseOrigins(process.env.CLIENT_ORIGIN);

const maxJudgesPerIdea = (() => {
  const parsed = parseNumber(process.env.MAX_JUDGES_PER_IDEA, 10);
  return parsed > 0 ? parsed : 10;
})();

export default {
  nodeEnv: rawNodeEnv,
  isProduction,
  port,
  host,
  mongoUri,
  sessionSecret,
  dbMaxPool,
  dbMinPool,
  syncIndexesAtStartup,
  mongoPreferIpv4,
  mongoConnectRetries,
  mongoConnectRetryDelayMs,
  mongoAutoReconnect,
  mongoReconnectInitialDelayMs,
  mongoReconnectMaxDelayMs,
  mongoReconnectJitterMs,
  mongoServerApi,
  allowInsecureLocal,
  trustProxy,
  uploadDir,
  clientOrigins,
  judgeDefaultCapacity,
  maxJudgesPerIdea,
  assignment: {
    maxFileSizeMb: assignmentMaxFileSizeMb,
    allowPdf: assignmentAllowPdf,
    templateMode: assignmentTemplateMode,
  },
  admin: {
    username: adminUsername,
    password: adminPassword,
    passwordLooksHashed: adminPasswordLooksHashed,
  },
};
