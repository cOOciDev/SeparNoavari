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
  };
}

export interface Judge {
  id: string;
  user: User;
  expertise: string[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AssignmentStatus = "PENDING" | "REVIEWED";

export interface Assignment {
  id: string;
  idea: Idea;
  judge: Judge;
  assignedBy: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewScores {
  novelty: number;
  feasibility: number;
  impact: number;
}

export interface Review {
  id: string;
  idea: Idea;
  judge: Judge;
  scores: ReviewScores;
  comment?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}
