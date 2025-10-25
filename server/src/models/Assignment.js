import mongoose from "mongoose";
import env from "../config/env.js";

const { Schema } = mongoose;

const templateSchema = new Schema(
  {
    source: {
      type: String,
      enum: ["STATIC", "PER_IDEA", "GENERATED"],
      default: "STATIC",
    },
    url: { type: String },
    filename: { type: String },
  },
  { _id: false }
);

const submissionSchema = new Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    version: { type: Number, min: 1, required: true },
  },
  { _id: false }
);

const auditEventSchema = new Schema(
  {
    at: { type: Date, required: true },
    type: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const auditSchema = new Schema(
  {
    createdAt: { type: Date },
    updatedAt: { type: Date },
    events: {
      type: [auditEventSchema],
      default: [],
    },
  },
  { _id: false }
);

const assignmentSchema = new Schema(
  {
    idea: { type: Schema.Types.ObjectId, ref: "Idea", required: true, index: true },
    judge: { type: Schema.Types.ObjectId, ref: "Judge", required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "SUBMITTED", "REVIEWED", "LOCKED"],
      default: "PENDING",
      index: true,
    },
    template: {
      type: templateSchema,
      default: undefined,
    },
    submission: {
      type: submissionSchema,
      default: undefined,
    },
    allowReuploadUntilLock: {
      type: Boolean,
      default: true,
    },
    deadline: { type: Date },
    audit: {
      type: auditSchema,
      default: () => ({
        createdAt: new Date(),
        updatedAt: new Date(),
        events: [],
      }),
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

assignmentSchema.pre("save", function handleAuditTimestamps(next) {
  if (!this.audit) {
    this.audit = { createdAt: new Date(), updatedAt: new Date(), events: [] };
  } else {
    if (!this.audit.createdAt) {
      this.audit.createdAt = this.createdAt || new Date();
    }
    this.audit.updatedAt = new Date();
    if (!Array.isArray(this.audit.events)) {
      this.audit.events = [];
    }
  }
  if (!this.template) {
    this.template = {
      source: env.assignment.templateMode,
    };
  } else if (!this.template.source) {
    this.template.source = env.assignment.templateMode;
  }
  next();
});

assignmentSchema.pre("insertMany", function handleInsertMany(next, docs) {
  try {
    if (!Array.isArray(docs)) return next();
    const now = new Date();
    for (const doc of docs) {
      if (!doc.audit) {
        doc.audit = { createdAt: now, updatedAt: now, events: [] };
      } else {
        doc.audit.createdAt = doc.audit.createdAt || now;
        doc.audit.updatedAt = now;
        if (!Array.isArray(doc.audit.events)) {
          doc.audit.events = [];
        }
      }
      if (!doc.template) {
        doc.template = { source: env.assignment.templateMode };
      } else if (!doc.template.source) {
        doc.template.source = env.assignment.templateMode;
      }
      if (doc.allowReuploadUntilLock === undefined) {
        doc.allowReuploadUntilLock = true;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Assignment =
  mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);

export default Assignment;
