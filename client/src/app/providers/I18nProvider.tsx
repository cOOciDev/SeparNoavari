import { ReactNode, useEffect } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n from "../../AppData/i18n";

type Props = {
  children: ReactNode;
};

const DirectionManager = ({ children }: Props) => {
  const { i18n: i18next } = useTranslation();

  useEffect(() => {
    const lang = i18next.language || "fa";
    const isRtl = lang.startsWith("fa");
    const dir = isRtl ? "rtl" : "ltr";
    const html = document.documentElement;
    html.lang = lang;
    html.dir = dir;
    html.setAttribute("data-lang", lang);
    document.body.dir = dir;
  }, [i18next.language]);

  return <>{children}</>;
};

export const I18nProvider = ({ children }: Props) => (
  <I18nextProvider i18n={i18n}>
    <DirectionManager>{children}</DirectionManager>
  </I18nextProvider>
);

export default I18nProvider;
