/* eslint-disable no-console */
import "dotenv/config.js";
import bcrypt from "bcryptjs";
import { connectMongo, disconnectMongo, initIndexes } from "../config/db.js";
import logger from "../utils/logger.js";

// ⇩ import your existing models
import User from "../models/User.js";            // ensure it exists
import Judge from "../models/Judge.js";          // optional, not required
import Idea from "../models/Idea.js";            // optional, not required
import Assignment from "../models/Assignment.js";// ensures model registered
import SystemSettings from "../models/SystemSettings.js";

const redactedUri = (process.env.MONGO_URI || "").replace(/:\/\/.*:.*@/, "://***:***@");
const argv = process.argv.slice(2);
const isDryRun = argv.includes("--dry-run");
const resetAdminPass = argv.includes("--reset-admin-password");

// Helpers
function bool(v, def = false) {
  if (v === undefined) return def;
  if (typeof v === "boolean") return v;
  return String(v).toLowerCase() === "true";
}

function int(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

async function upsertSuperAdmin({ email, name, password }) {
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }

  const existing = await User.findOne({ email }).lean();
  if (!existing) {
    if (isDryRun) {
      logger.info(`[DRY] Would create super-admin: ${email}`);
      return null;
    }
    const hash = await bcrypt.hash(password, 12);
    const doc = await User.create({
      email,
      name: name || "Administrator",
      role: "ADMIN",          // adjust if your enum differs
      active: true,           // if your schema supports it
      password: hash,         // or passwordHash if your field is named so
    });
    logger.info(`Super-admin created: ${email} (id=${doc._id})`);
    return doc;
  }

  // Exists → ensure role/admin and optionally reset password
  if (isDryRun) {
    logger.info(`[DRY] Would update existing admin: ${email} (role=ADMIN${resetAdminPass ? ", reset password" : ""})`);
    return null;
  }

  const update = { role: "ADMIN", active: true };
  if (resetAdminPass) {
    update.password = await bcrypt.hash(password, 12);
  }
  const res = await User.findOneAndUpdate({ email }, update, { new: true });
  logger.info(`Super-admin ensured: ${email} (id=${res._id})${resetAdminPass ? " [password reset]" : ""}`);
  return res;
}

async function upsertSettings() {
  const maxJudgesPerIdea = int(process.env.MAX_JUDGES_PER_IDEA, 10);
  const evalMaxFileMb = int(process.env.EVAL_MAX_FILE_MB, 30);
  const evalAllowPdf = bool(process.env.EVAL_ALLOW_PDF, false);

  const payload = {
    maxJudgesPerIdea,
    evalMaxFileMb,
    evalAllowPdf,
  };

  if (isDryRun) {
    logger.info(`[DRY] Would upsert settings key="core": ${JSON.stringify(payload)}`);
    return;
  }

  await SystemSettings.updateOne(
    { key: "core" },
    { $set: { value: payload } },
    { upsert: true }
  );

  logger.info(`System settings upserted: ${JSON.stringify(payload)}`);
}

async function seedTracksIfAny() {
  // Optional seed from JSON: server/src/AppData/tracks.seed.json
  try {
    const { default: fs } = await import("node:fs");
    const { default: path } = await import("node:path");
    const seedPath = path.resolve(process.cwd(), "src", "AppData", "tracks.seed.json");
    if (!fs.existsSync(seedPath)) {
      logger.info("No tracks.seed.json found — skipping tracks seed.");
      return;
    }
    const raw = fs.readFileSync(seedPath, "utf8");
    const items = JSON.parse(raw);
    if (!Array.isArray(items) || items.length === 0) {
      logger.info("tracks.seed.json is empty — skipping.");
      return;
    }

    // Expect your Track model; if you don't have one, skip
    try {
      const { default: Track } = await import("../models/Track.js");
      let upserts = 0;
      for (const it of items) {
        const q = { slug: it.slug };
        const update = { $set: it };
        if (!isDryRun) {
          await Track.updateOne(q, update, { upsert: true });
        }
        upserts++;
      }
      logger.info(`${isDryRun ? "[DRY] " : ""}Tracks upserted: ${upserts}`);
    } catch {
      logger.info("No Track model found — skipping tracks seed.");
    }
  } catch (e) {
    logger.warn("Failed to seed tracks (ignored)", { message: e?.message });
  }
}

async function main() {
  console.log(`[init-db] Connecting to ${redactedUri}`);

  await connectMongo(process.env.MONGO_URI);

  if (bool(process.env.SYNC_INDEXES_AT_STARTUP, false)) {
    console.log(`[init-db] syncIndexes start…`);
    await initIndexes();
  } else {
    console.log(`[init-db] syncIndexes skipped (set SYNC_INDEXES_AT_STARTUP=true to enable)`);
  }

  // Ensure unique (idea, judge) compound index is in place via model load (Assignment imported)
  console.log("[init-db] Ensuring super-admin & settings…");

  await upsertSuperAdmin({
    email: process.env.ADMIN_EMAIL,
    name: process.env.ADMIN_NAME,
    password: process.env.ADMIN_PASSWORD,
  });

  await upsertSettings();

  await seedTracksIfAny();

  console.log("[init-db] ✅ Completed successfully.");
  await disconnectMongo();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("[init-db] ❌ Failed:", err?.message);
  try { await disconnectMongo(); } catch {}
  process.exit(1);
});
