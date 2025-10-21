import bcrypt from "bcrypt";
import passport from "../config/passport.js";
import User from "../models/User.js";
import { z } from "zod";
import env from "../config/env.js";

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
  }),
});

const mapUserForClient = (user) => ({
  id: user.id || String(user._id),
  email: user.email,
  name: user.name || "",
  role: user.role || "USER",
});

class AuthController {
  static async register(req, res, next) {
    try {
      const {
        body: { email, password, name },
      } = registerSchema.parse({ body: req.body });

      const normalizedEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({
          ok: false,
          code: "EMAIL_IN_USE",
          message: "An account with this email already exists",
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        email: normalizedEmail,
        passwordHash,
        name,
        role: "USER",
      });

      await new Promise((resolve, reject) => {
        req.login(mapUserForClient(user), (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return res.status(201).json({
        ok: true,
        user: mapUserForClient(user),
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(422).json({
          ok: false,
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: err.issues,
        });
      }
      return next(err);
    }
  }

  static login(req, res, next) {
    passport.authenticate("local", (error, user, info = {}) => {
      if (error) return next(error);
      if (!user) {
        return res.status(401).json({
          ok: false,
          code: "INVALID_CREDENTIALS",
          message: info.message || "Invalid credentials",
        });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.json({
          ok: true,
          user: mapUserForClient(user),
        });
      });
    })(req, res, next);
  }

  static async logout(req, res, next) {
    try {
      await new Promise((resolve, reject) => {
        req.logout((err) => (err ? reject(err) : resolve()));
      });
      await new Promise((resolve, reject) => {
        req.session?.destroy((err) => (err ? reject(err) : resolve()));
      });
      res.clearCookie("connect.sid", {
        httpOnly: true,
        sameSite: env.isProduction && !env.allowInsecureLocal ? "none" : "lax",
        secure: env.isProduction && !env.allowInsecureLocal,
      });
      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  }

  static me(req, res) {
    if (!req.isAuthenticated?.() || !req.isAuthenticated()) {
      return res.json({ ok: true, user: null });
    }
    return res.json({ ok: true, user: mapUserForClient(req.user) });
  }
}

export default AuthController;
