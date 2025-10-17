import { useEffect, useMemo, useState, useCallback } from "react";
import Countdown from "../components/ui/Countdown";
import { MILESTONES, RESULTS_DATE_ISO } from "../shared/dates";
import { COMMITTEE } from "../AppData/committee";
import { useTranslation } from "react-i18next";
import s from "./landing.module.scss";
import ContactCards from "../components/common/ContactCards";
import { TRACKS } from "../AppData/tracks";
import type { Track } from "../AppData/tracks";
import { Link } from "react-router-dom";

// type Track = { id: number; title: string; slug: string; image: string; blurb: string };

// const TRACKS: Track[] = [
//   {
//     id: 1,
//     title: "ارتقاء توان دفاعی در شرایط اضطرار",
//     slug: "defense",
//     image: "/assets/tracks/defense.png",
//     blurb:
//       "تمرکز بر راهکارهای نوین برای افزایش تاب‌آوری ملی، کاهش آسیب‌پذیری زیرساخت‌ها و ایجاد آمادگی همه‌جانبه در مواجهه با بحران‌ها و تهدیدهای غیرمنتظره."
//   },
//   {
//     id: 2,
//     title: "نوآوری در توان سایبری و پدافند (عامل و غیرعامل)",
//     slug: "cyber-defense",
//     image: "/assets/tracks/cyberDefense.png",
//     blurb:
//       "توسعه فناوری‌های نوین سایبری و دفاعی، شامل سامانه‌های هوشمند و پدافند عامل و غیرعامل برای مقابله با تهدیدات ترکیبی و حملات پیچیده."
//   },
//   {
//     id: 3,
//     title: "استفاده از ظرفیت‌های هوش مصنوعی در بحران",
//     slug: "ai-in-crisis",
//     image: "/assets/tracks/aiInCrisis.png",
//     blurb:
//       "به‌کارگیری الگوریتم‌های هوش مصنوعی و یادگیری ماشین در پایش، تحلیل داده‌ها و پیش‌بینی شرایط بحرانی برای تسریع تصمیم‌گیری و واکنش مؤثر."
//   },
//   {
//     id: 4,
//     title: "خدمات و پشتیبانی در زمان بحران",
//     slug: "crisis-support",
//     image: "/assets/tracks/crisisSupport.png",
//     blurb:
//       "ایجاد مدل‌های نوآورانه در تأمین فوری نیازهای اساسی، ارائه خدمات درمانی و امدادی کارآمد و بهبود مدیریت زنجیره تأمین در شرایط اضطراری."
//   },
//   {
//     id: 5,
//     title: "روش‌های نوین استفاده از داده‌ها و مشارکت عمومی",
//     slug: "data-participation",
//     image: "/assets/tracks/dataParticipation.png",
//     blurb:
//       "توسعه بسترهای داده‌محور برای رصد بحران، تحلیل کلان‌داده‌ها و تسهیل مشارکت هوشمندانه مردم در مدیریت بحران‌ها و افزایش شفافیت."
//   },
//   {
//     id: 6,
//     title: "مدیریت شبکه داوطلبان و تسهیل کمک‌های اجتماعی",
//     slug: "volunteer-network",
//     image: "/assets/tracks/volunteerNetwork.png",
//     blurb:
//       "طراحی سامانه‌های نوآورانه برای سازماندهی، هدایت و هم‌افزایی ظرفیت داوطلبان در ارائه کمک‌های اجتماعی، روانی و معنوی در شرایط اضطرار."
//   }
// ];


type Member = {
  id: number;
  name: string;
  role: string;
  affiliation: string;
  photo?: string;
  shortBio?: string;
  profileUrl?: string;
  tags?: string[];
};

