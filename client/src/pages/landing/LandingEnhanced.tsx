import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import s from "../landing.module.scss";
import { TRACKS } from "../../AppData/tracks";
import { COMMITTEE } from "../../AppData/committee";
import { MILESTONES, RESULTS_DATE_ISO } from "../../AppData/schedule";

import TracksCarousel from "../../components/TracksCarousel";
import CommitteeCarousel from "../../components/CommitteeCarousel";
import Countdown from "../../components/Countdown";
import ContactCards from "../../components/common/ContactCards";

export default function LandingEnhanced() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const root = document.documentElement;
    if (!getComputedStyle(root).getPropertyValue("--bg")) {
      root.style.setProperty("--bg", "#0c1425");
      root.style.setProperty("--surface", "#131b31");
      root.style.setProperty("--text", "#e6e7ea");
      root.style.setProperty("--accent", "#26c6da");
      root.style.setProperty("--border", "rgba(255,255,255,.12)");
    }
  }, []);

  const isFa = (i18n.language || "en").startsWith("fa");
  // const PRIZE_TOTAL = 2_000_000_000;
  // const formattedPrize = isFa
  //   ? PRIZE_TOTAL.toLocaleString("fa-IR")
  //   : PRIZE_TOTAL.toLocaleString();

  const formatDate = useMemo(() => {
    const locale = isFa ? "fa-IR" : "en-US";
    const formatter = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
    return (iso?: string) => (iso ? formatter.format(new Date(iso)) : "—");
  }, [isFa]);

type MilestoneKey = "submission" | "results" | "closing" | string;

type Milestone = {
  key: MilestoneKey;
  iso: string;       // ISO with timezone, e.g. "2025-11-14T23:59:00+03:30"
  label: string;
};

function toTs(iso?: string) {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isFinite(t) ? t : NaN;
}

