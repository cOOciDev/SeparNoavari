const LOG_LEVELS = ["debug", "info", "warn", "error"];

const envLevel =
  process.env.LOG_LEVEL?.toLowerCase() ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

const threshold = LOG_LEVELS.includes(envLevel)
  ? LOG_LEVELS.indexOf(envLevel)
  : 1;

const formatTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

const write = (level, message, meta) => {
  if (LOG_LEVELS.indexOf(level) < threshold) return;
  const payload = [`[${formatTimestamp()}] [${level.toUpperCase()}]`, message];
  if (meta !== undefined) {
    payload.push(meta);
  }
  const method =
    level === "error"
      ? console.error
      : level === "warn"
      ? console.warn
      : console.log;
  method(...payload);
};

export default {
  debug: (msg, meta) => write("debug", msg, meta),
  info: (msg, meta) => write("info", msg, meta),
  warn: (msg, meta) => write("warn", msg, meta),
  error: (msg, meta) => write("error", msg, meta),
};
