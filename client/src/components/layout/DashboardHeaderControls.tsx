import { Button, Space, Switch, Tooltip, theme as antdTheme } from "antd";
import { BulbOutlined, MoonOutlined, TranslationOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { useEffect, useMemo } from "react";

/**
 * Language + Theme micro-panel
 */
const DashboardHeaderControls = () => {
  const { t, i18n } = useTranslation();
  const { mode, toggle } = useTheme();
  const { token } = antdTheme.useToken();

  const isFa = i18n.language?.startsWith("fa");

  useEffect(() => {
    const html = document.documentElement;
    html.dir = isFa ? "rtl" : "ltr";
    html.lang = isFa ? "fa" : "en";
    localStorage.setItem("lang", isFa ? "fa" : "en");
  }, [isFa]);

  const handleLanguageToggle = () => {
    const nextLang = isFa ? "en" : "fa";
    void i18n.changeLanguage(nextLang);
    localStorage.setItem("lang", nextLang);
  };

  const tooltipLang = useMemo(
    () => t("ui.language.toggle", { defaultValue: isFa ? "Switch language" : "تغییر زبان" }),
    [t, isFa]
  );

  const tooltipTheme = useMemo(
    () =>
      mode === "dark"
        ? t("ui.theme.light", { defaultValue: isFa ? "Light Mode" : "حالت روشن" })
        : t("ui.theme.dark", { defaultValue: isFa ? "Dark Mode" : "حالت تیره" }),
    [t, mode, isFa]
  );

  return (
    <Space align="center" size="middle" style={{ transition: "all .25s ease", paddingInline: 4 }}>
      <Tooltip arrow placement="bottom" title={tooltipLang}>
        <Button
          size="middle"
          type="default"
          icon={<TranslationOutlined />}
          onClick={handleLanguageToggle}
          style={{
            borderRadius: 10,
            fontWeight: 500,
            background: token.colorBgContainer,
            color: token.colorText,
            boxShadow: `0 1px 3px ${token.colorFillSecondary}`,
          }}
        >
          {isFa
            ? t("ui.language.en", { defaultValue: "English" })
            : t("ui.language.fa", { defaultValue: "فارسی" })}
        </Button>
      </Tooltip>

      <Tooltip arrow placement="bottom" title={tooltipTheme}>
        <Switch
          checked={mode === "dark"}
          onChange={() => toggle()}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<BulbOutlined />}
          style={{
            background: mode === "dark" ? token.colorPrimary : token.colorBorder,
            boxShadow: `inset 0 0 2px ${token.colorFillTertiary}`,
          }}
        />
      </Tooltip>
    </Space>
  );
};

export default DashboardHeaderControls;