/* ----------------------------- Tracks Carousel ---------------------------- */
function TracksCarousel({ items, interval = 5000 }: { items: Track[]; interval?: number }) {
  const [i, setI] = useState(0);
  const has = items?.length > 0;
  const { t } = useTranslation();

  const next = useCallback(() => setI((p) => (p + 1) % items.length), [items.length]);
  const prev = useCallback(() => setI((p) => (p === 0 ? items.length - 1 : p - 1)), [items.length]);

  useEffect(() => {
    if (!has) return;
    const t = setInterval(next, interval);
    return () => clearInterval(t);
  }, [has, next, interval]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (!has) return null;
  const cur = items[i];

  return (
    <div className={s.carousel} role="region" aria-label="Tracks carousel">
      <a
        href={`/tracks/${cur.slug}`}
        className={s.heroThumb}
        aria-label={`Open ${t(cur.titleKey)}`}
        title={t(cur.titleKey)}
        style={{ backgroundImage: cur.cover ? `url("${cur.cover}")` : undefined }}
      />
      <div className={s.carouselBody}>
        <strong className={s.cardTitle}>{t(cur.titleKey)}</strong>
        <p className={s.cardText}>{t(cur.shortKey).length > 50 ? t(cur.shortKey).slice(0, 50) + "…" : t(cur.shortKey)}</p>
      </div>

      <div className={s.carouselControls}>
        <div className={s.btnRow}>
          <button onClick={prev} className={s.btnGhost} aria-label="Previous slide">‹</button>
          <button onClick={next} className={s.btnGhost} aria-label="Next slide">›</button>
        </div>
        <div className={s.dots} role="tablist" aria-label="Track slides">
          {items.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === i}
              aria-label={`Go to slide ${idx + 1}`}
              className={`${s.dot} ${idx === i ? s.dotActive : ""}`}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
      </div>

      {/* دکمه پایینی: See All به /tracks */}
      <a className={s.btn} href="/tracks" data-variant="primary">
        {t("header.seeAll")}
      </a>
    </div>
  );
}

/* --------------------------- Committee Carousel --------------------------- */
function CommitteeCarousel({ items = COMMITTEE, interval = 5200 }: { items?: Member[]; interval?: number }) {
  const [i, setI] = useState(0);
  const has = items?.length > 0;
  const { t } = useTranslation();

  const next = useCallback(() => setI((p) => (p + 1) % items.length), [items.length]);
  const prev = useCallback(() => setI((p) => (p === 0 ? items.length - 1 : p - 1)), [items.length]);

  useEffect(() => {
    if (!has) return;
    const t = setInterval(next, interval);
    return () => clearInterval(t);
  }, [has, next, interval]);

  if (!has) return null;
  const cur = items[i];

  return (
    <div className={s.carousel} role="region" aria-label="Committee carousel">
      <a
        href={cur.profileUrl || "/committee"}
        className={s.heroThumb}
        aria-label={`${t(cur.name)} — ${t(cur.role)}`}
        title={t(cur.name)}
        style={{ backgroundImage: cur.photo ? `url("${cur.photo}")` : undefined }}
      />
      <div className={s.carouselBody}>
        <strong className={s.cardTitle}>{t(cur.name)}</strong>
        <span className={s.cardMeta}>
          {t(cur.role)} — {t(cur.affiliation)}
        </span>
      </div>

      <div className={s.carouselControls}>
        <div className={s.btnRow}>
          <button onClick={prev} className={s.btnGhost} aria-label="Previous member">‹</button>
          <button onClick={next} className={s.btnGhost} aria-label="Next member">›</button>
        </div>
        <div className={s.dots} role="tablist" aria-label="Committee members">
          {items.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === i}
              aria-label={`Go to member ${idx + 1}`}
              className={`${s.dot} ${idx === i ? s.dotActive : ""}`}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
      </div>

      <a className={s.btn} href="/committee" data-variant="primary">
        {t("committee.seeAll")}
      </a>
    </div>
  );
}

/* --------------------------------- Page ---------------------------------- */
export default function Landing() {
  const { t, i18n } = useTranslation();

  const PRIZE_TOTAL = 2000000000;
  const formattedPrize = (i18n?.language || "").startsWith("fa")
    ? PRIZE_TOTAL.toLocaleString("fa-IR")
    : PRIZE_TOTAL.toLocaleString();

  //Fallback theme tokens (if globals not present)
  useEffect(() => {
    const r = document.documentElement;
    if (!getComputedStyle(r).getPropertyValue("--bg")) {
      r.style.setProperty("--bg", "#0c1425");
      r.style.setProperty("--surface", "#131b31");
      r.style.setProperty("--text", "#e6e7ea");
      r.style.setProperty("--accent", "#26c6da");
      r.style.setProperty("--border", "rgba(255,255,255,.12)");
    }

    // light count-up for the total prize (pure JS, no deps)
    // (function(){
    //   const el = document.querySelector('#supports .prize-amount .num');
    //   if(!el) return;
    //   const target = Number(el.getAttribute('data-count'));
    //   const dur = 1400; // ms
    //   const start = performance.now();
    //   const fmt = (n: number) => n.toLocaleString('fa-IR');
    //   function tick(now: number){
    //     const t = Math.min(1, (now - start) / dur);
    //     const eased = t<.5 ? 2*t*t : -1+(4-2*t)*t; // easeInOutQuad
    //     const val = Math.round(target * eased);
    //     el.textContent = fmt(val);
    //     if(t<1) requestAnimationFrame(tick);
    //   }
    //   requestAnimationFrame(tick);
    // })();
    
  }, []);

  const formatDate = useMemo(() => {
    const locale = i18n.language?.startsWith("fa") ? "fa-IR" : "en-US";
    const dtf = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "2-digit" });
    return (iso: string) => dtf.format(new Date(iso));
  }, [i18n.language]);

  // استخراج مایلستون‌ها (با فالبک امن)
  const { submissionMs, resultsMs, closingMs, next, upcoming, submissionOver } = useMemo(() => {
    const now = Date.now();
    const list = MILESTONES.map((m) => ({ ...m, ts: new Date(m.iso).getTime() }));

    const pick = (key: string) => list.find((m) => m.key === key);
    const submission = pick("submission");
    const review = pick("review");
    // const results = pick("results") ?? { iso: RESULTS_DATE_ISO, ts: new Date(RESULTS_DATE_ISO).getTime(), label: "Results" } as any;
    const results = pick("results") ?? { key: "results", iso: RESULTS_DATE_ISO, ts: new Date(RESULTS_DATE_ISO).getTime(), label: "Results" };
    const closing = pick("closing"); // ممکنه وجود نداشته باشه

    const next = list.find((m) => m.ts > now) ?? list[list.length - 1];
    const submissionOver = submission ? now >= submission.ts : true;
    const upcoming = list.filter((m) => m.ts > now).slice(0, 2);

    return {
      submissionMs: submission?.iso,
      reviewMs: review?.iso,
      resultsMs: results?.iso,
      closingMs: closing?.iso,
      next,
      upcoming,
      submissionOver
    };
  }, []);

  const isFa = (i18n.language || "en").startsWith("fa");

  return (
    <main>
      {/* HERO */}
  <section className={`${s.container} ${s.hero}`}>
        <div className={s.heroText}>
          <p className={s.eyebrow}>{t("program")}</p>
          <h1 className={s.title}>{t("heroTitle")}</h1>
          <p className={s.subtitle}>{t("heroSubtitle")}</p>

          <div className={s.ctaRow}>
            {/* <a className={s.btn} href="/submit" data-variant="primary">{t("ctaStart")}</a> */}
            {/* CTA مسیرها → /tracks */}
            {/* <a className={s.btn} href="/tracks" data-variant="ghost">{t("ctaTracks")}</a> */}
          </div>

          <div
            className={s.heroPoster}
            aria-label={t('landing.heroPosterAlt')}
            title={t('landing.heroPosterAlt')}
          />
        </div>

        {/* Right column cards */}
        <div className={s.heroCards}>
          {/* Countdown */}
          <article className={s.card}>
            <div className={s.cardCover} style={{ backgroundImage: `url("/images/cards/countdown.png")` }} />
            <div className={s.cardBody}>
              <h3 className={s.cardHeading}>{t("countdown.title")}</h3>
              <p className={s.cardText}>{t("countdown.tip")}</p>

              <Countdown targetISO={next.iso} size="lg" />

              {upcoming.length > 0 && (
                <div className={s.listVertical}>
                  {upcoming.map((m) => (
                    <div key={m.key} className={s.row}>
                      <span>{m.label}</span>
                      {submissionOver ? (
                        <Countdown targetISO={m.iso} size="sm" showLabels={false} />
                      ) : (
                        <span className={s.muted}>{formatDate(m.iso)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <a className={s.btn} href="#timeline" data-variant="ghost">
                {t("countdown.seeTimeline")}
              </a>
            </div>
          </article>

          {/* Submit */}
          <article id="submit" className={s.card}>
            <div className={s.cardCover} style={{ backgroundImage: `url("/images/cards/submit.png")` }} />
            <div className={s.cardBody}>
              <h3 className={s.cardHeading}>{t("submitCard.title")}</h3>
              <p className={s.cardText}>{t("submitCard.text")}</p>
              <div className={s.btnRow}>
              <Link className={s.btn} to="/ideas/new" data-variant="primary">{t("submitCard.start")}</Link>
                <a className={s.btn} href="/sample.docx" download data-variant="ghost">
                  {t("submitCard.template")}
                </a>
              </div>
            </div>
          </article>

          {/* Tracks */}
          <article id="tracks" className={s.card}>
            <div className={s.cardCover} style={{ backgroundImage: `url("/images/cards/tracks.png")` }} />
            <div className={s.cardBody}>
              <h3 className={s.cardHeading}>{t("tracksCard.title")}</h3>
              <p className={s.cardText}>{t("tracksCard.text")}</p>
              <TracksCarousel items={TRACKS} />
            </div>
          </article>

          {/* Committee */}
          <article id="committee" className={s.card}>
            <div className={s.cardCover} style={{ backgroundImage: `url("/images/cards/committee.png")` }} />
            <div className={s.cardBody}>
              <h3 className={s.cardHeading}>{t('landing.committeeHeading')}</h3>
              <p className={s.cardText}>{t('landing.committeeText')}</p>
              <CommitteeCarousel />
            </div>
          </article>
        </div>
      </section>

      {/* Timeline → سه باکس شیشه‌ای */}
      <section id="timeline" className={s.container}>
  <h2 className={s.sectionTitle}>{t("timeline.title")}</h2>

        <div className={s.glassGrid}>
          {/* Box 1: Submission deadline */}
          <article className={s.glassCard} aria-label={t('landing.timelineSubmission')}>
            <div className={s.glassHead}>
              <span className={s.badge}>{t("timeline.item.submission")}</span>
              <strong><div className={s.muted }>{formatDate(submissionMs)}</div></strong>

            </div>
            <div className={s.glassBody}>
              {submissionMs ? (
                <>
                  <Countdown targetISO={submissionMs} size="sm" />
                </>
              ) : (
                <div className={s.muted}>—</div>
              )}
            </div>
          </article>

          {/* Box 2: Review & Results */}
          <article className={s.glassCard} aria-label={t('timeline.item.review')}>
            <div className={s.glassHead}>
              <span className={s.badge}>{t("timeline.item.review")}</span>
                <strong>{resultsMs ? formatDate(resultsMs) : formatDate(RESULTS_DATE_ISO)}</strong>

            </div>
            <div className={s.glassBody}>
              <div className={s.row} style={{ justifyContent: "space-between" }}>
              </div>
              {resultsMs && <Countdown targetISO={resultsMs} size="sm"  />}
            </div>
          </article>

          {/* Box 3: Closing ceremony */}
          <article className={s.glassCard} aria-label={t('landing.closingCeremony')}>
            <div className={s.glassHead} >
              <span className={s.badge}>
                {t("countdown.closing", { defaultValue: isFa ? "اختتامیه رویداد" : "Closing Ceremony" })}
              </span>
              <strong>{closingMs ? formatDate(closingMs) : "—"}</strong>

            </div>
            <div className={s.glassBody}>
              <div className={s.row} style={{ justifyContent: "space-between" }}>
              </div>
              {closingMs && <Countdown targetISO={closingMs} size="sm"  />}
            </div>
          </article>
        </div>
      </section>

      {/* Awards & Sponsors (RTL, 6 items) */}
      <section id="supports" className={s.container}>
  <h2 className={s.sectionTitle}>{t('landing.awardsTitle')}</h2>

        <div className={s.supportsWrap}>
          {/* Top card: badges + prize hero */}
          <article className={s.card}>
            <div className={s.cardBody}>
              <div className={s.supportsHead}>
                <div className={s.supportsBadges} aria-label={t('landing.awardsTitle')}>
                  {(t('landing.supportsBadges', { returnObjects: true }) as string[]).map((b: string, idx: number) => (
                    <span key={idx} className={s.badge} dangerouslySetInnerHTML={{ __html: b }} />
                  ))}
                </div>
              </div>

              <div className={s.prizeHero} role="group" aria-label="جوایز نقدی">
                <div className={s.prizeFigure} aria-live="polite">
                  <div className={s.prizeAmount} dir={isFa ? "rtl" : "ltr"}>
                    {isFa ? (
                      <span>{t('landing.prizePersianShort')}</span>
                    ) : (
                      <>
                        <span className="num" data-count={PRIZE_TOTAL}>{formattedPrize}</span>
                        <span>&nbsp;Rial</span>
                      </>
                    )}
                  </div>
                  <div className={s.prizeSub}>{t('landing.prizeTotalLabel')}</div>
                </div>

                <div className={s.breakdown}>
                  <div className={s.tile}>
                    {/* medal 1 */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="14" r="4"/><path d="M9 4h6l-1 4h-4z"/></svg>
                    <div><strong>{t('landing.prizeBreakdown.first.title')}</strong><small>{t('landing.prizeBreakdown.first.amount')}</small></div>
                  </div>
                  <div className={s.tile}>
                    {/* medal 2 */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="14" r="4"/><path d="M7 4h10l-2 4H9z"/></svg>
                    <div><strong>{t('landing.prizeBreakdown.second.title')}</strong><small>{t('landing.prizeBreakdown.second.amount')}</small></div>
                  </div>
                  <div className={s.tile}>
                    {/* medal 3 */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="14" r="4"/><path d="M8 4h8l-3 4h-2z"/></svg>
                    <div><strong>{t('landing.prizeBreakdown.third.title')}</strong><small>{t('landing.prizeBreakdown.third.amount')}</small></div>
                  </div>
                  <div className={s.tile}>
                    {/* medal 4..10 */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16"/><path d="M4 11h16"/><path d="M4 15h16"/></svg>
                    <div><strong>{t('landing.prizeBreakdown.others.title')}</strong><small>{t('landing.prizeBreakdown.others.amount')}</small></div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Reward tiles as real cards */}
          <div className={s.supportsGrid}>
            {(t('landing.supportTiles', { returnObjects: true }) as any[]).map((it: any, idx: number) => (
              <article key={idx} className={s.card}>
                <div className={s.cardBody}>
                  <div className={s.rHead}>
                    {/* icon placeholders kept in markup */}
                    <h3 className={s.rTitle}>{it.title}</h3>
                  </div>
                  <p className={s.cardText}>{it.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>


      {/* Resources */}
      <section id="resources" className={s.container}>
        <h2 className={s.sectionTitle}>{t("resources")}</h2>
        <div className={s.resourceGrid}>
          {[t("landing.resourcesPdf"), t("landing.resourcesDoc"), t("landing.resourcesZip")].map((r, idx) => (
            <a key={idx} className={s.card} href="#">
              <div className={s.cardBody}><strong>{r}</strong></div>
            </a>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className={s.container}>
        <h2 className={s.sectionTitle}>{t("contact")}</h2>
        <div className={s.contactGrid}>
          {/* Contact */}
          <div>

  {/** Set your canonical contacts here **/}
  {/** ✅ EDIT just these three if needed **/}
  {/** Landline for direct calls */}
  {/** 011 5214 1173 -> +98 11 5214 1173 */}
  {/** Mobile for WhatsApp/Eitaa */}
  {/** 0905 578 4979 -> +98 905 578 4979 */}
  {/** Eitaa: set your channel/profile URL */}
  {/* eslint-disable */}
  <ContactCards
    isFa={isFa}
    email="nowshahrroshd@gmail.com"
    landlineIntl="+981152141173"
    landlineDisplay={isFa ? "011 5214 1173" : "+98 11 5214 1173"}
    mobileIntl="+989055784979"
    mobileDisplay={isFa ? "0905 578 4979" : "+98 905 578 4979"}
    eitaaUrl="https://eitaa.com/MRN2025" 
  />
  {/* eslint-enable */}
          </div>

          <div className={s.card}>
            <div className={s.cardBody}>
              <strong>{t('landing.addressLabel')}</strong>
              <p>{t('landing.addressText')}</p>
              {/* <!-- Map --> */}
              <div className="map-box" style={{ marginTop:'12px'}}>
                <iframe src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3201.237403690493!2d51.49176907643178!3d36.64473897229189!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzbCsDM4JzQxLjEiTiA1McKwMjknMzkuNiJF!5e0!3m2!1sen!2suk!4v1758657278667!5m2!1sen!2suk" width="600" height="450" style={{border:"0"}} allowFullScreen={true} loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
