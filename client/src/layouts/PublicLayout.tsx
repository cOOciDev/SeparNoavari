import { Layout, Menu } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthProvider';

const { Header, Content, Footer } = Layout;

const PublicLayout = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();

  const menuItems = [
    { key: '/', label: t('nav.home', { defaultValue: 'Home' }), to: '/' },
    { key: '/tracks', label: t('nav.tracks', { defaultValue: 'Tracks' }), to: '/tracks' },
    { key: '/committee', label: t('nav.committee', { defaultValue: 'Committee' }), to: '/committee' },
    {
      key: '/ideas/mine',
      label: isAuthenticated
        ? t('nav.myIdeas', { defaultValue: 'My Ideas' })
        : t('nav.login', { defaultValue: 'Login' }),
      to: isAuthenticated ? '/ideas/mine' : '/login',
    },
  ];

  const activeKey =
    menuItems.find((item) => location.pathname.startsWith(item.key))?.key || '/';

  return (
    <Layout style={{ minHeight: '100vh' }} dir={i18n.language === "fa" ? "rtl" : "ltr"}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingInline: 24,
        }}
      >
        <Link to="/" style={{ color: 'inherit', fontWeight: 700, fontSize: 18 }}>
          {t('brandName', { defaultValue: 'Separ Noavari' })}
        </Link>
        <Menu
          mode="horizontal"
          selectedKeys={[activeKey]}
          items={menuItems.map((item) => ({
            key: item.key,
            label: <Link to={item.to}>{item.label}</Link>,
          }))}
          style={{ minWidth: 420 }}
        />
      </Header>
      <Content style={{ padding: '24px', background: 'var(--bg, #f5f7fa)' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        {t('footer.copyright', {
          defaultValue:" Separ Noavari ©" ,
        })}
      </Footer>
    </Layout>
  );
};

export default PublicLayout;
