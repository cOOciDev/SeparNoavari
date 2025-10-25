export type EvaluationConstraints = {
  maxFileMb: number;
  allowPdf: boolean;
};

export const getEvaluationConstraints = (): EvaluationConstraints => {
  const maxFileMb = Number(import.meta.env.VITE_EVAL_MAX_FILE_MB ?? 30);
  const allowPdf =
    String(import.meta.env.VITE_EVAL_ALLOW_PDF ?? "0").toLowerCase() === "1";
  return {
    maxFileMb: Number.isFinite(maxFileMb) && maxFileMb > 0 ? maxFileMb : 30,
    allowPdf,
  };
};

export const isFileTooLarge = (
  sizeInBytes: number,
  constraints: EvaluationConstraints
) => {
  const limit = constraints.maxFileMb * 1024 * 1024;
  return sizeInBytes > limit;
};

export const isAllowedEvaluationType = (
  filename: string,
  constraints: EvaluationConstraints
) => {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension) return false;
  if (extension === "docx") return true;
  if (constraints.allowPdf && extension === "pdf") return true;
  return false;
};
