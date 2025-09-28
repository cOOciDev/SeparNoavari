import { useEffect, useMemo, useState, useCallback } from "react";
import Countdown from "../components/ui/Countdown";
import { MILESTONES, RESULTS_DATE_ISO } from "../shared/dates";
import { COMMITTEE } from "../AppData/committee";
import { useTranslation } from "react-i18next";
import s from "./landing.module.scss";
import ContactCards from "../components/common/ContactCards";

type Track = { id: number; title: string; slug: string; image: string; blurb: string };

const TRACKS: Track[] = [
  {
    id: 1,
    title: "ارتقاء توان دفاعی در شرایط اضطرار",
    slug: "defense",
    image: "/assets/tracks/defense.png",
    blurb:
      "تمرکز بر راهکارهای نوین برای افزایش تاب‌آوری ملی، کاهش آسیب‌پذیری زیرساخت‌ها و ایجاد آمادگی همه‌جانبه در مواجهه با بحران‌ها و تهدیدهای غیرمنتظره."
  },
  {
    id: 2,
    title: "نوآوری در توان سایبری و پدافند (عامل و غیرعامل)",
    slug: "cyber-defense",
    image: "/assets/tracks/cyberDefense.png",
    blurb:
      "توسعه فناوری‌های نوین سایبری و دفاعی، شامل سامانه‌های هوشمند و پدافند عامل و غیرعامل برای مقابله با تهدیدات ترکیبی و حملات پیچیده."
  },
  {
    id: 3,
    title: "استفاده از ظرفیت‌های هوش مصنوعی در بحران",
    slug: "ai-in-crisis",
    image: "/assets/tracks/aiInCrisis.png",
    blurb:
      "به‌کارگیری الگوریتم‌های هوش مصنوعی و یادگیری ماشین در پایش، تحلیل داده‌ها و پیش‌بینی شرایط بحرانی برای تسریع تصمیم‌گیری و واکنش مؤثر."
  },
  {
    id: 4,
    title: "خدمات و پشتیبانی در زمان بحران",
    slug: "crisis-support",
    image: "/assets/tracks/crisisSupport.png",
    blurb:
      "ایجاد مدل‌های نوآورانه در تأمین فوری نیازهای اساسی، ارائه خدمات درمانی و امدادی کارآمد و بهبود مدیریت زنجیره تأمین در شرایط اضطراری."
  },
  {
    id: 5,
    title: "روش‌های نوین استفاده از داده‌ها و مشارکت عمومی",
    slug: "data-participation",
    image: "/assets/tracks/dataParticipation.png",
    blurb:
      "توسعه بسترهای داده‌محور برای رصد بحران، تحلیل کلان‌داده‌ها و تسهیل مشارکت هوشمندانه مردم در مدیریت بحران‌ها و افزایش شفافیت."
  },
  {
    id: 6,
    title: "مدیریت شبکه داوطلبان و تسهیل کمک‌های اجتماعی",
    slug: "volunteer-network",
    image: "/assets/tracks/volunteerNetwork.png",
    blurb:
      "طراحی سامانه‌های نوآورانه برای سازماندهی، هدایت و هم‌افزایی ظرفیت داوطلبان در ارائه کمک‌های اجتماعی، روانی و معنوی در شرایط اضطرار."
  }
];


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
        aria-label={`Open ${cur.title}`}
        title={cur.title}
        style={{ backgroundImage: cur.image ? `url("${cur.image}")` : undefined }}
      />
      <div className={s.carouselBody}>
        <strong className={s.cardTitle}>{cur.title}</strong>
        <p className={s.cardText}>{cur.blurb.length > 50 ? cur.blurb.slice(0, 50) + "…" : cur.blurb}</p>
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
        See All
      </a>
    </div>
  );
}

/* --------------------------- Committee Carousel --------------------------- */
function CommitteeCarousel({ items = COMMITTEE, interval = 5200 }: { items?: Member[]; interval?: number }) {
  const [i, setI] = useState(0);
  const has = items?.length > 0;

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
        aria-label={`${cur.name} — ${cur.role}`}
        title={cur.name}
        style={{ backgroundImage: cur.photo ? `url("${cur.photo}")` : undefined }}
      />
      <div className={s.carouselBody}>
        <strong className={s.cardTitle}>{cur.name}</strong>
        <span className={s.cardMeta}>
          {cur.role} — {cur.affiliation}
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
        See All
      </a>
    </div>
  );
}

