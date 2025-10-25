import { Layout, Menu, Tag, Space } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthProvider";
import { logoutAndRedirect } from "../utils/session";
import DashboardHeaderControls from "../components/layout/DashboardHeaderControls";

const { Header, Sider, Content } = Layout;

const JudgeLayout = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const items = [
    {
      key: "/judge",
      label: <Link to="/judge">{t("nav.judgeDashboard", { defaultValue: "وظایف من" })}</Link>,
    },
  ];

  const activeKey =
    items.find((item) => location.pathname === item.key || location.pathname.startsWith(item.key))?.key ||
    "/judge";

  return (
    <Layout style={{ minHeight: "100vh" }} dir={i18n.language === "fa" ? "rtl" : "ltr"}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div
          style={{
            color: "white",
            padding: "16px 24px",
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          {t("judge.title", { defaultValue: "پنل داور" })}
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
            <Tag color="geekblue">{t("judge.header.role", { defaultValue: "داور" })}</Tag>
          </div>
          <Space size="middle" align="center">
            <DashboardHeaderControls />
            <a style={{ fontWeight: 500, cursor: "pointer" }} onClick={() => logoutAndRedirect("/login")}>
              {t("nav.logout", { defaultValue: "خروج" })}
            </a>
          </Space>
        </Header>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default JudgeLayout;
