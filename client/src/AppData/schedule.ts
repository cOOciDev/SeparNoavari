export const RESULTS_DATE_ISO = "2025-12-20T12:00:00Z";

export type Milestone = {
  key: string;
  iso: string;
  label: string;
};

export const MILESTONES: Milestone[] = [
  { key: "submission", iso: "2025-11-30T20:30:00Z", label: "Submission Deadline" },
  { key: "review", iso: "2025-12-10T12:00:00Z", label: "Review Starts" },
  { key: "results", iso: "2025-12-20T12:00:00Z", label: "Results Announced" },
  { key: "closing", iso: "2026-01-05T10:00:00Z", label: "Closing Ceremony" },
];
