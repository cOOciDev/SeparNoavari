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

const app = express();
const port = 5501;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

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
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: "stuff-happens-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // For development (HTTP)
      httpOnly: true,
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
    res.json({ user: { id: req.user.id, email: req.user.email } });
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
    res
      .status(201)
      .json({
        message: "User created",
        userId: result.lastID,
        userEmail: email,
        userName: name,
      });
  } catch (err) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post(
  "/api/submit-idea",
  ensureAuthenticated,
  upload.single("file"),
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
    const file_path = req.file ? req.file.path : null;
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
