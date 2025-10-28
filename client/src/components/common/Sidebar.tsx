import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthProvider';
import s from '../../styles/panel.module.scss';

const NAV_ITEMS = [
  { to: '/panel/admin', exact: true, labelKey: 'admin.sidebar.dashboard' },
  { to: '/panel/admin/ideas', labelKey: 'admin.sidebar.ideas' },
  { to: '/panel/admin/users', labelKey: 'admin.sidebar.users' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (user?.role !== "ADMIN") {
    return null;
  }

  return (
    <aside className={s.sidebar} aria-label={t('admin.sidebar.aria', { defaultValue: 'Admin sidebar' })}>
      <nav>
        <ul className={s.navList}>
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className={s.navItem}>
              <NavLink
                to={item.to}
                end={item.exact}
                className={({ isActive }) => (isActive ? s.active : undefined)}
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

