import { ConfigProvider, App as AntApp, theme as antdTheme } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "../../contexts/ThemeContext";

type Props = {
  children: ReactNode;
};

const AntConfigBridge = ({ children }: Props) => {
  const { i18n } = useTranslation();
  const { mode } = useTheme();
  const isRtl = (i18n.language || "fa").startsWith("fa");

  return (
    <ConfigProvider
      direction={isRtl ? "rtl" : "ltr"}
      theme={{
        algorithm:
          mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          fontFamily: "Vazirmatn, Inter, sans-serif",
          colorPrimary: mode === "dark" ? "#4C8FFF" : "#1d4ed8",
          borderRadius: 10,
        },
      }}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
};

export const AntThemeProvider = ({ children }: Props) => (
  <ThemeProvider>
    <AntConfigBridge>{children}</AntConfigBridge>
  </ThemeProvider>
);

export default AntThemeProvider;
