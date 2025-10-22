import api from "../api";
import type { Idea, Judge } from "../../types/domain";

type Paginated<T> = {
  items: T[];
  total?: number;
};

export async function getJudges(params?: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<Judge>> {
  const { data } = await api.get("/admin/judges", {
    params,
  });
  return {
    items: (data.items ?? data.judges ?? []) as Judge[],
    total: data.total,
  };
}

export async function getJudgeIdeas(): Promise<Paginated<Idea>> {
  const { data } = await api.get("/judge/ideas");
  return {
    items: (data.items ?? data.ideas ?? []) as Idea[],
    total: data.total,
  };
}

export default {
  getJudges,
  getJudgeIdeas,
};
