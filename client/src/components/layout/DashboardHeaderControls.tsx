import { Button, Space, Switch, Tooltip } from "antd";
import {
  BulbOutlined,
  MoonOutlined,
  TranslationOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";

const DashboardHeaderControls = () => {
  const { t, i18n } = useTranslation();
  const { mode, toggle } = useTheme();

  const isFa = i18n.language?.startsWith("fa");

  const handleLanguageToggle = () => {
    const nextLang = isFa ? "en" : "fa";
    void i18n.changeLanguage(nextLang);
    localStorage.setItem("lang", nextLang);
  };

  return (
    <Space align="center" size="middle">
      <Tooltip
        arrow
        placement="bottom"
        title={t("ui.language.toggle", {
          defaultValue: "تغییر زبان",
        })}
      >
        <Button
          size="small"
          icon={<TranslationOutlined />}
          onClick={handleLanguageToggle}
        >
          {isFa
            ? t("ui.language.en", { defaultValue: "English" })
            : t("ui.language.fa", { defaultValue: "فارسی" })}
        </Button>
      </Tooltip>

      <Tooltip
        arrow
        placement="bottom"
        title={
          mode === "dark"
            ? t("ui.theme.light", { defaultValue: "حالت روشن" })
            : t("ui.theme.dark", { defaultValue: "حالت تیره" })
        }
      >
        <Switch
          checked={mode === "dark"}
          onChange={() => toggle()}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<BulbOutlined />}
        />
      </Tooltip>
    </Space>
  );
};

export default DashboardHeaderControls;
