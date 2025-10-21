import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import env from "./env.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    const normalizedEmail = normalizeEmail(email);
    try {
      if (
        env.admin.username &&
        env.admin.password &&
        normalizedEmail === normalizeEmail(env.admin.username)
      ) {
        let isMatch = false;
        try {
          if (env.admin.passwordLooksHashed) {
            isMatch = await bcrypt.compare(password, env.admin.password);
          } else {
            isMatch = password === env.admin.password;
          }
        } catch (err) {
          logger.error("Error comparing admin password", { err });
          return done(err);
        }

        if (!isMatch) {
          return done(null, false, { message: "Invalid credentials" });
        }

        return done(null, {
          id: "admin",
          email: env.admin.username,
          role: "ADMIN",
          name: "Administrator",
        });
      }

      const user = await User.findOne({ email: normalizedEmail }).lean();
      if (!user) {
        return done(null, false, { message: "Invalid credentials" });
      }

      if (!user.passwordHash) {
        return done(null, false, {
          message: "Account requires password reset",
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return done(null, false, { message: "Invalid credentials" });
      }

      return done(null, {
        id: String(user._id),
        email: user.email,
        role: user.role || "USER",
        name: user.name || "",
      });
    } catch (err) {
      logger.error("Local strategy failure", { err });
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  if (user.id === "admin" && env.admin.username) {
    return done(null, `admin:${env.admin.username}`);
  }
  return done(null, String(user.id));
});

passport.deserializeUser(async (token, done) => {
  try {
    if (env.admin.username && token === `admin:${env.admin.username}`) {
      return done(null, {
        id: "admin",
        email: env.admin.username,
        role: "ADMIN",
        name: "Administrator",
      });
    }

    const user = await User.findById(token).lean();
    if (!user) {
      return done(null, false);
    }

    return done(null, {
      id: String(user._id),
      email: user.email,
      role: user.role || "USER",
      name: user.name || "",
    });
  } catch (err) {
    logger.error("Deserialize user failed", { err, token });
    return done(err);
  }
});

export default passport;
