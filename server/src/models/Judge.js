import mongoose from "mongoose";
import env from "../config/env.js";

const { Schema } = mongoose;

const judgeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expertise: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    capacity: {
      type: Number,
      min: 1,
      default: () =>
        env.judgeDefaultCapacity > 0 ? env.judgeDefaultCapacity : undefined,
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

// canonical unique index for judge-user relationship
judgeSchema.index({ user: 1 }, { unique: true });

const Judge = mongoose.models.Judge || mongoose.model("Judge", judgeSchema);

export default Judge;
