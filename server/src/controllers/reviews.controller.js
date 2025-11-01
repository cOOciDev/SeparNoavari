import mongoose from "mongoose";
import { z } from "zod";
import Review from "../models/Review.js";
import Assignment from "../models/Assignment.js";
import Judge from "../models/Judge.js";
import Idea from "../models/Idea.js";
import { reviewCriteria, reviewCriteriaIds } from "../config/reviewCriteria.js";

const scoresShape = Object.fromEntries(
  reviewCriteriaIds.map((id) => [id, z.number().min(0).max(10)])
);
const reviewSchema = z.object({
  body: z.object({
    ideaId: z.string(),
    scores: z.object(scoresShape),
    comment: z.string().max(2000).optional(),
  }),
});

const recalcIdeaScore = async (ideaId) => {
  const ideaObjectId = new mongoose.Types.ObjectId(ideaId);
  const groupStage = {
    _id: "$idea",
    total: { $sum: 1 },
  };
  reviewCriteriaIds.forEach((id) => {
    groupStage[`avg_${id}`] = { $avg: `$scores.${id}` };
  });

  const summary = await Review.aggregate([
    { $match: { idea: ideaObjectId } },
    { $group: groupStage },
  ]);

  if (summary.length === 0) {
    await Idea.updateOne(
      { _id: ideaId },
      {
        $set: {
          "scoreSummary.average": null,
          "scoreSummary.totalReviews": 0,
          "scoreSummary.criteria": {},
        },
      }
    );
    return;
  }

  const [row] = summary;
  const criteriaAverages = {};
  const numericValues = [];
  reviewCriteriaIds.forEach((id) => {
    const value = row[`avg_${id}`];
    if (value !== null && value !== undefined) {
      const rounded = Number(value.toFixed(2));
      criteriaAverages[id] = rounded;
      numericValues.push(rounded);
    }
  });
  const overall =
    numericValues.length > 0
      ? numericValues.reduce((acc, value) => acc + value, 0) /
        numericValues.length
      : null;

  await Idea.updateOne(
    { _id: ideaObjectId },
    {
      $set: {
        "scoreSummary.average":
          overall === null ? null : Number(overall.toFixed(2)),
        "scoreSummary.totalReviews": row.total,
        "scoreSummary.criteria": criteriaAverages,
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
        {
          $set: {
            scores,
            comment,
            submittedAt: new Date(),
          },
          $setOnInsert: { idea: ideaId, judge: judge._id },
        },
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
        await Idea.updateOne({ _id: ideaId }, { $set: { status: "DONE" } });
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

  static async listForIdea(req, res, next) {
    try {
      const { ideaId } = req.params;
      const idea = await Idea.findById(ideaId).select("_id title").lean();
      if (!idea) {
        return res.status(404).json({
          ok: false,
          code: "NOT_FOUND",
          message: "Idea not found",
        });
      }

      const reviews = await Review.find({ idea: idea._id })
        .populate({
          path: "judge",
          populate: { path: "user", select: "name email" },
        })
        .sort({ createdAt: -1 })
        .lean();

      return res.json({
        ok: true,
        idea: { id: String(idea._id), title: idea.title },
        criteria: reviewCriteria,
        reviews: reviews.map((review) => ({
          id: String(review._id),
          judge: review.judge
            ? {
                id: String(review.judge._id),
                user: review.judge.user
                  ? {
                      id: review.judge.user._id
                        ? String(review.judge.user._id)
                        : review.judge.user.id,
                      name: review.judge.user.name,
                      email: review.judge.user.email,
                    }
                  : undefined,
              }
            : undefined,
          scores: review.scores,
          comment: review.comment,
          submittedAt: review.submittedAt,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        })),
      });
    } catch (err) {
      return next(err);
    }
  }

  static getCriteria(_req, res) {
    return res.json({
      ok: true,
      criteria: reviewCriteria,
    });
  }
}

export default ReviewsController;
