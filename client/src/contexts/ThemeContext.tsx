/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ConfigProvider, theme } from "antd";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;            // user-selected mode
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const LS_THEME = "ui:theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem(LS_THEME) as ThemeMode) || "light"
  );

  // apply + persist
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", mode);
    localStorage.setItem(LS_THEME, mode);
  }, [mode]);

  const toggle = () => setMode((prev) => (prev === "light" ? "dark" : "light"));

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, toggle }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

// Hook export
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
