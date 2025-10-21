import mongoose from "mongoose";

const { Schema } = mongoose;

const assignmentSchema = new Schema(
  {
    idea: { type: Schema.Types.ObjectId, ref: "Idea", required: true, index: true },
    judge: { type: Schema.Types.ObjectId, ref: "Judge", required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["PENDING", "REVIEWED"],
      default: "PENDING",
      index: true,
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

assignmentSchema.index({ idea: 1, judge: 1 }, { unique: true });

const Assignment =
  mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);

export default Assignment;
