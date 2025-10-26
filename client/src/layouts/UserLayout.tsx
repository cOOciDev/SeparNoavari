import { Layout, Menu, Space } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthProvider";
import { logoutAndRedirect } from "../utils/session";
import DashboardHeaderControls from "../components/layout/DashboardHeaderControls";

const { Header, Sider, Content } = Layout;

const UserLayout = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  const items = [
    {
      key: "/ideas/mine",
      label: <Link to="/ideas/mine">{t("nav.myIdeas", { defaultValue: "ایده‌های من" })}</Link>,
    },
    {
      key: "/ideas/new",
      label: <Link to="/ideas/new">{t("nav.submit", { defaultValue: "ثبت ایده" })}</Link>,
    },
    {
      key: "/profile",
      label: <Link to="/profile">{t("nav.profile", { defaultValue: "حساب کاربری" })}</Link>,
    },
  ];

  const activeKey =
    items.find((item) => location.pathname.startsWith(item.key))?.key || items[0].key;

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
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <img
              src="/images/logo.png"
              alt={t("logoAlt", { defaultValue: "Brand logo" })}
              style={{ height: 32 }}
            />
            <strong style={{ fontSize: 16 }}>
              {t("program", { defaultValue: "Innovation Program" })}
            </strong>
          </Link>
          {t("nav.dashboard", { defaultValue: "پیشخوان" })}
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
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <img
              src="/images/logo.png"
              alt={t("logoAlt", { defaultValue: "Brand logo" })}
              style={{ height: 32 }}
            />
            <strong style={{ fontSize: 16 }}>
              {t("program", { defaultValue: "Innovation Program" })}
            </strong>
          </Link>
          <div>
            {t("header.hello", { defaultValue: "سلام" })} {user?.name || user?.email}
          </div>
          <Space size="middle" align="center">
            <DashboardHeaderControls />
            <a
              style={{ fontWeight: 500, cursor: "pointer" }}
              onClick={() => logoutAndRedirect("/login")}
            >
              {t("nav.logout", { defaultValue: "خروج" })}
            </a>
          </Space>
        </Header>
        <Content style={{ padding: 24 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserLayout;
