import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role } from "../../types/domain";
import {
  getAdminIdeas,
  createJudge,
  bulkAssign,
  getAdminUsers,
  updateUserRole,
} from "../apis/admin.api";
import { getJudges } from "../apis/judges.api";

export const useAdminIdeas = (
  params: {
    status?: string;
    category?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }
) =>
  useQuery({
    queryKey: ["admin", "ideas", params],
    queryFn: () => getAdminIdeas(params),
    keepPreviousData: true,
  });

export const useAdminJudges = (
  params?: {
    q?: string;
    page?: number;
    pageSize?: number;
  }
) =>
  useQuery({
    queryKey: ["admin", "judges", params],
    queryFn: () => getJudges(params),
    keepPreviousData: true,
  });

export const useCreateJudge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createJudge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "judges"] });
    },
  });
};

export const useBulkAssign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkAssign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ideas"] });
      queryClient.invalidateQueries({ queryKey: ["judge", "ideas"] });
    },
  });
};

export const useAdminUsers = (
  params?: {
    role?: Role;
    page?: number;
    pageSize?: number;
  }
) =>
  useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => getAdminUsers(params ?? {}),
    keepPreviousData: true,
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
  useBulkAssign,
  useAdminUsers,
  useUpdateUserRole,
};
