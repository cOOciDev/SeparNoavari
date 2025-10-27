export const RESULTS_DATE_ISO = "2025-11-22T10:00:00+03:30";

export type Milestone = {
  key: string;
  iso: string;
  label: string;
};

export const MILESTONES: Milestone[] = [
  { key: "submission", iso: "2025-11-14T23:59:00+03:30", label: "Submission Deadline" },
  { key: "review", iso: "2025-12-10T12:00:00Z", label: "Review Starts" },
  { key: "results", iso: "2025-11-22T10:00:00+03:30", label: "Results Announced" },
  { key: "closing", iso: "2025-11-28T18:00:00+03:30", label: "Closing Ceremony" },
];
