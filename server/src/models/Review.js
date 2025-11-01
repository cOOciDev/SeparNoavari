import mongoose from "mongoose";
import { reviewCriteria, reviewCriteriaIds } from "../config/reviewCriteria.js";

const { Schema } = mongoose;

const scoresDefinition = Object.fromEntries(
  reviewCriteria.map((criterion) => [
    criterion.id,
    { type: Number, min: 0, max: 10, required: true },
  ])
);

const scoresSchema = new Schema(scoresDefinition, { _id: false });

const reviewSchema = new Schema(
  {
    idea: { type: Schema.Types.ObjectId, ref: "Idea", required: true, index: true },
    judge: { type: Schema.Types.ObjectId, ref: "Judge", required: true, index: true },
    scores: { type: scoresSchema, required: true },
    comment: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

reviewSchema.index({ idea: 1, judge: 1 }, { unique: true });

reviewSchema.statics.criteriaIds = () => [...reviewCriteriaIds];

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
