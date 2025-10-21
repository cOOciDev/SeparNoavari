import mongoose from "mongoose";

const { Schema } = mongoose;

const fileSchema = new Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    mime: { type: String, required: true },
    fieldName: { type: String, required: true },
  },
  { _id: false }
);

const ideaSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    category: { type: String, required: true, index: true },
    contactEmail: { type: String, required: true },
    submitterName: { type: String, required: true },
    phone: { type: String, default: "" },
    teamMembers: { type: [String], default: [] },
    files: { type: [fileSchema], default: [] },
    status: {
      type: String,
      enum: ["SUBMITTED", "UNDER_REVIEW", "DONE", "REJECTED"],
      default: "SUBMITTED",
      index: true,
    },
    scoreSummary: {
      average: { type: Number, default: null },
      totalReviews: { type: Number, default: 0 },
    },
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

ideaSchema.index({ title: "text", summary: "text", category: "text" });

const Idea = mongoose.models.Idea || mongoose.model("Idea", ideaSchema);

export default Idea;
