import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getJudgeIdeas,
  getJudgeAssignments,
  uploadJudgeSubmission,
} from "../apis/judges.api";
import { getJudgeReviewCriteria, submitReview } from "../apis/reviews.api";

export const useJudgeIdeas = () =>
  useQuery({
    queryKey: ["judge", "ideas"],
    queryFn: getJudgeIdeas,
  });

export const useJudgeAssignments = () =>
  useQuery({
    queryKey: ["judge", "assignments"],
    queryFn: getJudgeAssignments,
  });

export const useJudgeReviewCriteria = () =>
  useQuery({
    queryKey: ["judge", "reviewCriteria"],
    queryFn: getJudgeReviewCriteria,
  });

export const useJudgeSubmissionUpload = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      file,
    }: {
      assignmentId: string;
      file: File;
    }) => uploadJudgeSubmission(assignmentId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judge", "assignments"] });
    },
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitReview,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["judge", "ideas"] });
      if (variables.ideaId) {
        queryClient.invalidateQueries({ queryKey: ["idea", variables.ideaId] });
        queryClient.invalidateQueries({
          queryKey: ["admin", "ideaReviews", variables.ideaId],
        });
      }
    },
  });
};

export default {
  useJudgeIdeas,
  useJudgeAssignments,
  useJudgeReviewCriteria,
  useJudgeSubmissionUpload,
  useSubmitReview,
};
