import api from "../api";
import type { Review } from "../../types/domain";

export async function submitReview(payload: {
  ideaId: string;
  scores: { novelty: number; feasibility: number; impact: number };
  comment?: string;
}): Promise<{ review: Review }> {
  const { data } = await api.post("/judge/reviews", payload);
  return { review: data.review as Review };
}

export default {
  submitReview,
};
