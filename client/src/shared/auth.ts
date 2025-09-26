// client/src/app/shared/auth.ts

export type UserRole = "guest" | "user" | "judge" | "admin";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
}

const LS_TOKEN = "auth_token";
const LS_ROLE  = "auth_role";
const LS_USER  = "app.user";

export function getRole(): UserRole {
  return (localStorage.getItem(LS_ROLE) as UserRole) || "guest";
}

export function isAuthed(): boolean {
  return !!localStorage.getItem(LS_TOKEN);
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(LS_USER);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function loginWithEmailOrPhone(id: string, pass: string): UserRole {
  const role: UserRole =
    id.includes("admin") ? "admin" : id.includes("judge") ? "judge" : "user";

  const user: User = {
    id,
    role,
    name: id.split("@")[0] || "Demo User",
    email: id.includes("@") ? id : `${id}@example.com`,
  };

  localStorage.setItem(LS_TOKEN, "demo-token");
  localStorage.setItem(LS_ROLE, role);
  localStorage.setItem(LS_USER, JSON.stringify(user));

  window.dispatchEvent(new Event("auth:changed"));
  return role;
}

export function signupWithEmailOrPhone(id: string, pass: string): UserRole {
  const role: UserRole = "user";

  const user: User = {
    id,
    role,
    name: id.split("@")[0] || "New User",
    email: id.includes("@") ? id : `${id}@example.com`,
  };

  localStorage.setItem(LS_TOKEN, "demo-token");
  localStorage.setItem(LS_ROLE, role);
  localStorage.setItem(LS_USER, JSON.stringify(user));

  window.dispatchEvent(new Event("auth:changed"));
  return role;
}

export function logout() {
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_ROLE);
  localStorage.removeItem(LS_USER);
  window.dispatchEvent(new Event("auth:changed"));
}
