import { Button } from "antd";
import styles from "./header.module.scss";
import type { Lang } from "./types";

type Props = {
  isAuthenticated: boolean;
  ctaLabel: string;
  onSubmitIdea?: () => void;
  onLoginClick?: () => void;
  lang: Lang;
  loginHref?: string;
  signupHref?: string;
  accountHref?: string;
  authUser?: unknown;
};

export default function Actions({
  isAuthenticated,
  ctaLabel,
  onSubmitIdea,
  onLoginClick,
  lang,
  loginHref = "/login",
  signupHref = "/signup",
  accountHref = "/account",
}: Props) {
  if (isAuthenticated) {
    return (
      <div className={styles.actions}>
        <Button
          className={styles.primaryCta}
          type="primary"
          onClick={onSubmitIdea}
        >
          {ctaLabel}
        </Button>
        <Button
          className={styles.secondary}
          href={accountHref}
        >
          {lang === "fa" ? "حساب کاربری" : "My Account"}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.actions}>
      <Button
        className={styles.primaryCta}
        type="primary"
        onClick={onSubmitIdea}
      >
        {ctaLabel}
      </Button>
      <Button
        className={styles.secondary}
        href={loginHref}
        onClick={onLoginClick}
      >
        {lang === "fa" ? "ورود" : "Log in"}
      </Button>
      {/* <Button
        className={styles.secondary}
        href={signupHref}
      >
        {lang === "fa" ? "ثبت‌نام" : "Sign up"}
      </Button> */}
    </div>
  );
}
