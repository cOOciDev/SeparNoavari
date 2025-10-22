import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { me, login, logout, register } from "../apis/auth.api";
import type { Role, User } from "../../types/domain";
import { useAuth, type AuthUser } from "../../contexts/AuthProvider";

const mapToAuthUser = (user: User): AuthUser => {
  const role = (user.role || "USER").toString().toUpperCase() as Role;
  return {
    id: String(user.id),
    email: user.email,
    name: user.name || "",
    role,
    userId: user.id,
    userEmail: user.email,
    userName: user.name || "",
  };
};

export const useMe = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: me,
  });

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshUser, navigateAfterLogin, setUser } = useAuth();

  return useMutation({
    mutationFn: ({
      email,
      password,
      next,
    }: {
      email: string;
      password: string;
      next?: string | null;
    }) =>
      login({ email, password }).then((res) => ({ ...res, next })),
    onSuccess: async (data) => {
      const mapped = mapToAuthUser(data.user);
      setUser(mapped);

      queryClient.setQueryData(["me"], { user: data.user });
      await refreshUser({ clearOnFail: false });

      const role = mapped.role;
      const target = data.next && data.next.startsWith("/") ? data.next : navigateAfterLogin(role);
      navigate(target, { replace: true });
    },
  });
};

export const useRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshUser, navigateAfterLogin, setUser } = useAuth();

  return useMutation({
    mutationFn: ({
      email,
      password,
      name,
      next,
    }: {
      email: string;
      password: string;
      name?: string;
      next?: string | null;
    }) =>
      register({ email, password, name }).then((res) => ({ ...res, next })),
    onSuccess: async (data) => {
      const mapped = mapToAuthUser(data.user);
      setUser(mapped);

      queryClient.setQueryData(["me"], { user: data.user });
      await refreshUser({ clearOnFail: false });

      const role = mapped.role;
      const target = data.next && data.next.startsWith("/") ? data.next : navigateAfterLogin(role);
      navigate(target, { replace: true });
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (redirectTo?: string) => {
      await logout();
      return redirectTo ?? "/login";
    },
    onSuccess: (redirectTo) => {
      queryClient.removeQueries({ queryKey: ["me"] });
      navigate(redirectTo, { replace: true });
    },
  });
};

export default {
  useMe,
  useLogin,
  useRegister,
  useLogout,
};
