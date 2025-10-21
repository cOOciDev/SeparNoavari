import path from "path";
import archiver from "archiver";
import { z } from "zod";
import Idea from "../models/Idea.js";
import Assignment from "../models/Assignment.js";
import Judge from "../models/Judge.js";
import logger from "../utils/logger.js";
import sanitizeFilename from "../utils/sanitizeFilename.js";

const createIdeaSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    summary: z.string().min(50),
    category: z.string().min(1),
    contactEmail: z.string().email(),
    submitterName: z.string().min(1),
    phone: z.string().optional(),
    teamMembers: z
      .array(z.string().min(1))
      .max(10)
      .optional()
      .transform((value) => value ?? []),
  }),
});

const listMineSchema = z.object({
  query: z.object({
    status: z
      .string()
      .optional()
      .transform((value) => value || undefined),
  }),
});

const resolveFilesPayload = (files = {}) => {
  const groups = Object.values(files);
  return groups.flat().map((file) => ({
    originalName: file.originalname,
    storedName: file.filename,
    path: path.relative(process.cwd(), file.path).replace(/\\/g, "/"),
    size: file.size,
    mime: file.mimetype,
    fieldName: file.fieldname,
  }));
};

const canViewIdea = async (idea, user) => {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (String(idea.owner) === String(user.id || user._id)) return true;
  if (user.role === "JUDGE") {
    const judge = await Judge.findOne({ user: user.id || user._id }).lean();
    if (!judge) return false;
    const assignment = await Assignment.findOne({
      idea: idea._id,
      judge: judge._id,
    })
      .lean()
      .exec();
    return Boolean(assignment);
  }
  return false;
};

class IdeasController {
  static async create(req, res, next) {
    try {
      const {
        body: {
          title,
          summary,
          category,
          contactEmail,
          submitterName,
          phone,
          teamMembers,
        },
      } = createIdeaSchema.parse({ body: req.body });

      const files = resolveFilesPayload(req.files);
      if (files.length === 0) {
        return res.status(400).json({
          ok: false,
          code: "FILES_REQUIRED",
          message: "At least one file must be uploaded",
        });
      }

      const idea = await Idea.create({
        owner: req.user.id,
        title,
        summary,
        category,
        contactEmail,
        submitterName,
        phone: phone || "",
        teamMembers,
        files,
      });

      return res.status(201).json({
        ok: true,
        idea: idea.toJSON(),
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

  static async listMine(req, res, next) {
    try {
      const {
        query: { status },
      } = listMineSchema.parse({ query: req.query });
      const filter = {
        owner: req.user.id,
      };
      if (status) {
        filter.status = status;
      }
      const ideas = await Idea.find(filter).sort({ createdAt: -1 }).lean();
      return res.json({ ok: true, items: ideas });
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

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const idea = await Idea.findById(id).lean();
      if (!idea) {
        return res.status(404).json({
          ok: false,
          code: "NOT_FOUND",
          message: "Idea not found",
        });
      }

      const permitted = await canViewIdea(idea, req.user);
      if (!permitted) {
        return res.status(403).json({
          ok: false,
          code: "FORBIDDEN",
          message: "You are not allowed to view this idea",
        });
      }

      return res.json({
        ok: true,
        idea,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async downloadFile(req, res, next) {
    try {
      const { id, fileId } = req.params;
      const idea = await Idea.findById(id).lean();
      if (!idea) {
        return res.status(404).json({
          ok: false,
          code: "NOT_FOUND",
          message: "Idea not found",
        });
      }

      const permitted = await canViewIdea(idea, req.user);
      if (!permitted) {
        return res.status(403).json({
          ok: false,
          code: "FORBIDDEN",
          message: "You are not allowed to access this file",
        });
      }

      const file = idea.files.find(
        (entry) =>
          entry.storedName === fileId ||
          entry.path.endsWith(fileId) ||
          entry.originalName === fileId
      );

      if (!file) {
        return res.status(404).json({
          ok: false,
          code: "FILE_NOT_FOUND",
          message: "File not found",
        });
      }

      const absolutePath = path.resolve(process.cwd(), file.path);
      return res.download(absolutePath, file.originalName);
    } catch (err) {
      return next(err);
    }
  }

  static async downloadArchive(req, res, next) {
    try {
      const { id } = req.params;
      const idea = await Idea.findById(id).lean();
      if (!idea) {
        return res.status(404).json({
          ok: false,
          code: "NOT_FOUND",
          message: "Idea not found",
        });
      }
      const permitted = await canViewIdea(idea, req.user);
      if (!permitted) {
        return res.status(403).json({
          ok: false,
          code: "FORBIDDEN",
          message: "You are not allowed to download this archive",
        });
      }

      const zipName = `${sanitizeFilename(idea.title || "idea")}-${idea._id}.zip`;
      if (!idea.files || idea.files.length === 0) {
        return res.status(404).json({
          ok: false,
          code: "NO_FILES",
          message: "Idea has no uploaded files",
        });
      }
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${zipName}"`
      );

      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("error", (error) => {
        logger.error("Archive creation failed", { error });
        if (!res.headersSent) {
          res.status(500).json({
            ok: false,
            code: "ARCHIVE_FAILED",
            message: "Failed to build archive",
          });
        }
      });

      archive.pipe(res);
      idea.files.forEach((file) => {
        const absolute = path.resolve(process.cwd(), file.path);
        archive.file(absolute, { name: file.originalName });
      });
      archive.finalize();
    } catch (err) {
      return next(err);
    }
  }
}

export default IdeasController;
