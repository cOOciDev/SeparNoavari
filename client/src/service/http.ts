const rawBase = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ?? "";
export const API_BASE_URL = rawBase || "/api";

export const apiFetch = (path: string, init?: RequestInit) => {
  const urlPath = path.startsWith("/") ? path : `/${path}`;
  return fetch(`${API_BASE_URL}${urlPath}`, {
    credentials: "include",
    ...init,
  });
};
