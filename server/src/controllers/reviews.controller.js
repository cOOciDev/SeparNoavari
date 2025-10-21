import mongoose from "mongoose";
import { z } from "zod";
import Review from "../models/Review.js";
import Assignment from "../models/Assignment.js";
import Judge from "../models/Judge.js";
import Idea from "../models/Idea.js";

const reviewSchema = z.object({
  body: z.object({
    ideaId: z.string(),
    scores: z.object({
      novelty: z.number().min(0).max(100),
      feasibility: z.number().min(0).max(100),
      impact: z.number().min(0).max(100),
    }),
    comment: z.string().max(2000).optional(),
  }),
});

const recalcIdeaScore = async (ideaId) => {
  const ideaObjectId = new mongoose.Types.ObjectId(ideaId);
  const summary = await Review.aggregate([
    { $match: { idea: ideaObjectId } },
    {
      $group: {
        _id: "$idea",
        avgNovelty: { $avg: "$scores.novelty" },
        avgFeasibility: { $avg: "$scores.feasibility" },
        avgImpact: { $avg: "$scores.impact" },
        total: { $sum: 1 },
      },
    },
  ]);

  if (summary.length === 0) {
    await Idea.updateOne(
      { _id: ideaId },
      { $set: { "scoreSummary.average": null, "scoreSummary.totalReviews": 0 } }
    );
    return;
  }

  const [row] = summary;
  const overall =
    (row.avgNovelty + row.avgFeasibility + row.avgImpact) / 3;
  await Idea.updateOne(
    { _id: ideaObjectId },
    {
      $set: {
        "scoreSummary.average": Number(overall.toFixed(2)),
        "scoreSummary.totalReviews": row.total,
      },
    }
  );
};

class ReviewsController {
  static async submit(req, res, next) {
    try {
      const {
        body: { ideaId, scores, comment },
      } = reviewSchema.parse({ body: req.body });

      const judge = await Judge.findOne({ user: req.user.id }).lean();
      if (!judge) {
        return res.status(403).json({
          ok: false,
          code: "NOT_JUDGE",
          message: "Judge profile not found",
        });
      }

      const assignment = await Assignment.findOne({
        idea: ideaId,
        judge: judge._id,
      });

      if (!assignment) {
        return res.status(403).json({
          ok: false,
          code: "NOT_ASSIGNED",
          message: "Idea not assigned to this judge",
        });
      }

      const review = await Review.findOneAndUpdate(
        { idea: ideaId, judge: judge._id },
        { scores, comment, submittedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      assignment.status = "REVIEWED";
      await assignment.save();

      await recalcIdeaScore(review.idea);

      const totalAssignments = await Assignment.countDocuments({
        idea: ideaId,
      });
      const reviewedAssignments = await Assignment.countDocuments({
        idea: ideaId,
        status: "REVIEWED",
      });

      if (totalAssignments > 0 && reviewedAssignments === totalAssignments) {
        await Idea.updateOne(
    { _id: ideaObjectId },
          { $set: { status: "DONE" } }
        );
      } else {
        await Idea.updateOne(
          { _id: ideaId },
          { $set: { status: "UNDER_REVIEW" } }
        );
      }

      return res.status(201).json({ ok: true, review });
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
      const judge = await Judge.findOne({ user: req.user.id }).lean();
      if (!judge) {
        return res.status(404).json({
          ok: false,
          code: "NOT_JUDGE",
          message: "Judge profile not found",
        });
      }
      const reviews = await Review.find({ judge: judge._id })
        .populate("idea", "title category status")
        .lean();
      return res.json({ ok: true, reviews });
    } catch (err) {
      return next(err);
    }
  }
}

export default ReviewsController;
