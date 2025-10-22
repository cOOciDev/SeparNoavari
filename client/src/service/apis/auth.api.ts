import api from "../api";
import type { User } from "../../types/domain";

export async function me(): Promise<{ user: User | null }> {
  const { data } = await api.get("/auth/me");
  return { user: (data.user ?? null) as User | null };
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<{ user: User }> {
  const { data } = await api.post("/auth/login", payload);
  return { user: data.user as User };
}

export async function register(payload: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ user: User }> {
  const { data } = await api.post("/auth/register", payload);
  return { user: data.user as User };
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export default {
  me,
  login,
  register,
  logout,
};
