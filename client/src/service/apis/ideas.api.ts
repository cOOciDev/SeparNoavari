import api from "../api";
import type { Idea } from "../../types/domain";

export async function createIdea(formData: FormData): Promise<{ idea: Idea }> {
  const { data } = await api.post("/ideas", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { idea: data.idea as Idea };
}

export async function getMyIdeas(): Promise<{ items: Idea[]; total?: number }> {
  const { data } = await api.get("/ideas/mine");
  return {
    items: (data.items ?? data.ideas ?? []) as Idea[],
    total: data.total,
  };
}

export async function getIdea(id: string): Promise<{ idea: Idea }> {
  const { data } = await api.get(`/ideas/${encodeURIComponent(id)}`);
  return { idea: data.idea as Idea };
}

export default {
  createIdea,
  getMyIdeas,
  getIdea,
};
