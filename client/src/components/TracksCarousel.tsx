import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import s from "../pages/landing.module.scss";

export type TrackCarouselItem = {
  id: string | number;
  slug: string;
  titleKey: string;
  shortKey: string;
  cover?: string;
};

type TracksCarouselProps = {
  items: TrackCarouselItem[];
  interval?: number;
};

const DEFAULT_INTERVAL = 5000;

const textPreview = (value: string, max = 72) =>
  value.length > max ? `${value.slice(0, max)}…` : value;

export default function TracksCarousel({
  items,
  interval = DEFAULT_INTERVAL,
}: TracksCarouselProps) {
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

  useEffect(() => {
    if (!hasItems) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, hasItems]);

  if (!hasItems) return null;
  const current = safeItems[index];

  return (
    <div
      className={s.carousel}
      role="region"
      aria-label={t("tracksCard.title", { defaultValue: "Tracks" })}
    >
      <a
        href={`/tracks/${current.slug}`}
        className={s.heroThumb}
        aria-label={t(current.titleKey)}
        title={t(current.titleKey)}
        style={
          current.cover ? { backgroundImage: `url("${current.cover}")` } : undefined
        }
      />

      <div className={s.carouselBody}>
        <strong className={s.cardTitle}>{t(current.titleKey)}</strong>
        <p className={s.cardText}>{textPreview(t(current.shortKey))}</p>
      </div>

      <div className={s.carouselControls}>
        <div className={s.btnRow}>
          <button
            type="button"
            onClick={goPrev}
            className={s.btnGhost}
            aria-label={t("carousel.prev", { defaultValue: "Previous slide" })}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goNext}
            className={s.btnGhost}
            aria-label={t("carousel.next", { defaultValue: "Next slide" })}
          >
            ›
          </button>
        </div>
        <div className={s.dots} role="tablist" aria-label="Track slides">
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

      <a className={s.btn} href="/tracks" data-variant="primary">
        {t("header.seeAll", { defaultValue: "See all" })}
      </a>
    </div>
  );
}
