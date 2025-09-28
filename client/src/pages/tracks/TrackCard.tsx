// client/src/app/pages/tracks/TrackCard.tsx
import type { Track } from "../../AppData/tracks";
import { useTranslation } from "react-i18next";
import styles from "./tracks.module.scss";

type Props = {
  track: Track;
  onOpen: (t: Track) => void;
};

export default function TrackCard({ track, onOpen }: Props) {
  const { t } = useTranslation();

  // برای دسترس‌پذیری: کلیک و کیبورد
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(track);
    }
  };

  return (
    <article
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(track)}
      onKeyDown={handleKey}
      aria-label={t(track.titleKey)}
    >
      <div
        className={styles.cover}
        style={{ backgroundImage: track.cover ? `url("${track.cover}")` : undefined }}
        aria-hidden="true"
      />
      <div className={styles.body}>
        <h3 className={styles.h}>{t(track.titleKey)}</h3>
        <p className={styles.p}>{t(track.longKey).length > 80 ? t(track.longKey).slice(0, 80) + " … " : t(track.longKey)}</p>
        {!!track.tags?.length && (
          <div className={styles.tags}>
            {track.tags.map((tg, i) => (
              <span key={i} className={styles.tag}>{tg}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
