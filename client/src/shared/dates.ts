// client/src/app/shared/dates.ts
// تاریخ‌ها از .env خوانده می‌شوند؛ اگر نبود، fallback می‌گذاریم.
// بعداً فقط .env را آپدیت کن و dev server را ری‌استارت کن.

export const IDEA_DEADLINE_ISO =
  import.meta.env.VITE_IDEA_DEADLINE ?? "2025-10-10T20:30:00+03:30"

// اگر تاریخ «داوری نهایی/اعلام نتایج» همان RESULTS باشد، از همین استفاده کن:
export const RESULTS_DATE_ISO =
  import.meta.env.VITE_RESULTS_DATE ?? "2025-11-01T10:00:00+03:30"

// اختتامیه (placeholder — بعداً در .env دقیقش کن)
export const CLOSING_CEREMONY_ISO =
  import.meta.env.VITE_CLOSING_CEREMONY ?? "2025-11-10T18:00:00+03:30"

// نام‌های فارسی/انگلیسی مرحله‌ها (فعلاً انگلیسی؛ بعداً دوزبانه می‌کنیم)
export const MILESTONES = [
  { key: "submission", label: "Submission Deadline", iso: IDEA_DEADLINE_ISO },
  { key: "results",    label: "Final Jury & Results", iso: RESULTS_DATE_ISO },
  { key: "closing",    label: "Closing Ceremony", iso: CLOSING_CEREMONY_ISO },
] as const
