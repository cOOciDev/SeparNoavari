import mongoose from "mongoose";

const { Schema } = mongoose;

const systemSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    // normalized value bag
    value: {
      type: Schema.Types.Mixed,
      default: {},
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

const SystemSettings =
  mongoose.models.SystemSettings ||
  mongoose.model("SystemSettings", systemSettingsSchema);

export default SystemSettings;

