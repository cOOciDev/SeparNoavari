import api from "../api";
import type { Idea } from "../../types/domain";
import { normalizeIdea, normalizeIdeaCollection } from "../transformers";

export async function createIdea(formData: FormData): Promise<{ idea: Idea }> {
  const { data } = await api.post("/ideas", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { idea: normalizeIdea(data.idea) };
}

export async function getMyIdeas(): Promise<{ items: Idea[]; total?: number }> {
  const { data } = await api.get("/ideas/mine");
  return {
    items: normalizeIdeaCollection(data.items ?? data.ideas ?? []),
    total: data.total,
  };
}

export async function getIdea(id: string): Promise<{ idea: Idea }> {
  const { data } = await api.get(`/ideas/${encodeURIComponent(id)}`);
  return { idea: normalizeIdea(data.idea) };
}

export default {
  createIdea,
  getMyIdeas,
  getIdea,
};
