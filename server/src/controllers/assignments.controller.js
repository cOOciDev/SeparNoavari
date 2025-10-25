import fs from "fs";
import path from "path";
import archiver from "archiver";
import multer from "multer";
import mongoose from "mongoose";
import Assignment from "../models/Assignment.js";
import Idea from "../models/Idea.js";
import Judge from "../models/Judge.js";
import logger from "../utils/logger.js";
import env from "../config/env.js";
import sanitizeFilename from "../utils/sanitizeFilename.js";
import {
  ensureGeneratedTemplate,
  getFinalSummaryAbsolutePath,
  getSubmissionAbsolutePath,
  getTemplateAbsolutePath,
  resolveStaticTemplate,
  resolveFinalSummaryTarget,
  resolveSubmissionTarget,
} from "../services/assignmentFiles.service.js";

const { ObjectId } = mongoose.Types;

const isObjectId = (value) => ObjectId.isValid(String(value));

const respondError = (res, status, code, message, details) => {
  const payload = { ok: false, code, message };
  if (details !== undefined) {
    payload.details = details;
  }
  return res.status(status).json(payload);
};

const pushAuditEvent = (assignment, type, meta) => {
  const event = {
    at: new Date(),
    type,
    ...(meta ? { meta } : {}),
  };
  if (!assignment.audit) {
    assignment.audit = {
      createdAt: new Date(),
      updatedAt: new Date(),
      events: [event],
    };
  } else {
    assignment.audit.events = Array.isArray(assignment.audit.events)
      ? assignment.audit.events
      : [];
    assignment.audit.events.push(event);
    assignment.audit.updatedAt = new Date();
  }
  assignment.markModified?.("audit");
};

const pickUserId = (user) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  if (user.id) return String(user.id);
  if (user._id) return String(user._id);
  return null;
};

const ensureAssignment = async (id) => {
  if (!isObjectId(id)) {
    return null;
  }
  const assignment = await Assignment.findById(id)
    .populate({
      path: "judge",
      populate: { path: "user", select: "name email role" },
    })
    .populate("idea", "title status owner category")
    .exec();
  return assignment;
};

const ensureIdea = async (id) => {
  if (!isObjectId(id)) {
    return null;
  }
  return Idea.findById(id).select("title status").exec();
};

const ensureAccess = (assignment, user, { allowAdmin, allowJudge }) => {
  const role = user?.role;
  const userId = pickUserId(user);
  const judgeUserId = pickUserId(assignment?.judge?.user);
  const isAdmin = role === "ADMIN";
  const isJudgeOwner =
    judgeUserId && userId && String(judgeUserId) === String(userId);

  if ((allowAdmin && isAdmin) || (allowJudge && isJudgeOwner)) {
    return { isAdmin, isJudgeOwner };
  }

  return null;
};

const buildSubmissionDownloadUrl = (assignmentId) =>
  `/api/admin/assignments/${encodeURIComponent(assignmentId)}/submission`;

