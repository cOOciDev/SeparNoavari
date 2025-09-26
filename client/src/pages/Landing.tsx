import { useEffect, useMemo, useState, useCallback } from "react";
import Countdown from "../components/ui/Countdown";
import { MILESTONES, RESULTS_DATE_ISO } from "../shared/dates";
import { COMMITTEE } from "../AppData/committee";
import { useTranslation } from "react-i18next";
import s from "./landing.module.scss";

type Track = { id: number; title: string; slug: string; image: string; blurb: string };

const TRACKS: Track[] = [
  { id: 1, title: "Resilience & Risk Reduction", slug: "resilience", image: "/images/tracks/resilience.jpg", blurb: "Community preparedness and hazard mitigation." },
  { id: 2, title: "Crisis-Tech & Early Warning", slug: "crisis-tech", image: "/images/tracks/crisis-tech.jpg", blurb: "Sensors, data, AI for incident detection." },
  { id: 3, title: "Infrastructure & Passive Defense", slug: "passive-defense", image: "/images/tracks/passive-defense.jpg", blurb: "Hardening critical assets and continuity." },
  { id: 4, title: "Emergency Logistics", slug: "emergency-logistics", image: "/images/tracks/logistics.jpg", blurb: "Routing, stockpiles, rapid response." },
  { id: 5, title: "Health & Humanitarian", slug: "health-humanitarian", image: "/images/tracks/health.jpg", blurb: "Field triage, shelters, mental health." },
  { id: 6, title: "Education & Public Awareness", slug: "education-awareness", image: "/images/tracks/education.jpg", blurb: "Training, drills, civic engagement." },
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
        <p className={s.cardText}>{cur.blurb}</p>
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
            <div className={s.cardCover} style={{ backgroundImage: `url("/images/cards/deadline.jpg")` }} />
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
            <div className={s.cardCover} style={{ backgroundImage: `url("/images/cards/submit.jpg")` }} />
            <div className={s.cardBody}>
              <h3 className={s.cardHeading}>{t("submitCard.title")}</h3>
              <p className={s.cardText}>{t("submitCard.text")}</p>
              <div className={s.btnRow}>
                <a className={s.btn} href="/submit" data-variant="primary">{t("submitCard.start")}</a>
                <a className={s.btn} href="/docs/Idea-Proposal-Template.docx" download data-variant="ghost">
                  {t("submitCard.template")}
                </a>
              </div>
            </div>
          </article>

          {/* Tracks */}
          <article id="tracks" className={s.card}>
            <div className={s.cardCover} style={{ backgroundImage: `url("/images/cards/tracks.jpg")` }} />
            <div className={s.cardBody}>
              <h3 className={s.cardHeading}>{t("tracksCard.title")}</h3>
              <p className={s.cardText}>{t("tracksCard.text")}</p>
              <TracksCarousel items={TRACKS} />
            </div>
          </article>

          {/* Committee */}
          <article id="committee" className={s.card}>
            <div className={s.cardCover} style={{ backgroundImage: `url("/images/cards/committee.jpg")` }} />
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
            </div>
            <div className={s.glassBody}>
              {submissionMs ? (
                <>
                  <Countdown targetISO={submissionMs} size="sm" />
                  <div className={s.muted}>{formatDate(submissionMs)}</div>
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
            </div>
            <div className={s.glassBody}>
              <div className={s.row} style={{ justifyContent: "space-between" }}>
                <span>{t("timeline.item.results")}</span>
                <strong>{resultsMs ? formatDate(resultsMs) : formatDate(RESULTS_DATE_ISO)}</strong>
              </div>
              {resultsMs && <Countdown targetISO={resultsMs} size="sm" showLabels={false} />}
            </div>
          </article>

          {/* Box 3: Closing ceremony */}
          <article className={s.glassCard} aria-label="Closing ceremony">
            <div className={s.glassHead}>
              <span className={s.badge}>
                {t("countdown.closing", { defaultValue: isFa ? "اختتامیه رویداد" : "Closing Ceremony" })}
              </span>
            </div>
            <div className={s.glassBody}>
              <div className={s.row} style={{ justifyContent: "space-between" }}>
                <span>{t("countdown.closing", { defaultValue: isFa ? "اختتامیه" : "Closing" })}</span>
                <strong>{closingMs ? formatDate(closingMs) : "—"}</strong>
              </div>
              {closingMs && <Countdown targetISO={closingMs} size="sm" showLabels={false} />}
            </div>
          </article>
        </div>
      </section>

      {/* Awards & Sponsors (RTL, 6 items) */}
      <section id="awards" className={s.container}>
        <h2 className={s.sectionTitle}>{isFa ? "جوایز و حمایت‌ها" : "Awards & Sponsors"}</h2>
        <div className={s.awardsGrid} dir="rtl">
          {[
            isFa ? "حمایت مالی ویژه" : "Special Financial Support",
            isFa ? "جایزه تیم برتر" : "Best Team Award",
            isFa ? "جوایز نوآوری" : "Innovation Awards",
            isFa ? "شبکه‌سازی بین‌المللی" : "International Networking",
            isFa ? "پشتیبانی رسانه‌ای" : "Media Coverage",
            isFa ? "فرصت شتاب‌دهی" : "Acceleration Opportunity"
          ].map((txt, idx) => (
            <div key={idx} className={s.awardCard}>
              <strong>{txt}</strong>
            </div>
          ))}
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
          <div className={s.card}>
            <div className={s.cardBody}>
              <strong>{isFa ? "پشتیبانی" : "Support"}</strong>
              <p className={s.cardText}>Email: support@separ-noavari.org</p>
              <p className={s.cardText}>{isFa ? "تلفن: +98-21-000000" : "Phone: +98-21-000000"}</p>
            </div>
          </div>
          <div className={s.card}>
            <div className={s.cardBody}>
              <strong>{isFa ? "پیام بده" : "Message us"}</strong>
              <p className={s.cardText}>
                {isFa ? "فرم تماس اینجا قرار می‌گیرد." : "A contact form will be placed here."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
