import api from "../api";
import type { Idea, Judge, Role, User } from "../../types/domain";

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
  return {
    items: (data.items ?? data.ideas ?? []) as Idea[],
    total: data.total ?? data.count ?? 0,
  };
}

export async function createJudge(payload: {
  email: string;
  name?: string;
  expertise?: string[];
}): Promise<{ judge: Judge }> {
  const { data } = await api.post("/admin/judges", payload);
  return { judge: data.judge as Judge };
}

export async function bulkAssign(payload: {
  ideaId?: string;
  ideaIds?: string[];
  judgeIds?: string[];
  countPerIdea?: number;
  strategy?: "AUTO" | "MANUAL";
}): Promise<{ assignments: any[] }> {
  const { data } = await api.post("/admin/assignments/bulk", payload);
  return { assignments: data.assignments ?? [] };
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
  bulkAssign,
  getAdminUsers,
  updateUserRole,
};