/* --------------------------------- Page ---------------------------------- */
export default function Landing() {
  const { t, i18n } = useTranslation();

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
            <a className={s.btn} href="/submit" data-variant="primary">{t("ctaStart")}</a>
            {/* CTA مسیرها → /tracks */}
            <a className={s.btn} href="/tracks" data-variant="ghost">{t("ctaTracks")}</a>
          </div>

          <div
            className={s.heroPoster}
            aria-label={isFa ? "پوستر رویداد" : "Event Poster"}
            title={isFa ? "پوستر رویداد" : "Event Poster"}
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
                <a className={s.btn} href="/submit" data-variant="primary">{t("submitCard.start")}</a>
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
              <h3 className={s.cardHeading}>{isFa ? "هیئت علمی" : "Scientific Committee"}</h3>
              <p className={s.cardText}>
                {isFa ? "با داوران و مشاوران ما آشنا شوید." : "Meet our judges and advisors."}
              </p>
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
          <article className={s.glassCard} aria-label="Submission deadline">
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
          <article className={s.glassCard} aria-label="Review and results">
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
          <article className={s.glassCard} aria-label="Closing ceremony">
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
        <h2 className={s.sectionTitle}>{isFa ? "جوایز و حمایت‌ها" : "Awards & Sponsors"}</h2>

        <div className={s.supportsWrap}>
          {/* Top card: badges + prize hero */}
          <article className={s.card}>
            <div className={s.cardBody}>
              <div className={s.supportsHead}>
                <div className={s.supportsBadges} aria-label="برچسب‌های برجسته">
                  <span className={s.badge}>
                    {/* trophy */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10"/><path d="M17 4a3 3 0 0 0 3 3v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7a3 3 0 0 0 3-3"/>
                    </svg>
                    ۱۰ برگزیده «ایده‌برتر»
                  </span>
                  <span className={s.badge}>
                    {/* shield */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22c6-3 8-7 8-11V6l-8-4-8 4v5c0 4 2 8 8 11"/>
                    </svg>
                    جایگزین خدمت نخبگان
                  </span>
                  <span className={s.badge}>
                    {/* rocket */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 15a7 7 0 0 0 4 4"/><path d="M15 5a7 7 0 0 0-4 4"/><path d="M14 10l-4 4"/><path d="M7 7l3 3"/>
                    </svg>
                    شتاب‌دهی پارک علم‌وفناوری
                  </span>
                </div>
              </div>

              <div className={s.prizeHero} role="group" aria-label="جوایز نقدی">
                <div className={s.prizeFigure} aria-live="polite">
                  <div className={s.prizeAmount} dir="ltr">
                    <span className="num" data-count="2000000000">2,000,000,000</span>
                    <span>&nbsp;ریال</span>
                  </div>
                  <div className={s.prizeSub}>مجموع جوایز نقدی رویداد</div>
                </div>

                <div className={s.breakdown}>
                  <div className={s.tile}>
                    {/* medal 1 */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="14" r="4"/><path d="M9 4h6l-1 4h-4z"/></svg>
                    <div><strong>ایده اول</strong><small>۵۰۰ میلیون ریال</small></div>
                  </div>
                  <div className={s.tile}>
                    {/* medal 2 */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="14" r="4"/><path d="M7 4h10l-2 4H9z"/></svg>
                    <div><strong>ایده دوم</strong><small>۴۰۰ میلیون ریال</small></div>
                  </div>
                  <div className={s.tile}>
                    {/* medal 3 */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="14" r="4"/><path d="M8 4h8l-3 4h-2z"/></svg>
                    <div><strong>ایده سوم</strong><small>۳۰۰ میلیون ریال</small></div>
                  </div>
                  <div className={s.tile}>
                    {/* medal 4..10 */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16"/><path d="M4 11h16"/><path d="M4 15h16"/></svg>
                    <div><strong>ایده چهارم تا دهم</strong><small>هرکدام ۱۰۰ میلیون ریال</small></div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Reward tiles as real cards */}
          <div className={s.supportsGrid}>
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16v12H4z"/><path d="M8 22l4-2 4 2v-6H8z"/>
                  </svg>
                ),
                title: "گواهی «ایده‌برتر» + گواهی شرکت",
                desc: "اعطای گواهی «ایده‌برتر» برای ۱۰ ایده منتخب و صدور گواهی رسمی برای تمامی شرکت‌کنندگان."
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M15 8h3M15 12h3M15 16h3"/>
                  </svg>
                ),
                title: "جایگزین خدمت نخبگان",
                desc: "به‌کارگیری ایده‌های برتر در قالب طرح‌های جایگزین خدمت نخبگان و کاهش مدت خدمت سربازی."
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6"/>
                  </svg>
                ),
                title: "کمک بلاعوض دانش‌بنیان",
                desc: "ده میلیارد ریال کمک بلاعوض برای دو ایده برتر که تا مرحله ثبت دانش‌بنیان اقدام نمایند."
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4.5 16.5L9 12l3 3 4.5-4.5"/><path d="M12 2l4 4-7 7-4-4z"/><path d="M5 19l2-2"/>
                  </svg>
                ),
                title: "شتاب‌دهی و جذب به پارک",
                desc: "حمایت پارک علم و فناوری برای توسعه، منتورینگ، و جذب به عنوان هسته و واحد فناور."
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 11v2a4 4 0 0 0 4 4h1"/><path d="M15 11a5 5 0 0 1 0 2L5 17V7z"/><path d="M18 8v8"/>
                  </svg>
                ),
                title: "پشتیبانی رسانه‌ای و معرفی",
                desc: "رپورتاژ، شبکه‌سازی و معرفی برگزیدگان به سرمایه‌گذاران و صنایع همکار."
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 11l4-4 4 4 4-4 4 4"/><path d="M2 12l4 4 4-4 4 4 4-4 4 4"/>
                  </svg>
                ),
                title: "اتصال به صنعت و بازار",
                desc: "تسهیل تفاهم‌نامه‌های صنعتی، امکان پایلوت‌گیری، و دسترسی به بازار هدف."
              }
            ].map((it, idx) => (
              <article key={idx} className={s.card}>
                <div className={s.cardBody}>
                  <div className={s.rHead}>
                    {it.icon}
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
          {[t("resourcesPdf"), t("resourcesDoc"), t("resourcesZip")].map((r, idx) => (
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
          <section id="contact" className={s.container}>

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
    eitaaUrl="https://eitaa.com/YOUR_ID" // ← TODO: put your real Eitaa link
  />
  {/* eslint-enable */}
          </section>

          <div className={s.card}>
            <div className={s.cardBody}>
              <strong>{isFa ? "آدرس" : "Address"}</strong>
              <p>{isFa ? "مازندران، نوشهر، خیایابان رازی، خیابان 22 بهمن، کوچه مسجد، مرکز رشد واحد های فناور نوشهر" : "Mazandaran, Nowshahr, Razi Avenue, 22 Bahman Street, Masjed Alley, Nowshahr Technology Units Growth Center"}</p>
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
