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
    const baseDir = path.resolve("./uploads");
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
    const uploadDir = req.multerUploadDir || path.resolve("./uploads");
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
}
initializeDb();

// Middleware
const rawAllowedOrigins = (process.env.ALLOWED_ORIGINS || "https://www.separnoavari.ir,https://separnoavari.ir,http://localhost:5173,http://127.0.0.1:5173")
  .split(/[,\s]+/)
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(rawAllowedOrigins);
const isProduction = process.env.NODE_ENV === "production";

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
    secret: "stuff-happens-secret",
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

// Serve uploaded files statically
app.use("/uploads", express.static(path.resolve("./uploads")));

// Passport configuration
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      console.log("Attempting login with email:", email);
      try {
        const user = await db.get("SELECT * FROM users WHERE email = ?", [
          email,
        ]);
        if (!user) {
          console.log("User not found for email:", email);
          return done(null, false, { message: "Invalid email" });
        }
        console.log("User found:", user);
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          console.log("Password mismatch for email:", email);
          return done(null, false, { message: "Invalid password" });
        }
        console.log("Login successful for email:", email);
        return done(null, user);
      } catch (err) {
        console.error("Error during login:", err);
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user ID:", user.id);
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  console.log("Deserializing user with ID:", id);
  try {
    const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);
    console.log("Deserialized user:", user);
    done(null, user);
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
      res.json({ id: user.id, email: user.email });
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
    res.json({ user: { id: req.user.id, email: req.user.email, name: req.user.name } });
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
          req.user.id,
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

app.get("/api/user-ideas", ensureAuthenticated, async (req, res) => {
  try {
    const ideas = await db.all(
      "SELECT * FROM ideas WHERE user_id = ? ORDER BY submitted_at DESC",
      [req.user.id]
    );
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


