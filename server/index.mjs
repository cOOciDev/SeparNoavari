import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import multer from "multer";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";

const app = express();
const port = 5501;
const uploadsRoot = path.resolve("./uploads");

// Configure multer for file uploads
const sanitizeFilenameComponent = (value) => {
  return String(value ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);
};


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseDir = uploadsRoot;
    const userEmail = req.user?.email || req.body?.contact_email;
    if (!userEmail) {
      return cb(new Error("USER_EMAIL_MISSING"));
    }
    const normalizedEmail = String(userEmail).trim();
    const safeName = normalizedEmail.replace(/[^a-zA-Z0-9@._-]+/g, "_");
    if (!safeName) {
      return cb(new Error("USER_EMAIL_INVALID"));
    }
    const userDir = path.join(baseDir, safeName);
    try {
      fs.mkdirSync(userDir, { recursive: true });
    } catch (e) {
      return cb(e);
    }
    req.multerUploadDir = userDir;
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ideaTitleRaw = req.body?.idea_title ?? "";
    const submitterRaw =
      req.body?.submitter_full_name ??
      req.user?.name ??
      req.user?.email ??
      "";
    const ideaTitle = sanitizeFilenameComponent(ideaTitleRaw) || "idea";
    const submitterName = sanitizeFilenameComponent(submitterRaw) || "user";
    const timestamp = new Date();
    const year = String(timestamp.getFullYear());
    const month = String(timestamp.getMonth() + 1).padStart(2, "0");
    const day = String(timestamp.getDate()).padStart(2, "0");
    const hours = String(timestamp.getHours()).padStart(2, "0");
    const minutes = String(timestamp.getMinutes()).padStart(2, "0");
    const seconds = String(timestamp.getSeconds()).padStart(2, "0");
    const dateStamp = year + month + day + "-" + hours + minutes + seconds;
    const baseNameArray = [ideaTitle, submitterName, dateStamp].filter(Boolean);
    const baseName = baseNameArray.join("_") || "file";
    const ext = path.extname(file.originalname) || "";
    const uploadDir = req.multerUploadDir || uploadsRoot;
    let finalName = baseName + ext;
    let candidatePath = path.join(uploadDir, finalName);
    let counter = 1;
    while (fs.existsSync(candidatePath)) {
      finalName = baseName + "_" + counter + ext;
      candidatePath = path.join(uploadDir, finalName);
      counter += 1;
    }
    cb(null, finalName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB per file
  fileFilter: (req, file, cb) => {
    // Enforce per-field mime types
    if (file.fieldname === "pdf_file") {
      if (file.mimetype === "application/pdf") return cb(null, true);
      return cb(new Error("INVALID_PDF_TYPE"));
    }
    if (file.fieldname === "word_file") {
      if (
        file.mimetype === "application/msword" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
        return cb(null, true);
      return cb(new Error("INVALID_WORD_TYPE"));
    }
    // Unknown field
    return cb(new Error("INVALID_FIELD"));
  },
});

// Initialize database
let db;
async function initializeDb() {
  db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });
  // Ensure users table has a 'role' column. Add it if missing.
  try {
    const pragma = await db.all("PRAGMA table_info(users)");
    const hasRole = pragma.some((c) => c.name === "role");
    if (!hasRole) {
      console.log("Adding 'role' column to users table (migration)");
      await db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
    }
  } catch (err) {
    console.warn("Failed to ensure role column exists:", err);
  }
}
initializeDb();

// Middleware
const rawAllowedOrigins = (process.env.ALLOWED_ORIGINS || "https://www.separnoavari.ir,https://separnoavari.ir,http://localhost:5173,http://127.0.0.1:5173")
  .split(/[,\s]+/)
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(rawAllowedOrigins);
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim()
    ? process.env.SESSION_SECRET.trim()
    : (isProduction ? null : "dev-session-secret");

if (!sessionSecret) {
  console.error("SESSION_SECRET must be set in environment variables.");
  process.exit(1);
}

const adminUsername =
  process.env.ADMIN_USERNAME && process.env.ADMIN_USERNAME.trim()
    ? process.env.ADMIN_USERNAME.trim()
    : null;
const adminPassword =
  typeof process.env.ADMIN_PASSWORD === "string"
    ? process.env.ADMIN_PASSWORD
    : null;
