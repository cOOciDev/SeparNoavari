import type { Idea, IdeaFile, EvaluationSummaryFile } from "../types/domain";

const toStringSafe = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : String(value);
};

const normalizeIdeaFile = (input: any): IdeaFile => {
  if (!input) {
    return {
      originalName: "",
      storedName: "",
      path: "",
      size: 0,
      mime: "",
      fieldName: "",
    };
  }
  return {
    originalName: input.originalName ?? input.originalname ?? "",
    storedName: input.storedName ?? input.storedname ?? "",
    path: input.path ?? "",
    size:
      typeof input.size === "number"
        ? input.size
        : Number.parseInt(input.size ?? "0", 10) || 0,
    mime: input.mime ?? input.mimetype ?? "",
    fieldName: input.fieldName ?? input.fieldname ?? "",
  };
};

const normalizeEvaluationSummary = (
  input: any
): EvaluationSummaryFile | null => {
  if (!input) {
    return null;
  }
  return {
    filename: input.filename ?? "",
    mimetype: input.mimetype ?? "",
    size:
      typeof input.size === "number"
        ? input.size
        : Number.parseInt(input.size ?? "0", 10) || 0,
    uploadedAt: input.uploadedAt ?? "",
    downloadUrl: input.downloadUrl ?? undefined,
  };
};

export const normalizeIdea = (input: any): Idea => {
  if (!input) {
    return {
      id: "",
      owner: "",
      title: "",
      summary: "",
      category: "",
      contactEmail: "",
      submitterName: "",
      phone: "",
      teamMembers: [],
      status: "SUBMITTED",
      files: [],
      createdAt: "",
      updatedAt: "",
      scoreSummary: { average: null, totalReviews: 0 },
    };
  }

  const {
    _id,
    __v,
    owner,
    files,
    teamMembers,
    scoreSummary,
    ...rest
  } = input;

  const normalized: any = {
    ...rest,
  };

  const idCandidate = rest.id ?? _id;
  if (idCandidate !== undefined && idCandidate !== null) {
    normalized.id = toStringSafe(idCandidate);
  } else if (!normalized.id) {
    normalized.id = "";
  }

  if (owner !== undefined && owner !== null) {
    normalized.owner = toStringSafe(owner);
  } else if (normalized.owner !== undefined && normalized.owner !== null) {
    normalized.owner = toStringSafe(normalized.owner);
  } else {
    normalized.owner = "";
  }

  normalized.teamMembers = Array.isArray(teamMembers ?? rest.teamMembers)
    ? (teamMembers ?? rest.teamMembers)
        .map((member: unknown) => toStringSafe(member))
        .filter(Boolean)
    : [];

  normalized.files = Array.isArray(files ?? rest.files)
    ? (files ?? rest.files).map((file: any) => normalizeIdeaFile(file))
    : [];

  const summary = scoreSummary ?? rest.scoreSummary;
  if (summary) {
    normalized.scoreSummary = {
      average:
        summary.average === null || summary.average === undefined
          ? null
          : Number(summary.average),
      totalReviews:
        summary.totalReviews === undefined || summary.totalReviews === null
          ? 0
          : Number(summary.totalReviews),
    };
  } else {
    normalized.scoreSummary = { average: null, totalReviews: 0 };
  }

  normalized.phone = normalized.phone ? toStringSafe(normalized.phone) : "";
  normalized.contactEmail = normalized.contactEmail
    ? toStringSafe(normalized.contactEmail)
    : "";
  normalized.submitterName = normalized.submitterName
    ? toStringSafe(normalized.submitterName)
    : "";
  normalized.title = normalized.title ? toStringSafe(normalized.title) : "";
  normalized.summary = normalized.summary
    ? toStringSafe(normalized.summary)
    : "";
  normalized.category = normalized.category
    ? toStringSafe(normalized.category)
    : "";
  normalized.createdAt = normalized.createdAt
    ? toStringSafe(normalized.createdAt)
    : "";
  normalized.updatedAt = normalized.updatedAt
    ? toStringSafe(normalized.updatedAt)
    : "";
  normalized.finalSummary = normalizeEvaluationSummary(
    rest.finalSummary ?? input.finalSummary
  );

  return normalized as Idea;
};

export const normalizeIdeaCollection = (items: any[]): Idea[] =>
  Array.isArray(items) ? items.map((item) => normalizeIdea(item)) : [];
