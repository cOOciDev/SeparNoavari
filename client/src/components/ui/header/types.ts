// client/src/app/components/ui/header/types.ts

export type Lang = "fa" | "en";
export type ThemeMode = "light" | "dark" ;

export interface NavItem {
  id: string;
  label: string;
  href: string; // "/route" or "#section"
}

export interface HeaderProps {
  /** optional: callback for when login button is clicked */
  onLoginClick?: () => void;

  /** optional: callback for when CTA "submit idea" button is clicked */
  onSubmitIdea?: () => void;

  /** initial language (default: "fa") */
  currentLang?: Lang;

  /** optional: notify parent when language changes */
  onLanguageChange?: (lang: Lang) => void;

  /** override nav items; if omitted, Header builds defaults */
  navItems?: NavItem[];

  /** branding & copy */
  logoSrc?: string;
  brandTitleFa?: string;
  brandTitleEn?: string;

  /** CTA button labels */
  ctaLabelFa?: string;
  ctaLabelEn?: string;

  /** auth-related hrefs (used by <Actions/>) */
  loginHref?: string;
  signupHref?: string;
  accountHref?: string;
}

/** extend global window for optional i18next integration */
declare global {
  interface Window {
    i18next?: { changeLanguage?: (lng: string) => void };
  }
}
