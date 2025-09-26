import { Outlet } from "react-router-dom";
import Sidebar from "../../components/common/Sidebar";
import Topbar from "../../components/common/Topbar";
import s from "../../styles/panel.module.scss";

export default function AdminLayout() {
  return (
    <div className={s.layout} data-panel="admin">
      <Sidebar />
      <div className={s.main}>
        <Topbar />
        <div className={s.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
