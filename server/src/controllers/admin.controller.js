import bcrypt from "bcrypt";
import { z } from "zod";
import Idea from "../models/Idea.js";
import User from "../models/User.js";
import Judge from "../models/Judge.js";
import Assignment from "../models/Assignment.js";
import Review from "../models/Review.js";
import { assignJudgesManually } from "../services/assignment.service.js";
import { parsePagination, buildPagedResponse } from "../utils/paginate.js";

const roleEnum = ["USER", "JUDGE", "ADMIN"];

const judgeCreateSchema = z.object({
  body: z.object({
    userId: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    password: z.string().min(8).optional(),
    expertise: z.array(z.string()).optional(),
    capacity: z.number().int().positive().optional(),
  }),
});

const updateRoleSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    role: z.enum(["USER", "JUDGE", "ADMIN"]),
  }),
});

const manualAssignmentSchema = z.object({
  body: z.object({
    ideaId: z.string(),
    judgeIds: z.array(z.string()).min(1),
  }),
});

const judgeUpdateSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    capacity: z.number().int().positive().nullable().optional(),
    active: z.boolean().optional(),
  }),
});

class AdminController {
  static async getOverview(req, res, next) {
    try {
      const [ideasCount, usersCount, judgeCount, reviewCount] = await Promise.all(
        [
          Idea.countDocuments(),
          User.countDocuments(),
          Judge.countDocuments({ active: true }),
          Review.countDocuments(),
        ]
      );
      return res.json({
        ok: true,
        metrics: {
          ideas: ideasCount,
          users: usersCount,
          judges: judgeCount,
          reviews: reviewCount,
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  static async listIdeas(req, res, next) {
    try {
      const { limit, page, skip } = parsePagination(req.query);
      const { status, q, category } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (q) {
        filter.$text = { $search: q };
      }

      const [items, total] = await Promise.all([
        Idea.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        Idea.countDocuments(filter),
      ]);

      return res.json({ ok: true, ...buildPagedResponse({ items, total, limit, page }) });
    } catch (err) {
      return next(err);
    }
  }

  static async listUsers(req, res, next) {
    try {
      const users = await User.find().sort({ createdAt: 1 }).lean();
      const assignments = await Assignment.aggregate([
        { $group: { _id: "$assignedBy", total: { $sum: 1 } } },
      ]);
      const assignmentMap = new Map(
        assignments.map((row) => [String(row._id), row.total])
      );
      const result = users.map((user) => ({
        id: String(user._id),
        email: user.email,
        role: user.role,
        name: user.name,
        createdAt: user.createdAt,
        assignmentsAuthored: assignmentMap.get(String(user._id)) || 0,
      }));
      return res.json({ ok: true, users: result });
    } catch (err) {
      return next(err);
    }
  }

  static async updateUserRole(req, res, next) {
    try {
      const { params, body } = updateRoleSchema.parse({
        params: req.params,
        body: req.body,
      });

      if (!roleEnum.includes(body.role)) {
        return res.status(400).json({
          ok: false,
          code: "INVALID_ROLE",
          message: "Invalid role",
        });
      }

      const user = await User.findByIdAndUpdate(
        params.id,
        { role: body.role },
        { new: true }
      ).lean();

      if (!user) {
        return res.status(404).json({
          ok: false,
          code: "USER_NOT_FOUND",
          message: "User not found",
        });
      }

      if (body.role === "JUDGE") {
        await Judge.updateOne(
          { user: user._id },
          { $setOnInsert: { expertise: [], active: true } },
          { upsert: true }
        );
      }

      return res.json({ ok: true, user });
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

  static async createJudge(req, res, next) {
    try {
      const {
        body: { userId, email, name, password, expertise, capacity },
      } = judgeCreateSchema.parse({ body: req.body });

      let targetUser;
      if (userId) {
        targetUser = await User.findById(userId);
      } else if (email) {
        targetUser = await User.findOne({ email: email.toLowerCase() });
        if (!targetUser) {
          if (!password || !name) {
            return res.status(400).json({
              ok: false,
              code: "USER_DATA_REQUIRED",
              message: "name and password are required when creating a judge user",
            });
          }
          targetUser = await User.create({
            email: email.toLowerCase(),
            name,
            passwordHash: await bcrypt.hash(password, 10),
            role: "JUDGE",
          });
        }
      } else {
        return res.status(400).json({
          ok: false,
          code: "USER_IDENTIFIER_REQUIRED",
          message: "Provide userId or email",
        });
      }

      const judgePayload = {
        expertise: expertise || [],
        active: true,
      };
      if (typeof capacity === "number" && capacity > 0) {
        judgePayload.capacity = capacity;
      }

      await Judge.updateOne(
        { user: targetUser._id },
        { $set: judgePayload },
        { upsert: true }
      );

      await User.updateOne(
        { _id: targetUser._id },
        { $set: { role: "JUDGE" } }
      );

      const judgeDoc = await Judge.findOne({ user: targetUser._id })
        .populate("user")
        .lean();

      return res.status(201).json({
        ok: true,
        judge: judgeDoc,
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

  static async listJudges(req, res, next) {
    try {
      const judges = await Judge.find()
        .populate("user", "email name role")
        .lean();
      return res.json({ ok: true, judges });
    } catch (err) {
      return next(err);
    }
  }

  static async updateJudge(req, res, next) {
    try {
      const {
        params: { id },
        body: { capacity, active },
      } = judgeUpdateSchema.parse({ params: req.params, body: req.body });

      const operations = {};
      if (typeof active === "boolean") {
        operations.$set = { ...(operations.$set || {}), active };
      }
      if (capacity !== undefined) {
        if (capacity === null) {
          operations.$unset = { ...(operations.$unset || {}), capacity: "" };
        } else {
          operations.$set = {
            ...(operations.$set || {}),
            capacity,
          };
        }
      }

      if (!operations.$set && !operations.$unset) {
        return res.status(400).json({
          ok: false,
          code: "VALIDATION_ERROR",
          message: "No valid fields to update",
        });
      }

      const result = await Judge.updateOne({ _id: id }, operations);
      if (result.matchedCount === 0) {
        return res.status(404).json({
          ok: false,
          code: "NOT_FOUND",
          message: "Judge not found",
        });
      }

      const judge = await Judge.findById(id)
        .populate("user", "email name role")
        .lean();

      return res.json({
        ok: true,
        judge,
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

  static async listAssignments(req, res, next) {
    try {
      const { ideaId } = req.query;
      const filter = {};
      if (ideaId) {
        filter.idea = ideaId;
      }
      const rows = await Assignment.find(filter)
        .populate("idea", "title category")
        .populate({
          path: "judge",
          populate: { path: "user", select: "name email" },
        })
        .lean();
      return res.json({ ok: true, assignments: rows });
    } catch (err) {
      return next(err);
    }
  }

  static async manualAssign(req, res, next) {
    try {
      const {
        body: { ideaId, judgeIds },
      } = manualAssignmentSchema.parse({ body: req.body });

      const { assignments } = await assignJudgesManually({
        ideaId,
        judgeIds,
        assignedBy: req.user?.id || req.user?._id,
      });

      return res.status(assignments.length > 0 ? 201 : 200).json({
        ok: true,
        assignments: assignments.map((doc) =>
          doc?.toJSON ? doc.toJSON() : doc
        ),
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
      if (err?.status) {
        return res.status(err.status).json({
          ok: false,
          code: err.code || "SERVER_ERROR",
          message: err.message,
          details: err.details,
        });
      }
      return next(err);
    }
  }
}

export default AdminController;