const adminSessionToken = adminUsername ? "admin:" + adminUsername : null;
const adminPasswordLooksHashed =
  typeof adminPassword === "string" && adminPassword.startsWith("$2");

const parseBoolean = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return null;
};

const cookieSecureOverrideRaw = process.env.SESSION_COOKIE_SECURE;
let sessionCookieSecure = isProduction;
if (typeof cookieSecureOverrideRaw === "string" && cookieSecureOverrideRaw.trim()) {
  const parsed = parseBoolean(cookieSecureOverrideRaw);
  if (parsed !== null) {
    sessionCookieSecure = parsed;
  }
}

const cookieSameSiteOverrideRaw = process.env.SESSION_COOKIE_SAMESITE;
const validSameSiteValues = new Set(["lax", "strict", "none"]);
let sessionCookieSameSite = null;
if (typeof cookieSameSiteOverrideRaw === "string" && cookieSameSiteOverrideRaw.trim()) {
  const normalized = cookieSameSiteOverrideRaw.trim().toLowerCase();
  if (validSameSiteValues.has(normalized)) {
    sessionCookieSameSite = normalized;
  } else {
    console.warn("Ignoring invalid SESSION_COOKIE_SAMESITE value:", cookieSameSiteOverrideRaw);
  }
}
if (!sessionCookieSameSite) {
  sessionCookieSameSite = sessionCookieSecure ? "none" : "lax";
}

if ((adminUsername && !adminPassword) || (!adminUsername && adminPassword)) {
  console.warn(
    "Both ADMIN_USERNAME and ADMIN_PASSWORD must be provided to enable admin login."
  );
}

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      console.warn("Blocked CORS origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      console.log("Attempting login with email:", email);
      try {
        const normalizedEmail = String(email || "").trim();

        if (adminUsername && adminPassword && normalizedEmail === adminUsername) {
          let isMatch = false;
          try {
            if (adminPasswordLooksHashed) {
              isMatch = await bcrypt.compare(password, adminPassword);
            } else {
              isMatch = password === adminPassword;
            }
          } catch (err) {
            console.error("Error validating admin password:", err);
            return done(err);
          }

          if (!isMatch) {
            console.log("Admin password mismatch for email:", normalizedEmail);
            return done(null, false, { message: "Invalid password" });
          }

          const adminUser = {
            id: "admin",
            email: adminUsername,
            name: "Administrator",
            role: "admin",
          };
          console.log("Admin login successful");
          return done(null, adminUser);
        }

        const user = await db.get(
          "SELECT id, email, name, password FROM users WHERE email = ?",
          [normalizedEmail]
        );
        if (!user) {
          console.log("User not found for email:", normalizedEmail);
          return done(null, false, { message: "Invalid email" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          console.log("Password mismatch for email:", normalizedEmail);
          return done(null, false, { message: "Invalid password" });
        }

        const sanitizedUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: "user",
        };
        console.log("Login successful for email:", sanitizedUser.email);
        return done(null, sanitizedUser);
      } catch (err) {
        console.error("Error during login:", err);
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  if (user?.role === "admin" && adminSessionToken) {
    console.log("Serializing admin user");
    return done(null, adminSessionToken);
  }
  console.log("Serializing user ID:", user?.id);
  done(null, String(user?.id));
});
passport.deserializeUser(async (token, done) => {
  console.log("Deserializing user with token:", token);
  try {
    if (adminSessionToken && token === adminSessionToken) {
      const adminUser = {
        id: "admin",
        email: adminUsername,
        name: "Administrator",
        role: "admin",
      };
      console.log("Deserialized admin user");
      return done(null, adminUser);
    }

    const numericId = Number.parseInt(token, 10);
    if (!Number.isInteger(numericId)) {
      console.warn("Invalid session identifier:", token);
      return done(null, false);
    }

    const user = await db.get(
      "SELECT id, email, name FROM users WHERE id = ?",
      [numericId]
    );
    if (!user) {
      console.warn("User not found for id:", numericId);
      return done(null, false);
    }

    const normalizedUser = { ...user, role: "user" };
    console.log("Deserialized user:", normalizedUser);
    done(null, normalizedUser);
  } catch (err) {
    console.error("Deserialize error:", err);
    done(err);
  }
});

// Authentication middleware with detailed logging
function ensureAuthenticated(req, res, next) {
  console.log("=== Authentication Check ===");
  console.log("Session ID:", req.sessionID);
  console.log("Session object:", req.session);
  console.log("Is authenticated:", req.isAuthenticated());
  if (req.session && req.session.passport) {
    console.log("Passport user ID in session:", req.session.passport.user);
  }
  console.log("req.user:", req.user);
  console.log("Cookies:", req.cookies);
  console.log("====================");
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

const isAdminUser = (user) => Boolean(user && user.role === "admin");
const getNumericUserId = (user) => {
  if (!user) return null;
  if (typeof user.id === "number" && Number.isFinite(user.id)) {
    return user.id;
  }
  const parsed = Number.parseInt(user.id, 10);
  return Number.isInteger(parsed) ? parsed : null;
};

function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && isAdminUser(req.user)) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden" });
}


