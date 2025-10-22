import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AxiosError } from "axios";
import api from "../service/api";
import type { Role, User } from "../types/domain";
import { redirectAfterLogin, logoutAndRedirect } from "../utils/session";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  userId?: string | number;
  userEmail?: string;
  userName?: string;
}

type RefreshResult = "ok" | "unauthorized" | "error";

type RefreshOptions = {
  clearOnFail?: boolean;
};

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: (options?: RefreshOptions) => Promise<RefreshResult>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  navigateAfterLogin: (role?: Role) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "auth:user";

const toAuthUser = (raw: User | AuthUser | null | undefined): AuthUser | null => {
  if (!raw) return null;
  const normalizedRole = (raw.role || "USER").toString().toUpperCase() as Role;
  return {
    id: String(raw.id),
    email: raw.email,
    name: raw.name || "",
    role: normalizedRole,
    userId: (raw as any).userId ?? raw.id,
    userEmail: (raw as any).userEmail ?? raw.email,
    userName: (raw as any).userName ?? raw.name ?? "",
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(
    async (options?: RefreshOptions): Promise<RefreshResult> => {
      const { clearOnFail = true } = options ?? {};
      try {
        const { data } = await api.get("/auth/me");
        if (data?.ok && data.user) {
          const mapped = toAuthUser(data.user);
          setUser(mapped);
          return "ok";
        }
        if (clearOnFail) setUser(null);
        return "unauthorized";
      } catch (error) {
        const err = error as AxiosError;
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          if (clearOnFail) setUser(null);
          return "unauthorized";
        }
        if (clearOnFail) setUser(null);
        return "error";
      }
    },
    []
  );

  useEffect(() => {
    let active = true;

    (async () => {
      const storedRaw = localStorage.getItem(STORAGE_KEY);
      let storedUser: AuthUser | null = null;
      if (storedRaw) {
        try {
          storedUser = toAuthUser(JSON.parse(storedRaw));
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      const result = await refreshUser({ clearOnFail: true });
      if (!active) return;

      if (result === "ok") {
        // session refreshed
      } else if (result === "error" && storedUser) {
        setUser(storedUser);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      }

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [refreshUser]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const logout = useCallback(async () => {
    await logoutAndRedirect("/login");
    setUser(null);
  }, []);

  const navigateAfterLogin = useCallback((role?: Role) => redirectAfterLogin(role), []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      refreshUser,
      logout,
      setUser,
      navigateAfterLogin,
    }),
    [user, loading, refreshUser, logout, navigateAfterLogin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
