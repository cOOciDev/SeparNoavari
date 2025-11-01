import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Assignment,
  EvaluationSummaryFile,
  Idea,
  Judge,
  Role,
  User,
} from "../../types/domain";
import {
  getAdminIdeas,
  createJudge,
  manualAssign,
  getIdeaAssignments,
  deleteAssignment,
  lockAssignment,
  uploadFinalSummary,
  getFinalSummary,
  getAdminUsers,
  updateUserRole,
  updateJudge,
<<<<<<< Updated upstream
  type Paginated,
=======
<<<<<<< HEAD
  getIdeaReviews,
  getAdminReviewCriteria,
=======
  type Paginated,
>>>>>>> a582a459a026773c088d0a1851f4e2816ef5e273
>>>>>>> Stashed changes
} from "../apis/admin.api";
import { getJudges } from "../apis/judges.api";

export const useAdminIdeas = (params: {
  status?: string;
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) =>
  useQuery<Paginated<Idea>>({
    queryKey: ["admin", "ideas", params],
    queryFn: () => getAdminIdeas(params),
  });

export const useAdminJudges = (params?: {
  q?: string;
  page?: number;
  pageSize?: number;
}) =>
  useQuery<Awaited<ReturnType<typeof getJudges>>>(
    {
      queryKey: ["admin", "judges", params],
      queryFn: () => getJudges(params),
    }
  );

export const useCreateJudge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createJudge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "judges"] });
    },
  });
};

export const useUpdateJudge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      capacity,
      active,
    }: {
      id: string;
      capacity?: number | null;
      active?: boolean;
    }) => updateJudge(id, { capacity, active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "judges"] });
    },
  });
};

export const useManualAssign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: manualAssign,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ideas"] });
      if (variables?.ideaId) {
        queryClient.invalidateQueries({
          queryKey: ["admin", "ideaAssignments", variables.ideaId],
        });
      }
    },
  });
};

export const useIdeaAssignments = (ideaId?: string) =>
  useQuery<{ assignments: Assignment[]; total: number; maxJudges: number }>(
    {
      queryKey: ["admin", "ideaAssignments", ideaId],
      queryFn: () => getIdeaAssignments(ideaId || ""),
      enabled: Boolean(ideaId),
    }
  );

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ideaId }: { id: string; ideaId: string }) =>
      deleteAssignment(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ideas"] });
      if (variables?.ideaId) {
        queryClient.invalidateQueries({
          queryKey: ["admin", "ideaAssignments", variables.ideaId],
        });
      }
    },
  });
};

export const useLockAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ideaId,
    }: {
      id: string;
      ideaId: string;
    }) => lockAssignment(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ideas"] });
      if (variables?.ideaId) {
        queryClient.invalidateQueries({
          queryKey: ["admin", "ideaAssignments", variables.ideaId],
        });
      }
    },
  });
};

export const useFinalSummary = (ideaId?: string) =>
  useQuery<EvaluationSummaryFile | null>({
    queryKey: ["admin", "finalSummary", ideaId],
    queryFn: () => getFinalSummary(ideaId || ""),
    enabled: Boolean(ideaId),
  });

export const useUploadFinalSummary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ideaId,
      file,
    }: {
      ideaId: string;
      file: File;
    }) => uploadFinalSummary(ideaId, file),
    onSuccess: (_data, variables) => {
      if (variables?.ideaId) {
        queryClient.invalidateQueries({
          queryKey: ["admin", "finalSummary", variables.ideaId],
        });
        queryClient.invalidateQueries({
          queryKey: ["idea", variables.ideaId],
        });
        queryClient.invalidateQueries({
          queryKey: ["admin", "ideas"],
        });
      }
    },
  });
};

<<<<<<< Updated upstream
=======
<<<<<<< HEAD
export const useIdeaReviews = (ideaId?: string) =>
  useQuery({
    queryKey: ["admin", "ideaReviews", ideaId],
    queryFn: () => getIdeaReviews(ideaId || ""),
    enabled: Boolean(ideaId),
  });

export const useAdminReviewCriteria = () =>
  useQuery({
    queryKey: ["admin", "reviewCriteria"],
    queryFn: getAdminReviewCriteria,
  });

export const useAdminUsers = (
  params?: {
    role?: Role;
    page?: number;
    pageSize?: number;
  }
) =>
  useQuery({
=======
>>>>>>> Stashed changes
export const useAdminUsers = (params?: {
  role?: Role;
  page?: number;
  pageSize?: number;
}) =>
  useQuery<Paginated<User>>({
<<<<<<< Updated upstream
=======
>>>>>>> a582a459a026773c088d0a1851f4e2816ef5e273
>>>>>>> Stashed changes
    queryKey: ["admin", "users", params],
    queryFn: () => getAdminUsers(params ?? {}),
  });

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};

export default {
  useAdminIdeas,
  useAdminJudges,
  useCreateJudge,
  useUpdateJudge,
  useManualAssign,
  useIdeaAssignments,
  useDeleteAssignment,
  useLockAssignment,
  useFinalSummary,
  useUploadFinalSummary,
  useIdeaReviews,
  useAdminReviewCriteria,
  useAdminUsers,
  useUpdateUserRole,
};
