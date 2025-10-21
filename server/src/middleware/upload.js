import fs from "fs";
import path from "path";
import multer from "multer";
import env from "../config/env.js";
import sanitizeFilename from "../utils/sanitizeFilename.js";

const ensureDir = (targetPath) => {
  fs.mkdirSync(targetPath, { recursive: true });
};

const resolveBaseDir = () => {
  const resolved = path.resolve(env.uploadDir);
  ensureDir(resolved);
  return resolved;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const baseDir = resolveBaseDir();
      const email =
        req.user?.email ||
        req.body?.contact_email ||
        req.body?.email ||
        req.body?.ownerEmail ||
        "anonymous";
      const safeEmail = sanitizeFilename(email) || "user";
      const userDir = path.join(baseDir, safeEmail);
      ensureDir(userDir);
      req.uploadResolvedDir = userDir;
      cb(null, userDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ideaTitle = sanitizeFilename(req.body?.title || req.body?.idea_title);
    const submitter =
      sanitizeFilename(req.body?.submitter_full_name || req.user?.name) ||
      "user";
    const ts = new Date();
    const stamp = `${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(
      2,
      "0"
    )}${String(ts.getDate()).padStart(2, "0")}-${String(
      ts.getHours()
    ).padStart(2, "0")}${String(ts.getMinutes()).padStart(
      2,
      "0"
    )}${String(ts.getSeconds()).padStart(2, "0")}`;
    const base = [ideaTitle || "idea", submitter, stamp]
      .filter(Boolean)
      .join("_");
    const ext = path.extname(file.originalname) || "";
    let finalName = `${base}${ext}`;
    const directory = req.uploadResolvedDir || resolveBaseDir();
    let candidate = path.join(directory, finalName);
    let counter = 1;
    while (fs.existsSync(candidate)) {
      finalName = `${base}_${counter}${ext}`;
      candidate = path.join(directory, finalName);
      counter += 1;
    }
    cb(null, finalName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "pdf_file") {
    if (file.mimetype === "application/pdf") return cb(null, true);
    return cb(new Error("INVALID_PDF_TYPE"));
  }
  if (file.fieldname === "word_file") {
    if (
      file.mimetype === "application/msword" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return cb(null, true);
    }
    return cb(new Error("INVALID_WORD_TYPE"));
  }
  return cb(null, true);
};

const uploader = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024,
    files: 10,
  },
});

const handleMulterError = (error, res) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      ok: false,
      code: "FILE_TOO_LARGE",
      message: "Each file must be smaller than 30MB",
    });
  }
  if (error.message === "INVALID_PDF_TYPE") {
    return res.status(400).json({
      ok: false,
      code: "INVALID_FILE_TYPE",
      message: "Only PDF allowed for pdf_file field",
    });
  }
  if (error.message === "INVALID_WORD_TYPE") {
    return res.status(400).json({
      ok: false,
      code: "INVALID_FILE_TYPE",
      message: "Only Word documents allowed for word_file field",
    });
  }
  return res.status(400).json({
    ok: false,
    code: "UPLOAD_FAILED",
    message: "Upload failed",
  });
};

export const ideaUpload = (req, res, next) =>
  uploader.fields([
    { name: "pdf_file", maxCount: 1 },
    { name: "word_file", maxCount: 1 },
    { name: "attachments", maxCount: 8 },
  ])(req, res, (err) => {
    if (err) {
      return handleMulterError(err, res);
    }
    return next();
  });
