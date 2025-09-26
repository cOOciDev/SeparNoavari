/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type User = { id: string; name: string; email: string; role?: "user" | "admin" | "judge" };
type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
};
type LoginInput = { email: string; password: string };
type AuthContextValue = AuthState & {
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
  setUser: (u: User | null) => void;
  setToken: (t: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LS_USER = "auth:user";
const LS_TOKEN = "auth:token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // boot: hydrate from localStorage
  useEffect(() => {
    const u = localStorage.getItem(LS_USER);
    const t = localStorage.getItem(LS_TOKEN);
    if (u && t) {
      try {
        setUser(JSON.parse(u));
        setToken(t);
      } catch {}
    }
    setLoading(false);
  }, []);

  // persist
  useEffect(() => {
    if (user) localStorage.setItem(LS_USER, JSON.stringify(user));
    else localStorage.removeItem(LS_USER);
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem(LS_TOKEN, token);
    else localStorage.removeItem(LS_TOKEN);
  }, [token]);

  const login = async ({ email, password }: LoginInput) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
    } catch {
      // fallback mock (remove in prod)
      await new Promise((r) => setTimeout(r, 400));
      setToken("dev.jwt.token");
      setUser({ id: "u1", name: "Guest", email, role: "user" });
    }
    navigate("/account");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token,
      login,
      logout,
      setUser,
      setToken,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook export (non-component, rule disabled at top)
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
