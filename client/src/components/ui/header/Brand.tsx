import styles from "./header.module.scss";
import type { Lang } from "./types";

interface BrandProps {
  logoSrc: string;
  title: string;
  onHomeNavigate: () => void;
  lang: Lang;
}

export default function Brand({ logoSrc, title, onHomeNavigate, lang }: BrandProps) {
  return (
    <div className={styles.brand}>
      <a
        className={styles.brandBtn}
        href="/"
        onClick={(e) => { e.preventDefault(); onHomeNavigate(); }}
        aria-label={lang === "fa" ? "رفتن به صفحه اصلی" : "Go to homepage"}
      >
        <img className={styles.logo} src={logoSrc} alt="" aria-hidden="true" />
        <span className={styles.title}>{title}</span>
      </a>
    </div>
  );
}
