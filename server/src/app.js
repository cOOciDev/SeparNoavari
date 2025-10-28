import express from "express";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import env from "./config/env.js";
import { sessionMiddleware } from "./config/session.js";
import passport from "./config/passport.js";
import router from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
app.disable("etag");

// If exactly one proxy (Nginx) is in front:
if (env.trustProxy) app.set("trust proxy", 1);

const isProd = env.isProduction ?? env.nodeEnv === "production";

// Parse and normalize allowed origins from env (comma-separated)
const clientOriginsArr = Array.isArray(env.clientOrigins)
  ? env.clientOrigins
  : String(env.clientOrigins || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

const allowedOrigins = new Set(
  clientOriginsArr.map(o => o.replace(/\/$/, "")) // strip trailing slash
);

// Helmet (CSP off in dev to avoid noise)
app.use(
  helmet({
    contentSecurityPolicy: isProd ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin(origin, callback) {
      // allow same-origin server-to-server/no Origin
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.size === 0 || allowedOrigins.has(normalized)) {
        return callback(null, true);
      }
      return callback(
        new Error(
          `Origin "${origin}" is not permitted. Set CLIENT_ORIGIN(S) to include it.`
        )
      );
    },
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// Compression + body limits (match Nginx client_max_body_size)
app.use(compression());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use(cookieParser());

// Logging
app.use(
  morgan(isProd ? "combined" : "dev", {
    skip: () => env.nodeEnv === "test",
  })
);

// Rate limit just auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);

// Sessions & auth
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, status: "healthy", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", router);

// Errors (keep last)
app.use(errorHandler);

export default app;
