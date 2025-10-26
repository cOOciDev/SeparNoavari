import s from "../../styles/panel.module.scss";
import { useTranslation } from "react-i18next";

export default function Broadcast() {
  const { t } = useTranslation();
  return (
    <div className={s.stack}>
      <h1>{t("admin.broadcast.title", { defaultValue: "Broadcast" })}</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <p className={s.muted}>
            {t("admin.broadcast.description", {
              defaultValue:
                "Broadcast skeleton. Add message composer, audience filters and delivery logs here.",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
