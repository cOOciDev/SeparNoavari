import { useEffect, useRef } from "react";
import DashboardHeaderControls from "../../layout/DashboardHeaderControls";
import styles from "./header.module.scss";
import type { Lang, NavItem, ThemeMode } from "./types";

interface MobileMenuProps {
  id: string;
  open: boolean;
  onClose: () => void;

  lang: Lang;
  theme: ThemeMode;
  onLangChange: (v: Lang) => void;

  navItems: NavItem[];
  onNavigate: (href: string, ev?: React.MouseEvent) => void;

  onSubmitIdea?: () => void;
  isAuthenticated: boolean;
  ctaLabel: string;

  loginHref?: string;
  signupHref?: string;
  accountHref?: string;
}

export default function MobileMenu({
  id,
  open,
  onClose,
  lang,

  navItems,
  onNavigate,
  onSubmitIdea,
  isAuthenticated,
  ctaLabel,
  loginHref = "/login",
  signupHref = "/signup",
  accountHref = "/account",
}: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  /* --- ESC closes --- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  /* --- lock body scroll --- */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  /* --- click outside closes --- */
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      const panel = panelRef.current;
      if (!panel) return;
      if (!panel.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      id={id}
      className={styles.mobileRoot}
      role="dialog"
      aria-modal="true"
      aria-label={lang === "fa" ? "منوی موبایل" : "Mobile menu"}
    >
      <div className={styles.mobileBackdrop} />
      <div className={styles.mobilePanel} ref={panelRef}>
        {/* 🔆 Controls: language + theme */}
        <div className={styles.mobileBlock}>
          <DashboardHeaderControls />
        </div>

        {/* 🧭 Navigation Links */}
        <div className={styles.mobileList}>
          {navItems.map((it) => (
            <a
              key={it.id}
              className={styles.mobileItem}
              href={it.href}
              onClick={(e) => { onNavigate(it.href, e); setTimeout(onClose, 100); }}
            >
              {it.label}
            </a>
          ))}
        </div>

        {/* 🚀 Auth / CTA actions */}
        <div className={styles.mobileBlock}>
          {isAuthenticated ? (
            <>
              <a className={styles.mobileItem} href={accountHref}>
                {lang === "fa" ? "حساب کاربری" : "My Account"}
              </a>
              <button className={styles.mobileItem} onClick={onSubmitIdea}>
                {ctaLabel}
              </button>
            </>
          ) : (
            <>
              <button className={styles.mobileItem} onClick={onSubmitIdea}>
                {ctaLabel}
              </button>
              <a className={styles.mobileItem} href={loginHref}>
                {lang === "fa" ? "ورود" : "Log in"}
              </a>
              <a className={styles.mobileItem} href={signupHref}>
                {lang === "fa" ? "ثبت‌نام" : "Sign up"}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
