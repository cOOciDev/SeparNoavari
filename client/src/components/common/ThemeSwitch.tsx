// ThemeSwitch.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";

export default function ThemeSwitch() {
  const { mode, setMode, toggle } = useTheme();
  const { t } = useTranslation();

  const baseBtn =
    "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition " +
    "hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const seg = (active: boolean) =>
    `${baseBtn} ${active ? "bg-black/10 dark:bg-white/15" : "bg-transparent"}`;

  return (
    <div className="flex items-center gap-2">
      {/* Toggle */}
      <button
        type="button"
        onClick={toggle}
        className={baseBtn}
        aria-label={t("theme.toggle", { defaultValue: "Toggle theme" })}
      >
        {mode === "dark" ? (
          <>
            <i className="fa-solid fa-moon"></i>
            {t("theme.dark", { defaultValue: "Dark" })}
          </>
        ) : (
          <>
            <i className="fa-solid fa-sun text-yellow-500"></i>
            {t("theme.light", { defaultValue: "Light" })}
          </>
        )}
      </button>

      {/* Direct selection */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={seg(mode === "light")}
          aria-pressed={mode === "light"}
          onClick={() => setMode("light")}
          title={t("theme.light", { defaultValue: "Light" })}
        >
          <i className="fa-solid fa-sun text-yellow-500"></i>
        </button>
        <button
          type="button"
          className={seg(mode === "dark")}
          aria-pressed={mode === "dark"}
          onClick={() => setMode("dark")}
          title={t("theme.dark", { defaultValue: "Dark" })}
        >
          <i className="fa-solid fa-moon"></i>
        </button>
      </div>
    </div>
  );
}
