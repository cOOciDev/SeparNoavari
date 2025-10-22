import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJudgeIdeas } from "../apis/judges.api";
import { submitReview } from "../apis/reviews.api";

export const useJudgeIdeas = () =>
  useQuery({
    queryKey: ["judge", "ideas"],
    queryFn: getJudgeIdeas,
  });

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitReview,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["judge", "ideas"] });
      if (variables.ideaId) {
        queryClient.invalidateQueries({ queryKey: ["idea", variables.ideaId] });
      }
    },
  });
};

export default {
  useJudgeIdeas,
  useSubmitReview,
};
