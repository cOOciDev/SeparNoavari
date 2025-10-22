import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import env from "../src/config/env.js";
import { connectMongo, disconnectMongo } from "../src/config/db.js";
import User from "../src/models/User.js";
import Idea from "../src/models/Idea.js";
import Judge from "../src/models/Judge.js";

const dbFile = path.resolve("database.db");

if (!fs.existsSync(dbFile)) {
  console.error("SQLite database.db not found. Aborting migration.");
  process.exit(1);
}

const db = new sqlite3.Database(dbFile);

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const closeDb = () =>
  new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

const detectMime = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".doc" || ext === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/octet-stream";
};

const toRole = (raw) => {
  if (!raw) return "USER";
  const normalized = String(raw).toUpperCase();
  if (["ADMIN", "JUDGE", "USER"].includes(normalized)) {
    return normalized;
  }
  return "USER";
};

const parseTeamMembers = (raw) => {
  if (!raw) return [];
  try {
    const maybeJson = JSON.parse(raw);
    if (Array.isArray(maybeJson)) {
      return maybeJson.map((item) => String(item)).filter(Boolean);
    }
  } catch {
    // ignore
  }
  return String(raw)
    .split(/[,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseFiles = (raw) => {
  const files = [];
  if (!raw) return files;
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { file: raw };
  }
  const entries = Array.isArray(parsed)
    ? parsed
    : Object.entries(parsed).map(([key, value]) => ({ key, value }));

  entries.forEach(({ key, value }) => {
    if (!value) return;
    const resolvedPath = path.isAbsolute(value)
      ? value
      : path.join(process.cwd(), value);
    const storedName = path.basename(resolvedPath);
    let size = 0;
    try {
      const stat = fs.statSync(resolvedPath);
      size = stat.size;
    } catch {
      // keep zero
    }
    files.push({
      originalName: storedName,
      storedName,
      path: path.relative(process.cwd(), resolvedPath).replace(/\\/g, "/"),
      size,
      mime: detectMime(storedName),
      fieldName: key || "file",
    });
  });
  return files;
};

const run = async () => {
  await connectMongo(env.mongoUri);

  const existingUsers = await User.countDocuments();
  const existingIdeas = await Idea.countDocuments();
  if (existingUsers > 0 || existingIdeas > 0) {
    console.warn(
      "Target MongoDB already contains data. Aborting to avoid duplicates."
    );
    process.exit(1);
  }

  const users = await all(
    "SELECT id, email, password, name, role FROM users ORDER BY id ASC"
  );

  const userIdMap = new Map();
  for (const row of users) {
    const email = row.email?.toLowerCase();
    const passwordHash = row.password?.startsWith("$2")
      ? row.password
      : null;
    if (!passwordHash && row.password) {
      console.warn(
        `User ${email} has a plain password. Marking passwordHash=null; user must reset password.`
      );
    }
    const user = await User.create({
      email,
      passwordHash,
      name: row.name || "",
      role: toRole(row.role),
    });
    userIdMap.set(row.id, user._id);
  }

  const ideas = await all(
    `SELECT id, user_id, contact_email, submitter_full_name, track, phone,
            team_members, idea_title, executive_summary, file_path, submitted_at
     FROM ideas
     ORDER BY id ASC`
  );

  for (const row of ideas) {
    const ownerId = userIdMap.get(row.user_id);
    if (!ownerId) {
      console.warn(
        `Skipping idea ${row.id} because owner ${row.user_id} was not migrated`
      );
      continue;
    }
    await Idea.create({
      owner: ownerId,
      title: row.idea_title || "Untitled idea",
      summary: row.executive_summary || "",
      category: row.track || "general",
      contactEmail: row.contact_email || "",
      submitterName: row.submitter_full_name || "",
      phone: row.phone || "",
      teamMembers: parseTeamMembers(row.team_members),
      files: parseFiles(row.file_path),
      createdAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
      updatedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
    });
  }

  for (const row of users) {
    const role = toRole(row.role);
    if (role === "JUDGE") {
      const userId = userIdMap.get(row.id);
      if (!userId) continue;
      await Judge.updateOne(
        { user: userId },
        { $setOnInsert: { active: true, expertise: [] } },
        { upsert: true }
      );
    }
  }

  await closeDb();
  await disconnectMongo();
  console.log("Migration completed successfully.");
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed", err);
    process.exit(1);
  });
