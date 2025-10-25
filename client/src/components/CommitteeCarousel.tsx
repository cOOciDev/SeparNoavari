import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import s from "../pages/landing.module.scss";

export type CommitteeMember = {
  id: number | string;
  name: string;
  role: string;
  affiliation: string;
  photo?: string;
  profileUrl?: string;
};

type CommitteeCarouselProps = {
  items: CommitteeMember[];
  interval?: number;
};

const DEFAULT_INTERVAL = 5200;

export default function CommitteeCarousel({
  items,
  interval = DEFAULT_INTERVAL,
}: CommitteeCarouselProps) {
  const { t } = useTranslation();
  const hasItems = Array.isArray(items) && items.length > 0;
  const [index, setIndex] = useState(0);

  const safeItems = useMemo(
    () => (hasItems ? items : []),
    [hasItems, items]
  );

  const goNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % safeItems.length);
  }, [safeItems.length]);

  const goPrev = useCallback(() => {
    setIndex((prev) => (prev === 0 ? safeItems.length - 1 : prev - 1));
  }, [safeItems.length]);

  useEffect(() => {
    if (!hasItems) return undefined;
    const timer = window.setInterval(goNext, interval);
    return () => window.clearInterval(timer);
  }, [goNext, hasItems, interval]);

  if (!hasItems) return null;
  const current = safeItems[index];

  return (
    <div
      className={s.carousel}
      role="region"
      aria-label={t("committee.title", {
        defaultValue: "Scientific Committee",
      })}
    >
      <a
        href={current.profileUrl || "/committee"}
        className={s.heroThumb}
        aria-label={`${current.name} — ${current.role}`}
        title={current.name}
        style={
          current.photo ? { backgroundImage: `url("${current.photo}")` } : undefined
        }
      />

      <div className={s.carouselBody}>
        <strong className={s.cardTitle}>{t(current.name)}</strong>
        <span className={s.cardMeta}>
          {t(current.role)} — {t(current.affiliation)}
        </span>
      </div>

      <div className={s.carouselControls}>
        <div className={s.btnRow}>
          <button
            type="button"
            onClick={goPrev}
            className={s.btnGhost}
            aria-label={t("carousel.prev", { defaultValue: "Previous member" })}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goNext}
            className={s.btnGhost}
            aria-label={t("carousel.next", { defaultValue: "Next member" })}
          >
            ›
          </button>
        </div>
        <div className={s.dots} role="tablist" aria-label="Committee members">
          {safeItems.map((item, idx) => (
            <button
              key={item.id ?? idx}
              type="button"
              role="tab"
              aria-selected={idx === index}
              aria-label={t("carousel.goto", {
                defaultValue: "Go to slide {{n}}",
                n: idx + 1,
              })}
              className={`${s.dot} ${idx === index ? s.dotActive : ""}`}
              onClick={() => setIndex(idx)}
            />
          ))}
        </div>
      </div>

      <a className={s.btn} href="/committee" data-variant="primary">
        {t("committee.seeAll", { defaultValue: "See all" })}
      </a>
    </div>
  );
}
