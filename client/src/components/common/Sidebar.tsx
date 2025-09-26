import { NavLink } from "react-router-dom";
import s from "../../styles/panel.module.scss";

export default function Sidebar() {
  return (
    <aside className={s.sidebar} aria-label="Admin sidebar">
      <nav>
        <ul className={s.navList}>
          <li className={s.navItem}>
            <NavLink
              to="/panel/admin"
              end
              className={({ isActive }) => (isActive ? s.active : undefined)}
            >
              Dashboard
            </NavLink>
          </li>
          <li className={s.navItem}>
            <NavLink
              to="/panel/admin/ideas"
              className={({ isActive }) => (isActive ? s.active : undefined)}
            >
              Ideas
            </NavLink>
          </li>
          <li className={s.navItem}>
            <NavLink
              to="/panel/admin/judges"
              className={({ isActive }) => (isActive ? s.active : undefined)}
            >
              Judges
            </NavLink>
          </li>
          <li className={s.navItem}>
            <NavLink
              to="/panel/admin/assignments"
              className={({ isActive }) => (isActive ? s.active : undefined)}
            >
              Assignments
            </NavLink>
          </li>
          <li className={s.navItem}>
            <NavLink
              to="/panel/admin/users"
              className={({ isActive }) => (isActive ? s.active : undefined)}
            >
              Users
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
