import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api from '../service/api';

type Role = 'user' | 'admin' | 'judge';

export interface AuthUser {
  userName: string;
  userEmail: string;
  userId: number | string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed) {
          const normalizedRole: Role =
            parsed.role === 'admin' ? 'admin' : parsed.role === 'judge' ? 'judge' : 'user';
          setUser({
            userName: parsed.userName ?? '',
            userEmail: parsed.userEmail ?? '',
            userId: parsed.userId ?? '',
            role: normalizedRole,
          });
        }
      } catch {
        // ignore malformed storage
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const logout = async () => {
    try {
      await api.post('logout', {}, { withCredentials: true });
    } catch {
      // ignore logout errors (likely already invalidated)
    }
    setUser(null);
    window.location.href = '/';
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      setUser,
      logout,
    }),
    [user, loading]
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





