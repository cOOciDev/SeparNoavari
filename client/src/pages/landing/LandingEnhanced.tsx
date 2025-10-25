import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import s from "../landing.module.scss";
import { TRACKS } from "../../AppData/tracks";
import { COMMITTEE } from "../../AppData/committee";
import { MILESTONES, RESULTS_DATE_ISO } from "../../AppData/schedule";

import TracksCarousel from "../../components/TracksCarousel";
import CommitteeCarousel from "../../components/CommitteeCarousel";
import Countdown from "../../components/Countdown";

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
  const PRIZE_TOTAL = 2_000_000_000;
  const formattedPrize = isFa
    ? PRIZE_TOTAL.toLocaleString("fa-IR")
    : PRIZE_TOTAL.toLocaleString();

  const formatDate = useMemo(() => {
    const locale = isFa ? "fa-IR" : "en-US";
    const formatter = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
    return (iso?: string) => (iso ? formatter.format(new Date(iso)) : "—");
  }, [isFa]);

  const { submissionIso, resultsIso, closingIso, next, upcoming, submissionOver } =
    useMemo(() => {
      const now = Date.now();
      const list = (MILESTONES || []).map((milestone) => ({
        ...milestone,
        ts: new Date(milestone.iso).getTime(),
      }));

      const byKey = (key: string) => list.find((item) => item.key === key);

      const submission = byKey("submission");
      const results =
        byKey("results") ?? {
          key: "results",
          iso: RESULTS_DATE_ISO,
          ts: new Date(RESULTS_DATE_ISO).getTime(),
          label: "Results",
        };
      const closing = byKey("closing");

      const nextMilestone =
        list.find((item) => item.ts > now) ?? list[list.length - 1];
      const isSubmissionOver = submission ? now >= submission.ts : true;
      const upcomingList = list.filter((item) => item.ts > now).slice(0, 2);

      return {
        submissionIso: submission?.iso,
        resultsIso: results?.iso,
        closingIso: closing?.iso,
        next: nextMilestone,
        upcoming: upcomingList,
        submissionOver: isSubmissionOver,
      };
    }, []);

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
            <Link className={s.btn} to="/ideas/new" data-variant="primary">
              {t("landing.cta.submit", { defaultValue: "Submit Your Idea" })}
            </Link>
            <Link className={s.btn} to="/tracks" data-variant="ghost">
              {t("landing.cta.tracks", { defaultValue: "Explore Tracks" })}
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
                          showLabels={false}
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
                {t("landing.committeeHeading", {
                  defaultValue: "Scientific Committee",
                })}
              </h3>
              <p className={s.cardText}>
                {t("landing.committeeText", {
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
                  defaultValue: "Submission deadline",
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

        <div className={s.listVertical}>
          <div className={s.row}>
            <span>{t("landing.prizePool", { defaultValue: "Prize Pool" })}</span>
            <strong>{formattedPrize} Rials</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
