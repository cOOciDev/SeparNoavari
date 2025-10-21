import mongoose from "mongoose";

const { Schema } = mongoose;

const scoresSchema = new Schema(
  {
    novelty: { type: Number, min: 0, max: 100, required: true },
    feasibility: { type: Number, min: 0, max: 100, required: true },
    impact: { type: Number, min: 0, max: 100, required: true },
  },
  { _id: false }
);

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

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
