import { describe, expect, it } from "vitest";
import {
  getEvaluationConstraints,
  isAllowedEvaluationType,
  isFileTooLarge,
} from "../utils/evaluationFiles";

describe("evaluation file utilities", () => {
  it("detects oversize files", () => {
    const constraints = { ...getEvaluationConstraints(), maxFileMb: 1 };
    expect(isFileTooLarge(2 * 1024 * 1024, constraints)).toBe(true);
    expect(isFileTooLarge(512 * 1024, constraints)).toBe(false);
  });

  it("validates extensions based on allowPdf flag", () => {
    const docxOnly = { ...getEvaluationConstraints(), allowPdf: false };
    expect(isAllowedEvaluationType("report.docx", docxOnly)).toBe(true);
    expect(isAllowedEvaluationType("report.pdf", docxOnly)).toBe(false);

    const withPdf = { ...getEvaluationConstraints(), allowPdf: true };
    expect(isAllowedEvaluationType("score.pdf", withPdf)).toBe(true);
  });
});
