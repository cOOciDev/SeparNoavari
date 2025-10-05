import { useAuth } from "../../contexts/AuthProvider";

export function useAuthFetch() {
  const { token } = useAuth();
  return (input: RequestInfo, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };
}
