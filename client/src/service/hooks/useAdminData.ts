import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';
import { useEffect } from 'react';
import api from '../api';

export interface AdminOverview {
  totalIdeas: number;
  totalUsers: number;
  lastSubmissionAt: string | null;
}

export interface AdminIdeaFiles {
  pdf: string | null;
  word: string | null;
}

export interface AdminIdea {
  id: number;
  ownerId: number | null;
  title: string;
  track: string;
  submitter: string;
  contactEmail: string;
  submittedAt: string;
  executiveSummary: string;
  teamMembers: string[];
  files: AdminIdeaFiles | null;
}

export interface AdminUserRow {
  id: number | string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  ideasCount: number | null;
  lastSubmissionAt: string | null;
}

function useErrorToast(isError: boolean, error: unknown, fallback: string) {
  useEffect(() => {
    if (isError) {
      const reason =
        (error && typeof error === 'object' && 'message' in error
          ? String((error as Error).message)
          : null) ?? fallback;
      message.error(reason);
    }
  }, [error, fallback, isError]);
}

export const useAdminOverview = () => {
  const query = useQuery<AdminOverview>({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const { data } = await api.get<AdminOverview>('/admin/overview');
      return data;
    },
  });

  useErrorToast(query.isError, query.error, 'Failed to load overview');
  return query;
};

export const useAdminIdeas = () => {
  const query = useQuery<{ ideas: AdminIdea[] }>({
    queryKey: ['admin', 'ideas'],
    queryFn: async () => {
      const { data } = await api.get<{ ideas: AdminIdea[] }>('/admin/ideas');
      return data;
    },
  });

  useErrorToast(query.isError, query.error, 'Failed to load ideas');

  return {
    ...query,
    ideas: query.data?.ideas ?? [],
  };
};

export const useAdminUsers = () => {
  const query = useQuery<{ users: AdminUserRow[] }>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await api.get<{ users: AdminUserRow[] }>('/admin/users');
      return data;
    },
  });

  useErrorToast(query.isError, query.error, 'Failed to load users');

  return {
    ...query,
    users: query.data?.users ?? [],
  };
};