const presentAssignment = (assignment) => {
  const doc = assignment.toJSON ? assignment.toJSON() : assignment;
  const ideaId = doc.idea?._id || doc.idea?.id || doc.idea;
  const judgeUser = doc.judge?.user;
  const judgeId = doc.judge?._id || doc.judge?.id || doc.judge;
  const assignmentId = doc.id || String(doc._id);
  return {
    id: assignmentId,
    idea: doc.idea
      ? {
          id: String(ideaId),
          title: doc.idea.title,
          status: doc.idea.status,
        }
      : undefined,
    judge: doc.judge
      ? {
          id: String(judgeId),
          user: judgeUser
            ? {
                id: pickUserId(judgeUser),
                name: judgeUser.name,
                email: judgeUser.email,
              }
            : undefined,
        }
      : undefined,
    status: doc.status,
    allowReuploadUntilLock: doc.allowReuploadUntilLock !== false,
    deadline: doc.deadline,
    template: {
      source: doc.template?.source || env.assignment.templateMode,
      filename: doc.template?.filename || "evaluation-template.docx",
      available:
        !!doc.template?.url || doc.template?.source === "STATIC" || false,
      url: `/api/admin/assignments/${assignmentId}/template`,
    },
    submission: doc.submission
      ? {
          filename: doc.submission.filename,
          mimetype: doc.submission.mimetype,
          size: doc.submission.size,
          uploadedAt: doc.submission.uploadedAt,
          version: doc.submission.version,
          downloadUrl: buildSubmissionDownloadUrl(assignmentId),
        }
      : null,
    audit: doc.audit
      ? {
          createdAt: doc.audit.createdAt,
          updatedAt: doc.audit.updatedAt,
          events: doc.audit.events,
        }
      : undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const buildFinalSummaryPayload = (ideaId, summary) => {
  if (!summary) {
    return null;
  }
  return {
    filename: summary.filename,
    mimetype: summary.mimetype,
    size: summary.size,
    uploadedAt: summary.uploadedAt,
    downloadUrl: `/api/admin/ideas/${encodeURIComponent(
      ideaId
    )}/final-summary/file`,
  };
};

const allowedMimeTypes = () => {
  const base = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (env.assignment.allowPdf) {
    base.push("application/pdf");
  }
  return new Set(base);
};

const buildUploader = ({ assignment, nextVersion }) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const meta = resolveSubmissionTarget({
          assignment,
          version: nextVersion,
          originalName: file.originalname,
        });
        req.assignmentUploadMeta = meta;
        cb(null, path.dirname(meta.absolutePath));
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, _file, cb) => {
      const meta = req.assignmentUploadMeta;
      if (!meta) {
        cb(new Error("UPLOAD_PATH_RESOLUTION_FAILED"));
        return;
      }
      cb(null, meta.filename);
    },
  });

  const allowed = allowedMimeTypes();

  const filter = (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      const error = new Error("INVALID_FILE_TYPE");
      error.code = "INVALID_FILE_TYPE";
      return cb(error);
    }
    return cb(null, true);
  };

  return multer({
    storage,
    fileFilter: filter,
    limits: {
      files: 1,
      fileSize: env.assignment.maxFileSizeMb * 1024 * 1024,
    },
  });
};

const buildFinalSummaryUploader = (idea) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const meta = resolveFinalSummaryTarget({
          ideaId: idea._id,
          originalName: file.originalname,
        });
        req.finalSummaryUploadMeta = meta;
        cb(null, path.dirname(meta.absolutePath));
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, _file, cb) => {
      const meta = req.finalSummaryUploadMeta;
      if (!meta) {
        cb(new Error("UPLOAD_PATH_RESOLUTION_FAILED"));
        return;
      }
      cb(null, meta.filename);
    },
  });

  const allowed = allowedMimeTypes();

  const filter = (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      const error = new Error("INVALID_FILE_TYPE");
      error.code = "INVALID_FILE_TYPE";
      return cb(error);
    }
    return cb(null, true);
  };

  return multer({
    storage,
    fileFilter: filter,
    limits: {
      files: 1,
      fileSize: env.assignment.maxFileSizeMb * 1024 * 1024,
    },
  });
};

