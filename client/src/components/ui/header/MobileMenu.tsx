import { useEffect, useRef } from "react";
import styles from "./header.module.scss";
import NavActions from "./NavActions";
import Actions from "./Actions";
import type { Lang, NavItem, ThemeMode } from "./types";

interface MobileMenuProps {
  id: string;
  open: boolean;
  onClose: () => void;

  lang: Lang;
  theme: ThemeMode;
  onLangChange: (v: Lang) => void;
  onThemeChange: (v: ThemeMode) => void;

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
  theme,
  onLangChange,
  onThemeChange,
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
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLAnchorElement | null>(null);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Click outside closes
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const panel = panelRef.current;
      if (!panel) return;
      const target = e.target as Node;
      if (!panel.contains(target)) onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    firstFocusRef.current?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])');
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); (last as HTMLElement)?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); (first as HTMLElement)?.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [open]);

  if (!open) return null;

  return (
    <div id={id} className={styles.mobileRoot} role="dialog" aria-modal="true" aria-label={lang === "fa" ? "منوی موبایل" : "Mobile menu"}>
      <div className={styles.mobileBackdrop} />
      <div className={styles.mobilePanel} ref={panelRef}>
        {/* Top controls */}
        {/* <div className={styles.mobileBlock}>
          
        </div> */}

        {/* Primary CTA first for prominence */}
        <div className={styles.mobileBlock}>
        <NavActions
            lang={lang}
            onLangChange={onLangChange}
            theme={theme}
            onThemeChange={onThemeChange}
          />
          <Actions
            isAuthenticated={isAuthenticated}
            ctaLabel={ctaLabel}
            onSubmitIdea={onSubmitIdea}
            lang={lang}
            loginHref={loginHref}
            signupHref={signupHref}
            accountHref={accountHref}
          />
        </div>

        {/* Links */}
        <div className={styles.mobileList}>
          {/* Sentinel for focus trap start */}
          <button ref={firstFocusRef} className="sr-only" aria-hidden="true" tabIndex={0} />

          {navItems.map((it) => (
            <a
              key={it.id}
              className={styles.mobileItem}
              href={it.href}
              onClick={(e) => { onNavigate(it.href, e); setTimeout(onClose, 0); }}
            >
              {it.label}
            </a>
          ))}

          {/* Sentinel end */}
          <a ref={lastFocusRef} className="sr-only" aria-hidden="true" tabIndex={0} href="#" onClick={(e) => e.preventDefault()} />
        </div>
      </div>
    </div>
  );
}