// Routes
app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (!user) {
      console.log("Authentication failed:", info.message);
      return res.status(401).json({ error: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Login failed" });
      }
      console.log("User logged in successfully, session saved");
      res.json({
        id: user.id,
        email: user.email,
        name: user.name ?? "",
        role: user.role ?? "user",
      });
    });
  })(req, res, next);
});

app.post("/api/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logout successful" });
  });
});

app.get("/api/user", (req, res) => {
  console.log("=== /api/user Check ===");
  console.log("Is authenticated:", req.isAuthenticated());
  console.log("req.user:", req.user);
  console.log("Session:", req.session);
  console.log("==================");
  if (req.isAuthenticated()) {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role ?? "user",
      },
    });
  } else {
    res.json({ user: null });
  }
});

app.post("/api/signup", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
      [email, hashedPassword, name]
    );
    const newUser = {
      id: result.lastID,
      email,
      name,
      role: "user",
    };
    req.logIn(newUser, (loginErr) => {
      if (loginErr) {
        console.error("Auto login after signup failed:", loginErr);
        return res.status(500).json({ error: "Login after signup failed" });
      }
      res
        .status(201)
        .json({
          message: "User created",
          userId: newUser.id,
          userEmail: newUser.email,
          userName: newUser.name,
          userRole: "user",
        });
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post(
  "/api/submit-idea",
  ensureAuthenticated,
  (req, res, next) => {
    // accept two different fields
    const handler = upload.fields([
      { name: "pdf_file", maxCount: 1 },
      { name: "word_file", maxCount: 1 },
    ]);
    handler(req, res, (err) => {
      if (err) {
        if (err.message === "INVALID_PDF_TYPE") {
          return res.status(400).json({ error: "Only PDF is allowed for pdf_file" });
        }
        if (err.message === "INVALID_WORD_TYPE") {
          return res.status(400).json({ error: "Only Word (.doc/.docx) is allowed for word_file" });
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "Each file must be smaller than 30MB" });
        }
        return res.status(400).json({ error: "Upload failed" });
      }
      next();
    });
  },
  async (req, res) => {
    console.log("=== Submit Idea Request ===");
    console.log("Request body:", req.body);
    console.log("File:", req.file);
    console.log("User:", req.user);
    const {
      contact_email,
      submitter_full_name,
      track,
      phone,
      idea_title,
      executive_summary,
    } = req.body;

    const ownerId = getNumericUserId(req.user);
    if (!Number.isInteger(ownerId)) {
      return res.status(403).json({ error: "Unauthorized submitter" });
    }

    // Normalize team_members which may arrive as string | array | object
    let team_members_raw = req.body.team_members;
    let team_members_str = "";
    if (Array.isArray(team_members_raw)) {
      // from form-data with keys like team_members[0], multer parses into array
      team_members_str = team_members_raw
        .map(v => (typeof v === "string" ? v.trim() : String(v)))
        .filter(Boolean)
        .join(", ");
    } else if (typeof team_members_raw === "object" && team_members_raw !== null) {
      // object with numeric keys { '0': 'a', '1': 'b' }
      team_members_str = Object.keys(team_members_raw)
        .sort()
        .map(k => (typeof team_members_raw[k] === "string" ? team_members_raw[k].trim() : String(team_members_raw[k])))
        .filter(Boolean)
        .join(", ");
    } else if (typeof team_members_raw === "string") {
      team_members_str = team_members_raw.trim();
    } else {
      team_members_str = "";
    }
    // Extract uploaded files
    const pdf = req.files?.pdf_file?.[0] || null;
    const word = req.files?.word_file?.[0] || null;
    // Validate required files and sizes (30MB already enforced by multer)
    if (!pdf) {
      return res.status(400).json({ error: "PDF file is required" });
    }
    if (!word) {
      return res.status(400).json({ error: "Word file is required" });
    }
    // Store relative paths for client links
    const rel = (p) => (p ? p.replace(path.resolve("."), "").replace(/\\/g, "/").replace(/^\//, "") : null);
    const file_path = JSON.stringify({
      pdf: pdf ? rel(pdf.path) : null,
      word: word ? rel(word.path) : null,
    });
    try {
      const result = await db.run(
        "INSERT INTO ideas (user_id, contact_email, submitter_full_name, track, phone, team_members, idea_title, executive_summary, file_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          ownerId,
          contact_email,
          submitter_full_name,
          track,
          phone || "",
          team_members_str,
          idea_title,
          executive_summary,
          file_path,
        ]
      );
      res
        .status(201)
        .json({ message: "Idea submitted", ideaId: result.lastID });
    } catch (err) {
      console.error("Error submitting idea:", err);
      res.status(500).json({ error: "Failed to submit idea" });
    }
  }
);

app.get("/api/ideas/:id/files/:key", ensureAuthenticated, async (req, res) => {
  const ideaId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(ideaId)) {
    return res.status(400).json({ error: "Invalid idea id" });
  }

  const fileKey = String(req.params.key || "").toLowerCase();
  if (!["pdf", "word", "file"].includes(fileKey)) {
    return res.status(400).json({ error: "Invalid file key" });
  }

  try {
    const idea = await db.get(
      "SELECT id, user_id, file_path FROM ideas WHERE id = ?",
      [ideaId]
    );
    if (!idea) {
      return res.status(404).json({ error: "Idea not found" });
    }

    const isAdmin = isAdminUser(req.user);
    const ownerId = getNumericUserId(req.user);
    if (!isAdmin && (!Number.isInteger(ownerId) || ownerId !== idea.user_id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const filePathRaw = idea.file_path;
    if (!filePathRaw) {
      return res.status(404).json({ error: "File not found" });
    }

    let selectedRelative = null;
    if (filePathRaw) {
      try {
        const parsed = JSON.parse(filePathRaw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const candidate = parsed[fileKey];
          if (typeof candidate === "string" && candidate.trim()) {
            selectedRelative = candidate.trim();
          }
        }
      } catch (err) {
        // legacy plain string, ignore JSON errors
      }
    }

    if (!selectedRelative && fileKey === "file" && typeof filePathRaw === "string") {
      selectedRelative = filePathRaw;
    }

    if (!selectedRelative) {
      return res.status(404).json({ error: "File not found" });
    }

    const cleanedRelative = selectedRelative.replace(/\\/g, "/");
    const withoutPrefix = cleanedRelative.startsWith("uploads/")
      ? cleanedRelative.slice("uploads/".length)
      : cleanedRelative.replace(/^\/+/, "");

    const absolutePath = path.resolve(uploadsRoot, withoutPrefix);
    if (!absolutePath.startsWith(uploadsRoot)) {
      return res.status(400).json({ error: "Invalid file path" });
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.download(absolutePath, path.basename(absolutePath), (downloadErr) => {
      if (downloadErr) {
        console.error("Download error:", downloadErr);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to download file" });
        }
      }
    });
  } catch (err) {
    console.error("Error serving idea file:", err);
    res.status(500).json({ error: "Failed to download file" });
  }
});

app.get(
  "/api/admin/overview",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const ideaCountRow = await db.get(
        "SELECT COUNT(*) AS count FROM ideas"
      );
      const userCountRow = await db.get(
        "SELECT COUNT(*) AS count FROM users"
      );
      const latestIdeaRow = await db.get(
        "SELECT submitted_at FROM ideas ORDER BY submitted_at DESC LIMIT 1"
      );

      res.json({
        totalIdeas: ideaCountRow?.count ?? 0,
        totalUsers: userCountRow?.count ?? 0,
        lastSubmissionAt: latestIdeaRow?.submitted_at ?? null,
      });
    } catch (err) {
      console.error("Admin overview error:", err);
      res.status(500).json({ error: "Failed to load overview" });
    }
  }
);

