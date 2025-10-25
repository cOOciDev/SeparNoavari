// client/src/app/ui/Footer.tsx
import { useTranslation } from "react-i18next";
import "dotenv";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,.12)", marginTop: 40, padding: "24px 0 40px" }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <small>
          {t("footer.copyright", {
            year: new Date().getFullYear(),
            defaultValue: `© ${new Date().getFullYear()} cOOciDev , مرکز رشد نوشهر , دانشگاه علوم دریایی امام خمینی (ره)`,
          })}
        </small>
        <a href="/sample.docx" style={{ opacity: .85, textDecoration: "none" }}>{t("footer.template", { defaultValue: "Download Template (word)" })}</a>
      </div>
    </footer>
  )
}
