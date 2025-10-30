import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthProvider";
import s from "../../styles/panel.module.scss";

const NAV_ITEMS = [
  { to: "/panel/admin", exact: true, labelKey: "admin.sidebar.dashboard" },
  { to: "/panel/admin/ideas", labelKey: "admin.sidebar.ideas" },
  { to: "/panel/admin/users", labelKey: "admin.sidebar.users" },
];

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ open = false, onClose }: SidebarProps = {}) {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (user?.role !== "ADMIN") {
    return null;
  }

  const handleNavigate = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const hasClose = typeof onClose === "function";

  return (
    <aside
      className={s.sidebar}
      data-open={open ? "true" : "false"}
      aria-label={t("admin.sidebar.aria", { defaultValue: "Admin sidebar" })}
    >
      {hasClose ? (
        <div className={s.sidebarHeader}>
          <strong>{t("admin.sidebar.title", { defaultValue: "Admin Panel" })}</strong>
          <button
            type="button"
            className={s.sidebarClose}
            onClick={onClose}
            aria-label={t("admin.sidebar.close", { defaultValue: "Close menu" })}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      ) : null}
      <nav>
        <ul className={s.navList}>
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className={s.navItem}>
              <NavLink
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  [s.navLink, isActive ? s.navLinkActive : ""].filter(Boolean).join(" ")
                }
                onClick={handleNavigate}
              >
                {t(item.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
