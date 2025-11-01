export type Role = "ADMIN" | "JUDGE" | "USER";

export interface ApiEnvelope<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  code: string;
  message: string;
  details?: unknown;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface IdeaFile {
  originalName: string;
  storedName: string;
  path: string;
  size: number;
  mime: string;
  fieldName: string;
}

export type IdeaStatus = "SUBMITTED" | "UNDER_REVIEW" | "DONE" | "REJECTED";

export interface Idea {
  id: string;
  _id?: string;
  owner: string;
  title: string;
  summary: string;
  category: string;
  contactEmail: string;
  submitterName: string;
  phone?: string;
  teamMembers: string[];
  status: IdeaStatus;
  files: IdeaFile[];
  createdAt: string;
  updatedAt: string;
  scoreSummary?: {
    average: number | null;
    totalReviews: number;
    criteria?: Record<string, number>;
  };
  finalSummary?: EvaluationSummaryFile | null;
  assignedJudges?: string[];
}

export interface Judge {
  id: string;
  user: User;
  expertise: string[];
  active: boolean;
  capacity?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AssignmentStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVIEWED"
  | "LOCKED";

export interface AssignmentSubmission {
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
  version: number;
  downloadUrl?: string;
}

export interface AssignmentTemplate {
  source: string;
  filename: string;
  url: string;
  available: boolean;
}

export interface AssignmentJudgeSummary {
  id: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export interface AssignmentIdeaSummary {
  id: string;
  title?: string;
  status?: IdeaStatus;
}

export interface Assignment {
  id: string;
  idea?: AssignmentIdeaSummary;
  judge?: AssignmentJudgeSummary;
  status: AssignmentStatus;
  allowReuploadUntilLock: boolean;
  deadline?: string;
  template: AssignmentTemplate;
  submission?: AssignmentSubmission | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EvaluationSummaryFile {
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
  downloadUrl?: string;
}

export type ReviewScores = Record<string, number>;

export interface ReviewCriterion {
  id: string;
  label: string;
}

export interface Review {
  id: string;
  idea?: Idea;
  judge?: Judge;
  scores: ReviewScores;
  comment?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}
