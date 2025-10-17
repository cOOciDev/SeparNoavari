import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AxiosError } from 'axios';
import api from '../service/api';

type Role = 'user' | 'admin' | 'judge';

export interface AuthUser {
  userName: string;
  userEmail: string;
  userId: number | string;
  role: Role;
}

type RefreshResult = 'ok' | 'unauthorized' | 'error';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'user';

const normalizeRole = (value: unknown): Role =>
  value === 'admin' ? 'admin' : value === 'judge' ? 'judge' : 'user';

const toAuthUser = (raw: any): AuthUser => ({
  userName: raw?.name ?? raw?.userName ?? '',
  userEmail: raw?.email ?? raw?.userEmail ?? '',
  userId: raw?.id ?? raw?.userId ?? '',
  role: normalizeRole(raw?.role),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(
    async (options?: RefreshOptions): Promise<RefreshResult> => {
      const { clearOnFail = true } = options ?? {};
      try {
        const { data } = await api.get('me');
        if (data) {
          setUser(toAuthUser(data));
          return 'ok';
        }
        if (clearOnFail) setUser(null);
        return 'unauthorized';
      } catch (error) {
        const err = error as AxiosError;
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          if (clearOnFail) setUser(null);
          return 'unauthorized';
        }
        if (clearOnFail) setUser(null);
        return 'error';
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

      if (result === 'ok') {
        // Server session refreshed successfully.
      } else if (result === 'error' && storedUser) {
        // Keep cached user temporarily when the network request fails.
        setUser(storedUser);
      } else {
        // No valid session; clear cached credentials.
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
    try {
      await api.post('logout', {}, { withCredentials: true });
    } catch {
      // ignore logout errors
    }
    setUser(null);
    window.location.href = '/';
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      refreshUser,
      logout,
      setUser,
    }),
    [user, loading, refreshUser, logout, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
