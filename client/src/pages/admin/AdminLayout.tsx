import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/common/Sidebar";
import Topbar from "../../components/common/Topbar";
import s from "../../styles/panel.module.scss";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div
      className={s.layout}
      data-panel="admin"
      data-has-sidebar="true"
      data-sidebar-open={sidebarOpen ? "true" : "false"}
    >
      <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />
      <div className={s.main}>
        <Topbar onToggleSidebar={handleToggleSidebar} />
        <div className={s.content}>
          <Outlet />
        </div>
      </div>
      <button
        type="button"
        className={s.sidebarBackdrop}
        aria-hidden="true"
        onClick={handleSidebarClose}
        data-open={sidebarOpen ? "true" : "false"}
        hidden={!sidebarOpen}
      />
    </div>
  );
}
