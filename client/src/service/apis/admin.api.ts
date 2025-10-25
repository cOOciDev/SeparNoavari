import axios from "axios";
import api from "../api";
import type {
  Idea,
  Judge,
  Role,
  User,
  Assignment,
  EvaluationSummaryFile,
} from "../../types/domain";
import { normalizeIdeaCollection } from "../transformers";

type Paginated<T> = {
  items: T[];
  total: number;
};

export async function getAdminIdeas(params: {
  status?: string;
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<Idea>> {
  const { data } = await api.get("/admin/ideas", { params });
  const rawItems = data.items ?? data.ideas ?? [];
  return {
    items: normalizeIdeaCollection(rawItems),
    total: data.total ?? data.count ?? 0,
  };
}

export async function createJudge(payload: {
  email: string;
  name?: string;
  expertise?: string[];
  capacity?: number;
}): Promise<{ judge: Judge }> {
  const { data } = await api.post("/admin/judges", payload);
  return { judge: data.judge as Judge };
}

export async function updateJudge(
  id: string,
  payload: { capacity?: number | null; active?: boolean }
): Promise<Judge> {
  const { data } = await api.patch(
    `/admin/judges/${encodeURIComponent(id)}`,
    payload
  );
  return data.judge as Judge;
}

export async function manualAssign(payload: {
  ideaId: string;
  judgeIds: string[];
}): Promise<{ assignments: Assignment[] }> {
  try {
    const { data } = await api.post("/admin/assignments/manual", payload);
    return {
      assignments: (data.assignments ?? []) as Assignment[],
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const err: any = new Error(
        error.response.data?.message || "Failed to assign judges."
      );
      err.code = error.response.data?.code;
      err.details = error.response.data?.details;
      throw err;
    }
    throw error;
  }
}

export async function getIdeaAssignments(
  ideaId: string
): Promise<{ assignments: Assignment[]; total: number; maxJudges: number }> {
  const { data } = await api.get(
    `/admin/ideas/${encodeURIComponent(ideaId)}/assignments`
  );
  return {
    assignments: (data.assignments ?? []) as Assignment[],
    total: data.meta?.total ?? data.assignments?.length ?? 0,
    maxJudges: data.meta?.maxJudges ?? 10,
  };
}

export async function deleteAssignment(id: string): Promise<void> {
  await api.delete(`/admin/assignments/${encodeURIComponent(id)}`);
}

export async function lockAssignment(id: string): Promise<Assignment> {
  const { data } = await api.patch(
    `/admin/assignments/${encodeURIComponent(id)}/lock`
  );
  return data.assignment as Assignment;
}

export async function uploadFinalSummary(
  ideaId: string,
  file: File
): Promise<EvaluationSummaryFile | null> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(
    `/admin/ideas/${encodeURIComponent(ideaId)}/final-summary`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return (data.summary ?? null) as EvaluationSummaryFile | null;
}

export async function getFinalSummary(
  ideaId: string
): Promise<EvaluationSummaryFile | null> {
  const { data } = await api.get(
    `/admin/ideas/${encodeURIComponent(ideaId)}/final-summary`
  );
  return (data.summary ?? null) as EvaluationSummaryFile | null;
}

export async function getAdminUsers(params?: {
  role?: Role;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<User>> {
  const { data } = await api.get("/admin/users", { params });
  return {
    items: (data.items ?? data.users ?? []) as User[],
    total: data.total ?? data.count ?? 0,
  };
}

export async function updateUserRole(id: string, role: Role): Promise<{ ok: boolean }> {
  const { data } = await api.put(`/admin/users/${encodeURIComponent(id)}/role`, { role });
  return { ok: data.ok !== false };
}

export default {
  getAdminIdeas,
  createJudge,
  updateJudge,
  manualAssign,
  getIdeaAssignments,
  deleteAssignment,
  lockAssignment,
  uploadFinalSummary,
  getFinalSummary,
  getAdminUsers,
  updateUserRole,
};