app.get(
  "/api/admin/ideas",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const rows = await db.all(
        "SELECT id, user_id, contact_email, submitter_full_name, track, idea_title, executive_summary, team_members, submitted_at, file_path FROM ideas ORDER BY submitted_at DESC"
      );

      const ideas = rows.map((row) => {
        let teamMembers = [];
        if (row.team_members) {
          const raw = String(row.team_members || "");
          if (raw.includes("[")) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                teamMembers = parsed.map((member) => String(member)).filter(Boolean);
              }
            } catch {
              teamMembers = raw.split(/[,;]+/).map((v) => v.trim()).filter(Boolean);
            }
          } else {
            teamMembers = raw.split(/[,;]+/).map((v) => v.trim()).filter(Boolean);
          }
        }

        let fileMap = null;
        if (row.file_path) {
          try {
            const parsed = JSON.parse(row.file_path);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              fileMap = {
                pdf: parsed.pdf ?? null,
                word: parsed.word ?? null,
              };
            }
          } catch {
            fileMap = { pdf: row.file_path, word: null };
          }
        }

        return {
          id: row.id,
          ownerId: row.user_id,
          title: row.idea_title,
          track: row.track ?? "",
          submitter: row.submitter_full_name ?? "",
          contactEmail: row.contact_email ?? "",
          submittedAt: row.submitted_at,
          executiveSummary: row.executive_summary ?? "",
          teamMembers,
          files: fileMap,
        };
      });

      res.json({ ideas });
    } catch (err) {
      console.error("Admin ideas error:", err);
      res.status(500).json({ error: "Failed to load ideas" });
    }
  }
);

