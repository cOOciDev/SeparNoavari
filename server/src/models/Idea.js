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

const evaluationFileSchema = new Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
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
    assignedJudges: {
      type: [{ type: Schema.Types.ObjectId, ref: "Judge" }],
      default: [],
    },
    status: {
      type: String,
      enum: ["SUBMITTED", "UNDER_REVIEW", "DONE", "REJECTED"],
      default: "SUBMITTED",
      index: true,
    },
    scoreSummary: {
      average: { type: Number, default: null },
      totalReviews: { type: Number, default: 0 },
      criteria: {
        type: Map,
        of: Number,
        default: () => new Map(),
      },
    },
    finalSummary: {
      type: evaluationFileSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        if (Array.isArray(ret.assignedJudges)) {
          ret.assignedJudges = ret.assignedJudges.map((id) => String(id));
        }
        if (ret.scoreSummary?.criteria instanceof Map) {
          ret.scoreSummary.criteria = Object.fromEntries(
            ret.scoreSummary.criteria.entries()
          );
        } else if (
          ret.scoreSummary?.criteria &&
          typeof ret.scoreSummary.criteria === "object"
        ) {
          Object.keys(ret.scoreSummary.criteria).forEach((key) => {
            const value = ret.scoreSummary.criteria[key];
            if (value !== null && value !== undefined) {
              ret.scoreSummary.criteria[key] = Number(value);
            }
          });
        }
        return ret;
      },
    },
  }
);

ideaSchema.index({ title: "text", summary: "text", category: "text" });

const Idea = mongoose.models.Idea || mongoose.model("Idea", ideaSchema);

export default Idea;
