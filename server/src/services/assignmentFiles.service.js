import fs from "fs";
import path from "path";
import sanitizeFilename from "../utils/sanitizeFilename.js";

const uploadsRoot = path.resolve("server/uploads");
const assignmentsRoot = path.join(uploadsRoot, "assignments");
const templatesRoot = path.join(assignmentsRoot, "templates");
const submissionsRoot = path.join(assignmentsRoot, "submissions");
const ideasRoot = path.join(uploadsRoot, "ideas");
const ideaFinalRoot = path.join(ideasRoot, "final");
const STATIC_TEMPLATE_NAME = "static-template.docx";

const ensureDir = (targetPath) => {
  fs.mkdirSync(targetPath, { recursive: true });
  return targetPath;
};

const ensureStructure = () => {
  ensureDir(uploadsRoot);
  ensureDir(assignmentsRoot);
  ensureDir(templatesRoot);
  ensureDir(submissionsRoot);
  ensureDir(ideasRoot);
  ensureDir(ideaFinalRoot);
};

const toAbsolutePath = (relativePath, expectedRoot = uploadsRoot) => {
  if (!relativePath) {
    throw new Error("Relative path is required");
  }
  const normalizedRelative = relativePath.replace(/\\/g, "/");
  const absolutePath = path.resolve(uploadsRoot, normalizedRelative);
  const normalizedRoot = expectedRoot || uploadsRoot;
  if (!absolutePath.startsWith(normalizedRoot)) {
    throw new Error("Unsafe path resolution attempted");
  }
  return absolutePath;
};

const writePlaceholderDocx = (targetPath, contents) => {
  const header = [
    "Assignment Template",
    `Generated: ${new Date().toISOString()}`,
    contents,
  ].join("\n\n");
  fs.writeFileSync(targetPath, header, "utf8");
};

export const resolveStaticTemplate = () => {
  ensureStructure();
  const staticPath = path.join(templatesRoot, STATIC_TEMPLATE_NAME);
  if (!fs.existsSync(staticPath)) {
    writePlaceholderDocx(
      staticPath,
      "This is a placeholder DOCX template. Replace with production template."
    );
  }
  const downloadName = "evaluation-template.docx";
  return {
    absolutePath: staticPath,
    downloadName,
  };
};

const buildGeneratedTemplatePath = (assignmentId) => {
  const safeId = sanitizeFilename(assignmentId) || "assignment";
  const relative = path.posix.join("assignments", "templates", `${safeId}.docx`);
  const absolute = toAbsolutePath(relative);
  ensureDir(path.dirname(absolute));
  return { relative, absolute };
};

export const ensureGeneratedTemplate = ({
  assignment,
  idea,
  judge,
}) => {
  ensureStructure();
  const assignmentId =
    String(assignment._id || assignment.id || assignment.assignmentId);
  const safeId = sanitizeFilename(assignmentId) || "assignment";
  const { relative, absolute } = buildGeneratedTemplatePath(safeId);

  if (!fs.existsSync(absolute)) {
    const judgeLabel =
      sanitizeFilename(
        judge?.user?.name ||
          judge?.user?.email ||
          judge?.name ||
          judge?._id ||
          "judge"
      ) || "judge";
    const ideaLabel =
      sanitizeFilename(idea?.title || idea?._id || idea?.id || "idea") ||
      "idea";

    writePlaceholderDocx(
      absolute,
      `Assignment: ${safeId}\nIdea: ${ideaLabel}\nJudge: ${judgeLabel}`
    );
  }

  const filename =
    assignment.template?.filename ||
    `${safeId}-evaluation-template.docx`;

  return {
    relativePath: relative,
    absolutePath: absolute,
    filename,
  };
};

export const resolveSubmissionTarget = ({
  assignment,
  version,
  originalName,
}) => {
  ensureStructure();
  const ideaId = sanitizeFilename(
    String(assignment.idea?._id || assignment.idea || "idea")
  ) || "idea";
  const judgeId = sanitizeFilename(
    String(assignment.judge?._id || assignment.judge || "judge")
  ) || "judge";
  const versionLabel = `v${version}`;
  const relativeDir = path.posix.join(
    "assignments",
    "submissions",
    ideaId,
    judgeId,
    versionLabel
  );
  const absoluteDir = path.resolve(assignmentsRoot, "submissions", ideaId, judgeId, versionLabel);
  ensureDir(absoluteDir);

  const ext = (() => {
    const lower = path.extname(originalName || "").toLowerCase();
    if (lower === ".docx" || lower === ".pdf") {
      return lower;
    }
    return ".docx";
  })();
  const baseRaw = path.basename(originalName || "", path.extname(originalName || ""));
  const baseName = sanitizeFilename(baseRaw) || `assignment_${version}`;

  let candidate = `${baseName}${ext}`;
  let absolutePath = path.join(absoluteDir, candidate);
  let counter = 1;
  while (fs.existsSync(absolutePath)) {
    candidate = `${baseName}_${counter}${ext}`;
    absolutePath = path.join(absoluteDir, candidate);
    counter += 1;
  }

  const relativePath = path.posix.join(relativeDir, candidate);

  return {
    filename: candidate,
    absolutePath,
    relativePath,
  };
};

export const getSubmissionAbsolutePath = (relativePath) => {
  ensureStructure();
  return toAbsolutePath(relativePath, assignmentsRoot);
};

export const getTemplateAbsolutePath = (relativePath) => {
  ensureStructure();
  return toAbsolutePath(relativePath, assignmentsRoot);
};

export const getUploadsRoot = () => uploadsRoot;

export const resolveFinalSummaryTarget = ({ ideaId, originalName }) => {
  ensureStructure();
  const safeIdea =
    sanitizeFilename(String(ideaId || "idea")) || "idea";
  const relativeDir = path.posix.join("ideas", "final", safeIdea);
  const absoluteDir = path.resolve(uploadsRoot, relativeDir);
  ensureDir(absoluteDir);
  const ext = (() => {
    const lower = (path.extname(originalName || "") || "").toLowerCase();
    if (lower === ".docx" || lower === ".pdf") {
      return lower;
    }
    return ".docx";
  })();
  const filename = `summary${ext}`;
  const relativePath = path.posix.join(relativeDir, filename);
  const absolutePath = path.join(absoluteDir, filename);
  return {
    filename,
    relativePath,
    absolutePath,
  };
};

export const getFinalSummaryAbsolutePath = (relativePath) => {
  ensureStructure();
  return toAbsolutePath(relativePath, ideasRoot);
};