app.get(
  "/api/admin/users",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const users = await db.all(
        "SELECT id, email, name FROM users ORDER BY id ASC"
      );
      const aggregates = await db.all(
        "SELECT user_id, COUNT(*) AS ideas, MAX(submitted_at) AS last_submission FROM ideas GROUP BY user_id"
      );
      const ideaMap = new Map();
      for (const row of aggregates) {
        ideaMap.set(row.user_id, {
          ideas: row.ideas ?? 0,
          lastSubmissionAt: row.last_submission ?? null,
        });
      }

      const result = users.map((user) => {
        const agg = ideaMap.get(user.id) ?? { ideas: 0, lastSubmissionAt: null };
        return {
          id: user.id,
          email: user.email ?? "",
          name: user.name ?? "",
          role: user.role ?? "user",
          ideasCount: agg.ideas ?? 0,
          lastSubmissionAt: agg.lastSubmissionAt,
        };
      });

      if (adminUsername) {
        result.unshift({
          id: "admin",
          email: adminUsername,
          name: "Administrator",
          role: "admin",
          ideasCount: null,
          lastSubmissionAt: null,
        });
      }

      res.json({ users: result });
    } catch (err) {
      console.error("Admin users error:", err);
      res.status(500).json({ error: "Failed to load users" });
    }
  }
);

// Update a user's role (admin only)
app.put(
  "/api/admin/users/:id/role",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!role || !["user", "judge", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      if (id === "admin") {
        return res.status(403).json({ error: "Cannot modify built-in admin" });
      }

      const result = await db.run("UPDATE users SET role = ? WHERE id = ?", [role, id]);
      if (result.changes === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ ok: true });
    } catch (err) {
      console.error("Update user role error:", err);
      res.status(500).json({ error: "Failed to update role" });
    }
  }
);
app.get("/api/user-ideas", ensureAuthenticated, async (req, res) => {
  try {
    const adminView = isAdminUser(req.user);
    let ideas;
    if (adminView) {
      ideas = await db.all(
        "SELECT * FROM ideas ORDER BY submitted_at DESC"
      );
    } else {
      const ownerId = getNumericUserId(req.user);
      if (!Number.isInteger(ownerId)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      ideas = await db.all(
        "SELECT * FROM ideas WHERE user_id = ? ORDER BY submitted_at DESC",
        [ownerId]
      );
    }
    res.json({ ideas });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user ideas" });
  }
});

app.get("/api/recent-ideas", async (req, res) => {
  try {
    const ideas = await db.all(
      "SELECT id, submitter_full_name, track, idea_title, executive_summary, submitted_at FROM ideas ORDER BY submitted_at DESC LIMIT 10"
    );
    res.json({ ideas });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent ideas" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});




