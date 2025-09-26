import styles from "./header.module.scss";
import type { NavItem } from "./types";

interface NavMenuProps {
  items: NavItem[];
  onNavigate: (href: string, ev?: React.MouseEvent) => void;
}

export default function NavMenu({ items, onNavigate }: NavMenuProps) {
  return (
    <ul className={styles.menu} role="menubar" aria-orientation="horizontal">
      {items.map((it) => (
        <li key={it.id} role="none">
          <a
            role="menuitem"
            className={styles.menuItem}
            href={it.href}
            onClick={(e) => onNavigate(it.href, e)}
          >
            {it.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
