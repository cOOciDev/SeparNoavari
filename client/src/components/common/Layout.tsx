import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthProvider";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import s from "../../styles/panel.module.scss";

export default function Layout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasSidebar = user?.role === "ADMIN";

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div
      className={s.layout}
      data-has-sidebar={hasSidebar ? "true" : "false"}
      data-sidebar-open={sidebarOpen ? "true" : "false"}
    >
      {hasSidebar ? <Sidebar open={sidebarOpen} onClose={handleSidebarClose} /> : null}
      <div className={s.main}>
        <Topbar onToggleSidebar={hasSidebar ? handleToggleSidebar : undefined} />
        <div className={s.content}>
          <Outlet />
        </div>
      </div>
      {hasSidebar ? (
        <button
          type="button"
          className={s.sidebarBackdrop}
          aria-hidden="true"
          onClick={handleSidebarClose}
          data-open={sidebarOpen ? "true" : "false"}
          hidden={!sidebarOpen}
        />
      ) : null}
    </div>
  );
}
