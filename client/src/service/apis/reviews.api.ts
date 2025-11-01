import api from "../api";
import type { Review, ReviewCriterion, ReviewScores } from "../../types/domain";

export async function submitReview(payload: {
  ideaId: string;
  scores: ReviewScores;
  comment?: string;
}): Promise<{ review: Review }> {
  const { data } = await api.post("/judge/reviews", payload);
  return { review: data.review as Review };
}

export async function getJudgeReviewCriteria(): Promise<ReviewCriterion[]> {
  const { data } = await api.get("/judge/review-criteria");
  return (data.criteria ?? []) as ReviewCriterion[];
}

export default {
  submitReview,
  getJudgeReviewCriteria,
};