const runUploader = (uploader, req, res) =>
  new Promise((resolve, reject) => {
    uploader.single("file")(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

class AssignmentsController {
  static async getAssignment(req, res, next) {
    try {
      const assignment = await ensureAssignment(req.params.id);
      if (!assignment) {
        return respondError(res, 404, "NOT_FOUND", "Assignment not found");
      }

      const access = ensureAccess(assignment, req.user, {
        allowAdmin: true,
        allowJudge: true,
      });
      if (!access) {
        return respondError(res, 403, "FORBIDDEN", "Access denied");
      }

      return res.json({ ok: true, assignment: presentAssignment(assignment) });
    } catch (err) {
      return next(err);
    }
  }

  static async listForIdea(req, res, next) {
    try {
      const idea = await ensureIdea(req.params.ideaId);
      if (!idea) {
        return respondError(res, 404, "NOT_FOUND", "Idea not found");
      }
      if (req.user?.role !== "ADMIN") {
        return respondError(
          res,
          403,
          "FORBIDDEN",
          "Administrator role required"
        );
      }

      const assignments = await Assignment.find({ idea: idea._id })
        .populate({
          path: "judge",
          populate: { path: "user", select: "name email role" },
        })
        .populate("idea", "title status")
        .exec();

      return res.json({
        ok: true,
        assignments: assignments.map(presentAssignment),
        meta: {
          total: assignments.length,
          maxJudges: env.maxJudgesPerIdea,
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  static async downloadTemplate(req, res, next) {
    try {
      const assignment = await ensureAssignment(req.params.id);
      if (!assignment) {
        return respondError(res, 404, "NOT_FOUND", "Assignment not found");
      }

      const access = ensureAccess(assignment, req.user, {
        allowAdmin: true,
        allowJudge: true,
      });
      if (!access) {
        return respondError(res, 403, "FORBIDDEN", "Access denied");
      }

      const strategy = assignment.template?.source || env.assignment.templateMode;
      let absolutePath;
      let downloadName;
      let saveNeeded = false;

      if (strategy === "STATIC") {
        const { absolutePath: staticPath, downloadName: staticName } =
          resolveStaticTemplate();
        absolutePath = staticPath;
        downloadName = assignment.template?.filename || staticName;
      } else if (strategy === "GENERATED") {
        const result = ensureGeneratedTemplate({
          assignment,
          idea: assignment.idea,
          judge: assignment.judge,
        });
        if (!assignment.template) {
          assignment.template = {};
        }
        if (assignment.template.url !== result.relativePath) {
          assignment.template.url = result.relativePath;
          saveNeeded = true;
        }
        if (assignment.template.filename !== result.filename) {
          assignment.template.filename = result.filename;
          saveNeeded = true;
        }
        absolutePath = result.absolutePath;
        downloadName = result.filename;
      } else {
        const templateUrl = assignment.template?.url;
        if (!templateUrl) {
          return respondError(
            res,
            404,
            "NOT_FOUND",
            "Template not available for this assignment"
          );
        }
        absolutePath = getTemplateAbsolutePath(templateUrl);
        downloadName =
          assignment.template?.filename || path.basename(absolutePath);
      }

      if (
        access.isJudgeOwner &&
        ["PENDING", "IN_PROGRESS"].includes(assignment.status)
      ) {
        assignment.status = "IN_PROGRESS";
        saveNeeded = true;
      }

      pushAuditEvent(assignment, "template_downloaded", {
        byRole: access.isAdmin ? "ADMIN" : "JUDGE",
        status: assignment.status,
      });
      saveNeeded = true;

      if (saveNeeded) {
        await assignment.save();
      }

      logger.info("Assignment template download", {
        assignmentId: String(assignment._id),
        ideaId: String(assignment.idea?._id || assignment.idea),
        judgeId: String(assignment.judge?._id || assignment.judge),
        source: strategy,
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(downloadName)}"`
      );

      const stream = fs.createReadStream(absolutePath);
      stream.on("error", (error) => {
        logger.error("Template streaming failed", {
          assignmentId: String(assignment._id),
          error: error.message,
        });
        if (!res.headersSent) {
          respondError(res, 500, "TEMPLATE_STREAM_ERROR", "Failed to stream template");
        } else {
          res.destroy(error);
        }
      });
      stream.pipe(res);
    } catch (err) {
      return next(err);
    }
  }

  static async submit(req, res, next) {
    try {
      const assignment = await ensureAssignment(req.params.id);
      if (!assignment) {
        return respondError(res, 404, "NOT_FOUND", "Assignment not found");
      }

      const access = ensureAccess(assignment, req.user, {
        allowAdmin: false,
        allowJudge: true,
      });
      if (!access || !access.isJudgeOwner) {
        return respondError(res, 403, "FORBIDDEN", "Only the assigned judge may upload");
      }
      if (assignment.status === "LOCKED") {
        return respondError(
          res,
          423,
          "ASSIGNMENT_LOCKED",
          "Assignment is locked; uploads are no longer allowed"
        );
      }

      const nextVersion = (assignment.submission?.version || 0) + 1;
      const uploader = buildUploader({ assignment, nextVersion });

      try {
        await runUploader(uploader, req, res);
      } catch (uploadErr) {
        if (uploadErr?.code === "LIMIT_FILE_SIZE") {
          return respondError(
            res,
            400,
            "FILE_TOO_LARGE",
            `File exceeds ${env.assignment.maxFileSizeMb}MB limit`
          );
        }
        if (uploadErr?.code === "INVALID_FILE_TYPE") {
          return respondError(
            res,
            400,
            "INVALID_FILE_TYPE",
            env.assignment.allowPdf
              ? "Only DOCX or PDF files are allowed"
              : "Only DOCX files are allowed"
          );
        }
        return respondError(
          res,
          400,
          "UPLOAD_FAILED",
          "Upload failed, please try again",
          uploadErr?.message
        );
      }

      const file = req.file;
      const meta = req.assignmentUploadMeta;
      if (!file || !meta) {
        return respondError(
          res,
          400,
          "UPLOAD_FAILED",
          "No file was uploaded"
        );
      }

      assignment.submission = {
        url: meta.relativePath,
        filename: meta.filename,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
        version: nextVersion,
      };
      assignment.status = "SUBMITTED";

      pushAuditEvent(assignment, "submission_uploaded", {
        version: nextVersion,
        size: file.size,
      });

      await assignment.save();

      logger.info("Assignment submission uploaded", {
        assignmentId: String(assignment._id),
        ideaId: String(assignment.idea?._id || assignment.idea),
        judgeId: String(assignment.judge?._id || assignment.judge),
        size: file.size,
        mimetype: file.mimetype,
        version: nextVersion,
      });

      return res.status(201).json({
        ok: true,
        assignment: presentAssignment(assignment),
      });
    } catch (err) {
      return next(err);
    }
  }

  static async downloadSubmission(req, res, next) {
    try {
      const assignment = await ensureAssignment(req.params.id);
      if (!assignment || !assignment.submission?.url) {
        return respondError(res, 404, "NOT_FOUND", "Submission not found");
      }
      const access = ensureAccess(assignment, req.user, {
        allowAdmin: true,
        allowJudge: true,
      });
      if (!access) {
        return respondError(res, 403, "FORBIDDEN", "Access denied");
      }

      try {
        const absolutePath = getSubmissionAbsolutePath(
          assignment.submission.url
        );
        res.setHeader("Content-Type", assignment.submission.mimetype);
        return res.download(absolutePath, assignment.submission.filename);
      } catch (error) {
        return respondError(
          res,
          404,
          "NOT_FOUND",
          "Submission file missing on server"
        );
      }
    } catch (err) {
      return next(err);
    }
  }

  static async lock(req, res, next) {
    try {
      const assignment = await ensureAssignment(req.params.id);
      if (!assignment) {
        return respondError(res, 404, "NOT_FOUND", "Assignment not found");
      }

      const access = ensureAccess(assignment, req.user, {
        allowAdmin: true,
        allowJudge: false,
      });
      if (!access || !access.isAdmin) {
        return respondError(res, 403, "FORBIDDEN", "Administrator role required");
      }

      if (assignment.status !== "LOCKED") {
        assignment.status = "LOCKED";
        assignment.allowReuploadUntilLock = false;
        pushAuditEvent(assignment, "assignment_locked", {
          by: pickUserId(req.user),
        });
        await assignment.save();

        logger.info("Assignment locked", {
          assignmentId: String(assignment._id),
          ideaId: String(assignment.idea?._id || assignment.idea),
          judgeId: String(assignment.judge?._id || assignment.judge),
        });
      }

      return res.json({
        ok: true,
        assignment: presentAssignment(assignment),
      });
    } catch (err) {
      return next(err);
    }
  }

  static async remove(req, res, next) {
    try {
      const assignment = await ensureAssignment(req.params.id);
      if (!assignment) {
        return respondError(res, 404, "NOT_FOUND", "Assignment not found");
      }

      const access = ensureAccess(assignment, req.user, {
        allowAdmin: true,
        allowJudge: false,
      });
      if (!access || !access.isAdmin) {
        return respondError(res, 403, "FORBIDDEN", "Administrator role required");
      }
      if (assignment.status === "LOCKED") {
        return respondError(
          res,
          423,
          "ASSIGNMENT_LOCKED",
          "Locked assignments cannot be removed"
        );
      }

      await Assignment.deleteOne({ _id: assignment._id }).exec();

      logger.info("Assignment removed", {
        assignmentId: String(assignment._id),
        ideaId: String(assignment.idea?._id || assignment.idea),
        judgeId: String(assignment.judge?._id || assignment.judge),
      });

      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  }

  static async listMine(req, res, next) {
    try {
      const judge = await Judge.findOne({ user: req.user.id || req.user._id })
        .lean()
        .exec();
      if (!judge) {
        return respondError(
          res,
          404,
          "JUDGE_PROFILE_MISSING",
          "Judge profile not found"
        );
      }
      const assignments = await Assignment.find({ judge: judge._id })
        .populate("idea", "title status")
        .populate({
          path: "judge",
          populate: { path: "user", select: "name email role" },
        })
        .exec();
      return res.json({
        ok: true,
        assignments: assignments.map(presentAssignment),
      });
    } catch (err) {
      return next(err);
    }
  }

  static async downloadArchive(req, res, next) {
    try {
      const idea = await ensureIdea(req.params.ideaId);
      if (!idea) {
        return respondError(res, 404, "NOT_FOUND", "Idea not found");
      }

      const role = req.user?.role;
      if (role !== "ADMIN") {
        return respondError(res, 403, "FORBIDDEN", "Administrator role required");
      }

      const assignments = await Assignment.find({
        idea: idea._id,
        submission: { $exists: true },
      })
        .select("submission judge")
        .populate({
          path: "judge",
          populate: { path: "user", select: "email name" },
        })
        .exec();

      const withSubmission = assignments.filter(
        (doc) => doc.submission && doc.submission.url
      );

      if (withSubmission.length === 0) {
        return respondError(
          res,
          404,
          "NOT_FOUND",
          "No submissions available for this idea"
        );
      }

      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("error", (error) => {
        logger.error("Archive generation failed", {
          ideaId: String(idea._id),
          error: error.message,
        });
        if (!res.headersSent) {
          respondError(res, 500, "ARCHIVE_FAILED", "Failed to build archive");
        } else {
          res.destroy(error);
        }
      });

      res.setHeader("Content-Type", "application/zip");
      const archiveName = `idea-${String(idea._id)}-submissions.zip`;
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(archiveName)}"`
      );

      archive.pipe(res);

      for (const doc of withSubmission) {
        try {
          const submissionPath = getSubmissionAbsolutePath(doc.submission.url);
          const judgeId = String(doc.judge?._id || doc.judge);
          const version = doc.submission.version || 1;
          const zippedName = `judge-${judgeId}-v${version}-${doc.submission.filename}`;
          if (fs.existsSync(submissionPath)) {
            archive.file(submissionPath, { name: zippedName });
          }
        } catch (error) {
          logger.warn("Skipping submission in archive", {
            assignmentId: String(doc._id),
            error: error.message,
          });
        }
      }

      archive.finalize();

      logger.info("Assignment submissions archive requested", {
        ideaId: String(idea._id),
        total: withSubmission.length,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async uploadFinalSummary(req, res, next) {
    try {
      const idea = await Idea.findById(req.params.ideaId).exec();
      if (!idea) {
        return respondError(res, 404, "NOT_FOUND", "Idea not found");
      }
      if (req.user?.role !== "ADMIN") {
        return respondError(
          res,
          403,
          "FORBIDDEN",
          "Administrator role required"
        );
      }

      const uploader = buildFinalSummaryUploader(idea);
      try {
        await runUploader(uploader, req, res);
      } catch (uploadErr) {
        if (uploadErr?.code === "LIMIT_FILE_SIZE") {
          return respondError(
            res,
            400,
            "FILE_TOO_LARGE",
            `File exceeds ${env.assignment.maxFileSizeMb}MB limit`
          );
        }
        if (uploadErr?.code === "INVALID_FILE_TYPE") {
          return respondError(
            res,
            400,
            "INVALID_FILE_TYPE",
            env.assignment.allowPdf
              ? "Only DOCX or PDF files are allowed"
              : "Only DOCX files are allowed"
          );
        }
        return respondError(
          res,
          400,
          "UPLOAD_FAILED",
          "Upload failed, please try again"
        );
      }

      const file = req.file;
      const meta = req.finalSummaryUploadMeta;
      if (!file || !meta) {
        return respondError(res, 400, "UPLOAD_FAILED", "No file was uploaded");
      }

      if (idea.finalSummary?.url && idea.finalSummary.url !== meta.relativePath) {
        try {
          const previousPath = getFinalSummaryAbsolutePath(
            idea.finalSummary.url
          );
          if (fs.existsSync(previousPath)) {
            fs.unlinkSync(previousPath);
          }
        } catch (error) {
          logger.warn("Failed to clean up previous final summary file", {
            ideaId: String(idea._id),
            error: error.message,
          });
        }
      }

      idea.finalSummary = {
        url: meta.relativePath,
        filename: meta.filename,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      };

      await idea.save();

      logger.info("Final summary uploaded", {
        ideaId: String(idea._id),
        size: file.size,
        mimetype: file.mimetype,
      });

      return res.status(201).json({
        ok: true,
        summary: buildFinalSummaryPayload(idea._id, idea.finalSummary),
      });
    } catch (err) {
      return next(err);
    }
  }

  static async getFinalSummaryMeta(req, res, next) {
    try {
      const idea = await Idea.findById(req.params.ideaId)
        .select("finalSummary")
        .lean()
        .exec();
      if (!idea) {
        return respondError(res, 404, "NOT_FOUND", "Idea not found");
      }
      if (req.user?.role !== "ADMIN") {
        return respondError(
          res,
          403,
          "FORBIDDEN",
          "Administrator role required"
        );
      }

      return res.json({
        ok: true,
        summary: buildFinalSummaryPayload(req.params.ideaId, idea.finalSummary),
      });
    } catch (err) {
      return next(err);
    }
  }

  static async downloadFinalSummary(req, res, next) {
    try {
      const idea = await Idea.findById(req.params.ideaId)
        .select("finalSummary title")
        .lean()
        .exec();
      if (!idea || !idea.finalSummary?.url) {
        return respondError(res, 404, "NOT_FOUND", "Final summary not found");
      }
      if (req.user?.role !== "ADMIN") {
        return respondError(
          res,
          403,
          "FORBIDDEN",
          "Administrator role required"
        );
      }
      try {
        const absolutePath = getFinalSummaryAbsolutePath(
          idea.finalSummary.url
        );
        const downloadName =
          idea.finalSummary.filename ||
          `${sanitizeFilename(idea.title || "idea")}-summary.docx`;
        res.setHeader("Content-Type", idea.finalSummary.mimetype);
        return res.download(absolutePath, downloadName);
      } catch (error) {
        return respondError(
          res,
          404,
          "NOT_FOUND",
          "Final summary file missing on server"
        );
      }
    } catch (err) {
      return next(err);
    }
  }
}

export default AssignmentsController;
