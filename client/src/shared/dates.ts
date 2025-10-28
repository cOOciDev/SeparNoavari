const env = import.meta.env;

export const IDEA_DEADLINE_ISO = env.VITE_IDEA_DEADLINE ?? "2025-11-14T23:59:00+03:30";

export const RESULTS_DATE_ISO = env.VITE_RESULTS_DATE ?? "2025-11-22T10:00:00+03:30";

export const CLOSING_CEREMONY_ISO = env.VITE_CLOSING_CEREMONY ?? "2025-11-28T18:00:00+03:30";

export const MILESTONES = [
  { key: "submission", label: "Submission Deadline", iso: IDEA_DEADLINE_ISO },
  { key: "results", label: "Final Jury & Results", iso: RESULTS_DATE_ISO },
  { key: "closing", label: "Closing Ceremony", iso: CLOSING_CEREMONY_ISO },
] as const;
