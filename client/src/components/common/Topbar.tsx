import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import s from "../../styles/panel.module.scss";

type TopbarProps = {
  title?: string;
  actions?: ReactNode;
  onToggleSidebar?: () => void;
};

export default function Topbar({ title, actions, onToggleSidebar }: TopbarProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("admin.topbar.title");
  const hasToggle = typeof onToggleSidebar === "function";

  return (
    <header className={s.topbar}>
      <div className={s.topbarInner}>
        <div className={s.topbarLeft}>
          {hasToggle ? (
            <button
              type="button"
              className={s.sidebarToggle}
              onClick={onToggleSidebar}
              aria-label={t("admin.sidebar.open", { defaultValue: "Open menu" })}
            >
              <span />
              <span />
              <span />
            </button>
          ) : null}
          <strong className={s.topbarTitle}>{resolvedTitle}</strong>
        </div>
        {actions ? <div className={s.topbarActions}>{actions}</div> : null}
      </div>
    </header>
  );
}
