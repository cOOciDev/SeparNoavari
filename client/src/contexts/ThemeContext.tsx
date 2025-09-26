/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { ConfigProvider, theme } from "antd";

export type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  mode: ThemeMode;              // user-selected mode
  resolved: "light" | "dark";   // actual applied mode
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const LS_THEME = "ui:theme";

function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem(LS_THEME) as ThemeMode) || "system"
  );
  const [resolved, setResolved] = useState<"light" | "dark">(resolveMode(mode));

  // react to system theme changes (only if user chose "system")
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (mode === "system") {
        setResolved(mql.matches ? "dark" : "light");
      }
    };
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, [mode]);

  // apply + persist
  useEffect(() => {
    const r = document.documentElement;
    const now = resolveMode(mode);
    setResolved(now);
    r.setAttribute("data-theme", now);
    localStorage.setItem(LS_THEME, mode);
  }, [mode]);

  const toggle = () =>
    setMode((prev) =>
      prev === "light" ? "dark" : prev === "dark" ? "system" : "light"
    );

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, setMode, toggle }),
    [mode, resolved]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm:
            resolved === "dark"
              ? theme.darkAlgorithm
              : theme.defaultAlgorithm,
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

// Hook export (non-component, allowed with lint disable)
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
