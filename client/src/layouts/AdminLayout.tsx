import { Layout, Menu, Tag } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthProvider";
import { logoutAndRedirect } from "../utils/session";

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  const items = [
    {
      key: "/admin",
      label: <Link to="/admin">{t("admin.sidebar.dashboard", { defaultValue: "Dashboard" })}</Link>,
    },
    {
      key: "/admin/ideas",
      label: <Link to="/admin/ideas">{t("admin.sidebar.ideas", { defaultValue: "Ideas" })}</Link>,
    },
    {
      key: "/admin/judges",
      label: <Link to="/admin/judges">{t("admin.sidebar.judges", { defaultValue: "Judges" })}</Link>,
    },
    {
      key: "/admin/assignments",
      label: (
        <Link to="/admin/assignments">
          {t("admin.sidebar.assignments", { defaultValue: "Assignments" })}
        </Link>
      ),
    },
    {
      key: "/admin/users",
      label: <Link to="/admin/users">{t("admin.sidebar.users", { defaultValue: "Users" })}</Link>,
    },
  ];

  const activeKey =
    items.find((item) => location.pathname === item.key || location.pathname.startsWith(item.key))?.key ||
    "/admin";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div
          style={{
            color: "white",
            padding: "16px 24px",
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          {t("admin.topbar.title", { defaultValue: "Admin Panel" })}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[activeKey]} items={items} />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "transparent",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingInline: 24,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>{user?.name || user?.email}</span>
            <Tag color="red">ADMIN</Tag>
          </div>
          <a style={{ fontWeight: 500, cursor: "pointer" }} onClick={() => logoutAndRedirect("/login")}>
            {t("nav.logout", { defaultValue: "Log out" })}
          </a>
        </Header>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
