import styles from "./header.module.scss";
import type { Lang, ThemeMode } from "./types";

interface NavActionsProps {
  lang: Lang;
  onLangChange: (v: Lang) => void;
  theme: ThemeMode;
  onThemeChange: (v: ThemeMode) => void;
}

export default function NavActions({
  lang,
  onLangChange,
  theme,
  onThemeChange,
}: NavActionsProps) {
  const isFa = lang === "fa";

  function toggleLang() {
    onLangChange(isFa ? "en" : "fa");
  }

  function cycleTheme() {
    const next: ThemeMode = theme === "light" ? "dark" : "light";
    onThemeChange(next);
  }

  return (
    <div className={styles.navActions}>
      <button
        className={styles.langBtn}
        onClick={toggleLang}
        aria-label={isFa ? "تغییر زبان به انگلیسی" : "Switch language to Persian"}
        title={isFa ? "EN" : "FA"}
      >
        {isFa ? "EN" : "FA"}
      </button>

      <button
        className={styles.themeBtn}
        onClick={cycleTheme}
        aria-label={isFa ? "تغییر تم" : "Toggle theme"}
        title={theme.toUpperCase()}
      >
        <span className={styles.themeIcon} aria-hidden="true" />
      </button>
    </div>
  );
}
