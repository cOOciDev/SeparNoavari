import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./header.module.scss";
import type { Lang } from "./types";
import { useAuth } from "../../../contexts/AuthProvider";
import { RxExit } from "react-icons/rx";
import { FiUser, FiLogIn } from "react-icons/fi";

interface ActionsProps {
  isAuthenticated: boolean;
  ctaLabel: string;
  onSubmitIdea?: () => void;
  onLoginClick?: () => void;
  lang: Lang;

  loginHref?: string;
  signupHref?: string;
  accountHref?: string;
  // optional: the header can pass the canonical user object to avoid context mismatch
  authUser?: { userName?: string; userEmail?: string; userId?: number | string; role?: string } | null;
}

const SCROLL_KEY = "pendingScrollId";

function scheduleScroll(id: string) {
  try {
    sessionStorage.setItem(SCROLL_KEY, id);
  } catch {
    /* empty */
  }
}

function tryScrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export default function Actions({
  onLoginClick,
  lang,
  loginHref = "/login",
  accountHref = "/account",
  authUser = null,
}: ActionsProps) {
  const { t } = useTranslation();
  const authContext = useAuth();
  const { logout } = authContext;
  // Prefer the user object passed from Header (authUser) to avoid mismatch between contexts
  const user = authUser ?? (authContext as any).user;
  if (import.meta.env.DEV) console.log('[Header.Actions] user (resolved):', user);
  // اسکرول خودکار پس از برگشت به لندینگ (با چند تلاش کوتاه)
  useEffect(() => {
    let id: string | null = null;
    try {
      id = sessionStorage.getItem(SCROLL_KEY);
    } catch {
      /* empty */
    }
    if (!id) return;

    let tries = 0;
    const maxTries = 24; // ~1.2s اگر هر 50ms
    const timer = setInterval(() => {
      tries++;
      const ok = tryScrollToId(id as string);
      if (ok || tries >= maxTries) {
        clearInterval(timer);
        try {
          sessionStorage.removeItem(SCROLL_KEY);
        } catch {
          /* empty */
        }
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  // هندل کلیک روی لینک‌های سکشنی از هر صفحه (حتی غیر از /)
  useEffect(() => {
    const sectionIds = new Set(["timeline", "resources", "contact"]);

    const onDocClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      const a = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;

      const href = a.getAttribute("href") || "";
      // پشتیبانی از "#id" و "/#id"
      const match = href.startsWith("#")
        ? href.slice(1)
        : href.startsWith("/#")
        ? href.slice(2)
        : "";

      if (match && sectionIds.has(match)) {
        if (window.location.pathname !== "/") {
          // از صفحهٔ غیر لندینگ: مقصد را ذخیره کن و یکجا به /#id برو
          ev.preventDefault();
          scheduleScroll(match);
          window.location.assign(`/#${match}`);
        }
        // روی / هستیم: مرورگر خودش اسکرول می‌کند (smooth فعال)
      }
    };

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const secondaryHref = user ? accountHref : loginHref;
  const secondaryLabel = user ? t("header.myAccount") : t("header.signInOrRegister");

  return (
    <div className={styles.actions} data-qa="header-actions">
      <a
        href={secondaryHref}
        className={`${styles.secondary} ${user ? styles.secondaryAuthed : ""} header-secondary`}
        onClick={() => {
          if (!user) {
            try {
              onLoginClick?.();
            } catch {
              /* empty */
            }
          }
        }}
        data-qa="cta-secondary"
        aria-label={user ? secondaryLabel : undefined}
      >
        {user ? (
          <>
            <FiUser aria-hidden="true" style={{ marginInlineEnd: 6 }} />
            <span className="sr-only">{secondaryLabel}</span>
          </>
        ) : (
          <>
            <FiLogIn aria-hidden="true" style={{ marginInlineEnd: 6 }} />
            {secondaryLabel}
          </>
        )}
      </a>

      {user && (
        <button className={styles.primaryCta} onClick={() => logout()}>
          <RxExit size={20} />
        </button>
      )}
    </div>
  );
}
