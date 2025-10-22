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

if (env.trustProxy) {
  app.set("trust proxy", 1);
}

const allowedOrigins = new Set(
  env.clientOrigins.map((origin) => origin.replace(/\/$/, ""))
);

app.use(
  helmet({
    contentSecurityPolicy: env.isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.size === 0 || allowedOrigins.has(normalized)) {
        return callback(null, true);
      }
      return callback(
        new Error(
        "  Origin  is not permitted. Configure CLIENT_ORIGIN env var."
        )
      );
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  morgan(env.nodeEnv === "production" ? "combined" : "dev", {
    skip: () => env.nodeEnv === "test",
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", router);

app.use(errorHandler);

export default app;