// Optional: tick so values update over time (e.g., every 30s)
function useNowTick(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const now = useNowTick(); // or use Date.now() if you don't need live updates

const {
  submissionIso, resultsIso, closingIso, next, upcoming, submissionOver
} = useMemo(() => {
  // Build base list from MILESTONES
  const fromMilestones: Array<Milestone & { ts: number }> = (MILESTONES || [])
    .map(m => ({ ...m, ts: toTs(m.iso) }))
    .filter(m => Number.isFinite(m.ts));

  // Ensure "results" exists (fallback to RESULTS_DATE_ISO if missing)
  const hasResults = fromMilestones.some(m => m.key === "results");
  if (!hasResults && RESULTS_DATE_ISO) {
    const ts = toTs(RESULTS_DATE_ISO);
    if (Number.isFinite(ts)) {
      fromMilestones.push({
        key: "results",
        iso: RESULTS_DATE_ISO,
        ts,
        label: "Results",
      });
    }
  }

  // Sort chronologically
  const list = fromMilestones.sort((a, b) => a.ts - b.ts);

  // Quick accessors
  const byKey = (k: MilestoneKey) => list.find(i => i.key === k);

  const submission = byKey("submission");
  const results = byKey("results");
  const closing = byKey("closing");

  // Compute timeline states
  const nextMilestone = list.find(i => i.ts > now) ?? list.at(-1);
  const upcomingList = list.filter(i => i.ts > now).slice(0, 2);
  const isSubmissionOver = submission ? now >= submission.ts : true;

  return {
    submissionIso: submission?.iso,
    resultsIso: results?.iso,
    closingIso: closing?.iso,
    next: nextMilestone,
    upcoming: upcomingList,
    submissionOver: isSubmissionOver,
  };
}, [MILESTONES, RESULTS_DATE_ISO, now]);

      // console.log("Milestones:", upcoming);

      
  return (
    <main className={s.main}>
      <section className={`${s.container} ${s.hero}`}>
        <div className={s.heroText}>
          <p className={s.eyebrow}>
            {t("program", { defaultValue: "Innovation Program" })}
          </p>
          <h1 className={s.title}>
            {t("heroTitle", { defaultValue: "Innovation for Resilience" })}
          </h1>
          <p className={s.subtitle}>
            {t("heroSubtitle", {
              defaultValue:
                "Submit ideas that strengthen crisis response and social resilience.",
            })}
          </p>

          <div className={s.ctaRow}>
            <Link className={s.btn } to="/ideas/new" data-variant="primary">
              {t("ctaStart", { defaultValue: "Submit Your Idea" })}
            </Link>
            <Link className={s.btn} to="/tracks" data-variant="ghost">
              {t("ctaTracks", { defaultValue: "Explore Tracks" })}
            </Link>
          </div>

          <div
            className={s.heroPoster}
            aria-label={t("landing.heroPosterAlt", {
              defaultValue: "Innovation poster",
            })}
            title={t("landing.heroPosterAlt", {
              defaultValue: "Innovation poster",
            })}
          />
        </div>

        <div className={s.heroCards}>
          <article className={s.card}>
            <div
              className={s.cardCover}
              style={{ backgroundImage: 'url("/images/cards/countdown.png")' }}
            />
            <div className={s.cardBody}>
              <h3 className={s.cardHeading}>
                {t("countdown.title", { defaultValue: "Next Milestone" })}
              </h3>
              <p className={s.cardText}>
                {t("countdown.tip", {
                  defaultValue: "Stay on time and plan your submission.",
                })}
              </p>
              {next?.iso && <Countdown targetISO={next.iso} size="lg" />}
              {upcoming?.length > 0 && (
                <div className={s.listVertical}>
                  {upcoming.map((milestone) => (
                    <div key={milestone.key} className={s.row}>
                      <span>{milestone.label}</span>
                      {submissionOver ? (
                        <Countdown
                          targetISO={milestone.iso}
                          size="sm"
                          showLabels={true}
                        />
                      ) : (
                        <span className={s.muted}>
                          {formatDate(milestone.iso)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <a className={s.btn} href="#timeline" data-variant="ghost">
                {t("countdown.seeTimeline", {
                  defaultValue: "See timeline",
                })}
              </a>
            </div>
          </article>

          <article id="submit" className={s.card}>
            <div
              className={s.cardCover}
              style={{ backgroundImage: 'url("/images/cards/submit.png")' }}
            />
            <div className={s.cardBody}>
              <h3 className={s.cardHeading}>
                {t("submitCard.title", { defaultValue: "Submit your proposal" })}
              </h3>
              <p className={s.cardText}>
                {t("submitCard.text", {
                  defaultValue: "Use the official template and upload.",
                })}
              </p>
              <div className={s.btnRow}>
                <Link className={s.btn} to="/ideas/new" data-variant="primary">
                  {t("submitCard.start", { defaultValue: "Start now" })}
                </Link>
                <a
                  className={s.btn}
                  href="/sample.docx"
                  download
                  data-variant="ghost"
                >
                  {t("submitCard.template", { defaultValue: "Download template" })}
                </a>
              </div>
            </div>
          </article>

          <article id="tracks" className={s.card}>
            <div
              className={s.cardCover}
              style={{ backgroundImage: 'url("/images/cards/tracks.png")' }}
            />
            <div className={s.cardBody}>
              <h3 className={s.cardHeading}>
                {t("tracksCard.title", { defaultValue: "Tracks" })}
              </h3>
              <p className={s.cardText}>
                {t("tracksCard.text", {
                  defaultValue: "Pick the track that matches your concept.",
                })}
              </p>
              <TracksCarousel items={TRACKS} />
            </div>
          </article>

          <article id="committee" className={s.card}>
            <div
              className={s.cardCover}
              style={{ backgroundImage: 'url("/images/cards/committee.png")' }}
            />
            <div className={s.cardBody}>
              <h3 className={s.cardHeading}>
                {t("committee.title", {
                  defaultValue: "Scientific Committee",
                })}
              </h3>
              <p className={s.cardText}>
                {t("committee.text", {
                  defaultValue:
                    "Meet the experts supporting your submissions.",
                })}
              </p>
              <CommitteeCarousel items={COMMITTEE} />
            </div>
          </article>
        </div>
      </section>

      <section id="timeline" className={s.container}>
        <h2 className={s.sectionTitle}>
          {t("timeline.title", { defaultValue: "Timeline" })}
        </h2>

        <div className={s.glassGrid}>
          <article className={s.glassCard} aria-label={t("timeline.item.submission")}>
            <div className={s.glassHead}>
              <span className={s.badge}>
                {t("timeline.item.submission", {
                  defaultValue: "بازه ارسال ایده",
                })}
              </span>
              <strong className={s.muted}>{formatDate(submissionIso)}</strong>
            </div>
            <div className={s.glassBody}>
              {submissionIso ? (
                <Countdown targetISO={submissionIso} size="sm" />
              ) : (
                <span className={s.muted}>—</span>
              )}
            </div>
          </article>

          <article className={s.glassCard} aria-label={t("timeline.item.review")}>
            <div className={s.glassHead}>
              <span className={s.badge}>
                {t("timeline.item.review", {
                  defaultValue: "Review & Results",
                })}
              </span>
              <strong>{formatDate(resultsIso || RESULTS_DATE_ISO)}</strong>
            </div>
            <div className={s.glassBody}>
              {resultsIso && <Countdown targetISO={resultsIso} size="sm" />}
            </div>
          </article>

          <article className={s.glassCard} aria-label={t("countdown.closing")}>
            <div className={s.glassHead}>
              <span className={s.badge}>
                {t("countdown.closing", {
                  defaultValue: isFa ? "اختتامیه رویداد" : "Closing Ceremony",
                })}
              </span>
              <strong>{formatDate(closingIso)}</strong>
            </div>
            <div className={s.glassBody}>
              {closingIso && <Countdown targetISO={closingIso} size="sm" />}
            </div>
          </article>
        </div>

        {/* <div className={s.listVertical}>
          <div className={s.row}>
            <span>{t("landing.prizePool", { defaultValue: "Prize Pool" })}</span>
            <strong>{formattedPrize} Rials</strong>
          </div>
        </div> */}
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
                    <span className="num" data-count="۲۰۰۰۰۰۰۰۰۰">۲,۰۰۰,۰۰۰,۰۰۰</span>
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


      {/* Contact */}
      <section id="contact" className={s.container}>
        <h2 className={s.sectionTitle}>{t("contact.title")}</h2>
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
    eitaaUrl="https://eitaa.com/MRN2025" 
  />
  {/* eslint-enable */}
          </section>

          <div className={s.card}>
            <div className={s.cardBody}>
              <strong>{isFa ? "آدرس" : "Address"}</strong>
              <p>{isFa ? "مازندران، نوشهر، خیایابان رازی، خیابان 22 بهمن، کوچه مسجد، ساختمان برادران لر، مرکز رشد واحد های فناور نوشهر" : "Mazandaran, Nowshahr, Razi Avenue, 22 Bahman Street, Masjed Alley, Nowshahr Technology Units Growth Center"}</p>
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
