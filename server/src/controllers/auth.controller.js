import bcrypt from "bcrypt";
import passport from "../config/passport.js";
import User from "../models/User.js";
import env from "../config/env.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const setNoCacheHeaders = (res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
};

const sanitizeUser = (raw) => {
  if (!raw) return null;
  const doc = raw.toObject ? raw.toObject() : raw;
  return {
    id: doc.id || String(doc._id),
    email: doc.email,
    name: doc.name || "",
    role: doc.role || "USER",
  };
};

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, name } = req.body || {};

      const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        setNoCacheHeaders(res);
        return res.status(422).json({
          ok: false,
          code: "INVALID_EMAIL",
          message: "Invalid email.",
        });
      }

      if (typeof password !== "string" || password.length < 8) {
        setNoCacheHeaders(res);
        return res.status(422).json({
          ok: false,
          code: "WEAK_PASSWORD",
          message: "Password too short.",
        });
      }

      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        setNoCacheHeaders(res);
        return res.status(409).json({
          ok: false,
          code: "EMAIL_TAKEN",
          message: "Email already in use.",
        });
      }

      const displayName = typeof name === "string" ? name.trim() : "";
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({
        email: normalizedEmail,
        passwordHash,
        name: displayName,
      });

      const clientUser = sanitizeUser(user);

      await new Promise((resolve, reject) => {
        req.login(clientUser, (err) => (err ? reject(err) : resolve()));
      });

      setNoCacheHeaders(res);
      return res.status(201).json({ ok: true, user: clientUser });
    } catch (error) {
      return next(error);
    }
  }

  static login(req, res, next) {
    passport.authenticate("local", (error, user, info = {}) => {
      if (error) return next(error);
      if (!user) {
        setNoCacheHeaders(res);
        return res.status(401).json({
          ok: false,
          code: "INVALID_CREDENTIALS",
          message: info.message || "Invalid email or password.",
        });
      }
      const clientUser = sanitizeUser(user);
      req.login(clientUser, (loginErr) => {
        if (loginErr) return next(loginErr);
        setNoCacheHeaders(res);
        return res.json({ ok: true, user: clientUser });
      });
    })(req, res, next);
  }

  static async logout(req, res) {
    try {
      await new Promise((resolve) => {
        if (typeof req.logout === "function") {
          req.logout(() => resolve());
        } else {
          resolve();
        }
      });
    } catch {
      // ignore logout errors to keep call idempotent
    }

    try {
      await new Promise((resolve) => {
        req.session?.destroy(() => resolve());
        if (!req.session) resolve();
      });
    } catch {
      // ignore session destroy errors
    }

    res.clearCookie?.("connect.sid", {
      httpOnly: true,
      sameSite: env.isProduction && !env.allowInsecureLocal ? "none" : "lax",
      secure: env.isProduction && !env.allowInsecureLocal,
      path: "/",
    });

    setNoCacheHeaders(res);
    return res.status(200).json({ ok: true });
  }

  static me(req, res) {
    setNoCacheHeaders(res);
    if (!req.isAuthenticated?.() || !req.isAuthenticated() || !req.user) {
      return res.status(200).json({ ok: true, user: null });
    }
    return res.json({ ok: true, user: sanitizeUser(req.user) });
  }
}

export default AuthController;
