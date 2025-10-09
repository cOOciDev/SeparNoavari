import s from "./contactCards.module.scss";
import { useTranslation } from "react-i18next";

export interface ContactCardsProps {
  isFa: boolean;
  email: string;
  landlineIntl: string;    // e.g. "+981152141173"
  landlineDisplay: string; // e.g. "011 5214 1173"
  mobileIntl: string;      // e.g. "+989055784979"
  mobileDisplay: string;   // e.g. "0905 578 4979"
  eitaaUrl: string;        // e.g. "https://eitaa.com/YOUR_ID"
}

export default function ContactCards(props: ContactCardsProps) {
  const { t } = useTranslation();
  const {
    isFa,
    email,
    landlineIntl,
    landlineDisplay,
    mobileIntl,
    mobileDisplay,
    eitaaUrl,
  } = props;

  const copy = (txt: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(txt);
    }
    // Fallback for older browsers / SSR
    try {
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch { /* empty */ }
  };

  return (
    <div className={s.contactGrid} dir={isFa ? "rtl" : "ltr"}>
      {/* Call */}
      <article className={s.card}>
        <div className={s.cardBody}>
          <div className={s.contactHead}>
            <span className={s.contactIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.15 10.8 19.8 19.8 0 0 1 .08 2.18 2 2 0 0 1 2.06 0h3a2 2 0 0 1 2 1.72c.12.86.32 1.7.6 2.5a2 2 0 0 1-.45 2.11l-1.3 1.3a16 16 0 0 0 6.86 6.86l1.3-1.3a2 2 0 0 1 2.11-.45c.8.28 1.64.48 2.5.6A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <strong>{t("contact.call")}</strong>
          </div>

          <ul className={s.contactList}>
            <li className={s.contactItem}>
              <div className={s.contactLabel}>{t("contact.landline")}</div>
              <div className={s.contactActions}>
                <a className={s.chip} href={`tel:${landlineIntl}`} aria-label={t("contact.callLandline")}>
                  {landlineDisplay}
                </a>
                <button className={s.copyBtn} onClick={() => copy(landlineIntl)} aria-label={t("contact.copyLandline")}>⧉</button>
              </div>
            </li>

            <li className={s.contactItem}>
              <div className={s.contactLabel}>{t("contact.mobile")}</div>
              <div className={s.contactActions}>
                <a className={s.chip} href={`tel:${mobileIntl}`} aria-label={t("contact.callMobile")}>
                  {mobileDisplay}
                </a>
                <button className={s.copyBtn} onClick={() => copy(mobileIntl)} aria-label={t("contact.copyMobile")}>⧉</button>
              </div>
            </li>
          </ul>
        </div>
      </article>

      {/* Messaging */}
      <article className={s.card}>
        <div className={s.cardBody}>
          <div className={s.contactHead}>
            <span className={s.contactIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              </svg>
            </span>
            <strong>{t("contact.messaging")}</strong>
          </div>

          <div className={s.linkRow}>
            <a
              className={`${s.card} ${s.whatsappBtn}`}
              href={`https://wa.me/${mobileIntl.replace("+", "")}`}
              target="_blank"
              rel="noopener"
              aria-label={t("social.whatsapp")}
              title={t("social.whatsapp")}
            >
              <i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
              {t("social.whatsapp")}
            </a>

            <a
              className={`${s.card} ${s.eitaaBtn}`}
              href={eitaaUrl}
              target="_blank"
              rel="noopener"
              aria-label={t("social.eitaa")}
              title={t("social.eitaa")}
            >
              <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
              {t("social.eitaa")}
            </a>
          </div>

          <div className={s.muted} style={{ marginTop: 8 }}>
            {t("social.messagingHint")}
          </div>
        </div>
      </article>

      {/* Email */}
      <article className={s.card}>
        <div className={s.cardBody}>
          <div className={s.contactHead}>
            <span className={s.contactIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 4h16v16H4z" /><path d="M22 6l-10 7L2 6" />
              </svg>
            </span>
            <strong>{t("contact.email")}</strong>
          </div>

          <div className={s.linkRow}>
            <a className={s.chip} href={`mailto:${email}`} aria-label={t("contact.sendEmail")}>
              {email}
            </a>
            <button className={s.copyBtn} onClick={() => copy(email)} aria-label={t("contact.copyEmail")}>⧉</button>
          </div>
        </div>
      </article>

      {/* Address + Map */}
      {/* <article className={s.card}>
        <div className={s.cardBody}>
          <strong>{isFa ? "آدرس" : "Address"}</strong>
          <p className={s.cardText}>
            {isFa
              ? "مازندران، نوشهر، خیابان رازی، خیابان 22 بهمن، کوچهٔ مسجد، مرکز رشد واحدهای فناور نوشهر"
              : "Mazandaran, Nowshahr, Razi Ave, 22 Bahman St, Masjed Alley, Nowshahr Technology Units Growth Center"}
          </p>
          <div className="map-box" style={{ marginTop: 12 }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3201.237403690493!2d51.49176907643178!3d36.64473897229189!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzbCsDM4JzQxLjEiTiA1McKwMjknMzkuNiJF!5e0!3m2!1sen!2suk!4v1758657278667!5m2!1sen!2suk"
              width="600"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={isFa ? "نقشه مرکز رشد نوشهر" : "Nowshahr Growth Center Map"}
            />
          </div>
        </div>
      </article> */}
    </div>
  );
}
