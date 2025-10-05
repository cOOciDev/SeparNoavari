import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./header/header.module.scss";
import Brand from "./header/Brand";

import NavActions from "./header/NavActions";
import Actions from "./header/Actions";
import MobileMenu from "./header/MobileMenu";
import type { HeaderProps, Lang, NavItem } from "./header/types";

import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeContext";
import i18n from "../../AppData/i18n";

// keep your lang+dir helpers
function applyLangAndDir(lang: Lang) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "fa" ? "rtl" : "ltr";
}

export default function Header({
  // ⛳️ removed isAuthenticated (we read it from AuthContext)
  onLoginClick,
  onSubmitIdea,
  currentLang = "fa",
  onLanguageChange,
  // ⛳️ removed initialTheme/onThemeChange (we use ThemeContext)
  navItems,
  logoSrc = "/images/logo.png",
  brandTitleFa = "همایش ملی سپر نوآوری",
  brandTitleEn = "Spear Innovation Event",
  ctaLabelFa = "ثبت ایده",
  ctaLabelEn = "Submit Idea",
  loginHref = "/login",
  signupHref = "/signup",
  accountHref = "/account",
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // ---- Auth (single source of truth) ----
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);

  // ---- Theme from ThemeContext (no localStorage here) ----
  const { mode: theme, setMode: setTheme } = useTheme();

  // ---- Language ----
  const [lang, setLang] = useState<Lang>(currentLang);
  useEffect(() => {
    applyLangAndDir(lang);
    try {
      // if you have i18next in window
      i18n.changeLanguage(lang).catch((err) => {
        console.warn("Failed to change language", err);
      });
    } catch (err) {
      console.warn("Failed to change language", err);
    }
    onLanguageChange?.(lang);
  }, [lang, onLanguageChange]);

  // ---- Scroll shadow ----
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ---- Default nav items ----
  const items: NavItem[] = useMemo(
    () =>
      navItems ?? [
        {
          id: "submit",
          label: lang === "fa" ? "ثبت ایده" : "Submit",
          href: "/ideas/new",
        },
        {
          id: "committee",
          label: lang === "fa" ? "دبیرخانه" : "Committee",
          href: "/committee",
        },
        {
          id: "calendar",
          label: lang === "fa" ? "تقویم " : "Timeline",
          href: "#timeline",
        },
        {
          id: "resources",
          label: lang === "fa" ? "منابع" : "Resources",
          href: "#resources",
        },
        {
          id: "contact",
          label: lang === "fa" ? "ارتباط" : "Contact",
          href: "#contact",
        },
      ],
    [navItems, lang]
  );

  // ---- Router-aware navigate ----
  const onNavigate = useCallback(
    (href: string, ev?: React.MouseEvent) => {
      if (href.startsWith("#")) return; // let smooth scroll handle it
      ev?.preventDefault();
      navigate(href);
    },
    [navigate]
  );

  // ---- Active state helper ----
  const activePath = location.pathname;
  const isActive = useCallback(
    (href: string) => href === activePath,
    [activePath]
  );

  // ---- Mobile menu ----
  const [open, setOpen] = useState(false);
  const toggleMenu = () => setOpen((v) => !v);
  const closeMenu = () => setOpen(false);

  const ctaLabel = lang === "fa" ? ctaLabelFa : ctaLabelEn;
  const brandTitle = lang === "fa" ? brandTitleFa : brandTitleEn;

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        {/* Left: burger + brand */}
        <div className={styles.left}>
          <Brand
            logoSrc={logoSrc}
            title={brandTitle}
            onHomeNavigate={() => navigate("/")}
            lang={lang}
          />
          

        </div>

<button
            className={styles.burger}
            aria-controls="mobile-menu"
            aria-expanded={open}
            aria-label={
              lang === "fa"
                ? open
                  ? "بستن منو"
                  : "باز کردن منو"
                : open
                ? "Close menu"
                : "Open menu"
            }
            onClick={toggleMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
        {/* Center: nav */}
        <nav
          className={styles.nav}
          aria-label={lang === "fa" ? "ناوبری اصلی" : "Primary navigation"}
        >
          <ul
            className={styles.menu}
            role="menubar"
            aria-orientation="horizontal"
          >
            {items.map((it) => (
              <li key={it.id} role="none">
                <a
                  role="menuitem"
                  href={it.href}
                  className={`${styles.menuItem} ${
                    isActive(it.href) ? styles.isActive : ""
                  }`}
                  aria-current={isActive(it.href) ? "page" : undefined}
                  onClick={(e) => onNavigate(it.href, e)}
                >
                  {it.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: lang/theme + actions */}
        <div className={styles.right}>
          
          <NavActions
            lang={lang}
            onLangChange={setLang}
            theme={theme} // ← from ThemeContext
            onThemeChange={setTheme} // ← from ThemeContext
          />
          <br/><br/>
          <Actions
            isAuthenticated={isAuthenticated} // ← from AuthContext
            ctaLabel={ctaLabel}
            onSubmitIdea={onSubmitIdea}
            onLoginClick={onLoginClick}
            lang={lang}
            loginHref={loginHref}
            signupHref={signupHref}
            accountHref={accountHref}
          />
        </div>
      </div>

      {/* Mobile drawer */}
      <MobileMenu
        id="mobile-menu"
        open={open}
        onClose={closeMenu}
        lang={lang}
        theme={theme}
        onLangChange={setLang}
        onThemeChange={setTheme}
        navItems={items}
        onNavigate={onNavigate}
        onSubmitIdea={onSubmitIdea}
        isAuthenticated={isAuthenticated}
        ctaLabel={ctaLabel}
        loginHref={loginHref}
        signupHref={signupHref}
        accountHref={accountHref}
      />
    </header>
  );
}
