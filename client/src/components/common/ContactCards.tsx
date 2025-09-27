import s from "./contactCards.module.scss";

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
            <strong>{isFa ? "تماس تلفنی" : "Call"}</strong>
          </div>

          <ul className={s.contactList}>
            <li className={s.contactItem}>
              <div className={s.contactLabel}>{isFa ? "تلفن ثابت" : "Landline"}</div>
              <div className={s.contactActions}>
                <a className={s.chip} href={`tel:${landlineIntl}`} aria-label="Call landline">
                  {landlineDisplay}
                </a>
                <button className={s.copyBtn} onClick={() => copy(landlineIntl)} aria-label="Copy landline">⧉</button>
              </div>
            </li>

            <li className={s.contactItem}>
              <div className={s.contactLabel}>{isFa ? "موبایل" : "Mobile"}</div>
              <div className={s.contactActions}>
                <a className={s.chip} href={`tel:${mobileIntl}`} aria-label="Call mobile">
                  {mobileDisplay}
                </a>
                <button className={s.copyBtn} onClick={() => copy(mobileIntl)} aria-label="Copy mobile">⧉</button>
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
            <strong>{isFa ? "پیام‌رسان‌ها" : "Messaging"}</strong>
          </div>

          <div className={s.linkRow}>
            <a
              className={s.appBtn}
              href={`https://wa.me/${mobileIntl.replace("+", "")}`}
              target="_blank"
              rel="noopener"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M20.1 18.3c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.9 1-.9 1s-.2.2-.6.1c-.3-.1-1.2-.4-2.3-1.5-1-1-1.5-2.2-1.6-2.5-.2-.3 0-.5.1-.6.1-.1.3-.4.5-.6.2-.2.2-.3.3-.5.1-.1.1-.3 0-.5-.1-.1-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.6 1 2.8c.1.2 1.8 3 4.3 4.3 2.5 1.3 2.5.9 3 .9.5 0 1.5-.6 1.7-1.1.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.6-.3zM16 3C9.9 3 5 7.9 5 14c0 2.2.6 4.2 1.8 6L5 27l7.1-1.9c1.7 1 3.6 1.5 5.6 1.5 6.1 0 11-4.9 11-11S22.1 3 16 3z"/>
              </svg>
              WhatsApp
            </a>

            <a
              className={s.appBtn}
              href={eitaaUrl}
              target="_blank"
              rel="noopener"
              aria-label="Eitaa"
              title="Eitaa"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
              Eitaa
            </a>
          </div>

          <div className={s.muted} style={{ marginTop: 8 }}>
            {isFa ? "برای پیام فوری واتساپ / ایتا را بزنید." : "For quick messages, use WhatsApp / Eitaa."}
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
            <strong>{isFa ? "ایمیل" : "Email"}</strong>
          </div>

          <div className={s.linkRow}>
            <a className={s.chip} href={`mailto:${email}`} aria-label="Send email">
              {email}
            </a>
            <button className={s.copyBtn} onClick={() => copy(email)} aria-label="Copy email">⧉</button>
          </div>
        </div>
      </article>

      {/* Address + Map */}
      {/* <article className={s.card}>
        <div className={s.cardBody}>
          <strong>{isFa ? "آدرس" : "Address"}</strong>
          <p className={s.cardText}>
            {isFa
              ? "مازندران، نوشهر، خیابان رازی، خیابان 22 بهمن، کوچه مسجد، مرکز رشد واحدهای فناور نوشهر"
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
