import { useTranslation } from "react-i18next";
import s from "../../styles/panel.module.scss";

export default function Topbar() {
  const { t } = useTranslation();
  return (
    <div className={s.topbar}>
      <strong>{t('admin.topbar.title')}</strong>
    </div>
  );
}
