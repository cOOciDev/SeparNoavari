export type Lang = "fa" | "en";
export type ThemeMode = "light" | "dark";

export type NavItem = {
  id: string;
  label: string;
  href: string;
};

export type HeaderProps = {
  onLoginClick?: () => void;
  onSubmitIdea?: () => void;
  currentLang?: Lang;
  onLanguageChange?: (l: Lang) => void;
  navItems?: NavItem[];

  logoSrc?: string;
  brandTitleFa?: string;
  brandTitleEn?: string;

  ctaLabelFa?: string;
  ctaLabelEn?: string;

  loginHref?: string;
  signupHref?: string;
  accountHref?: string;
};
