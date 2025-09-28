// client/src/app/pages/tracks/TrackModal.tsx
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Track } from "../../AppData/tracks";
import styles from "./tracks.module.scss";

type Props = {
  open: boolean;
  track: Track | null;
  onClose: () => void;
};

export default function TrackModal({ open, track, onClose }: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  // ESC و فوکوس اولیه داخل شیت
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    // فوکوس
    setTimeout(() => {
      ref.current?.querySelector<HTMLElement>("button, a, [tabindex]")?.focus();
    }, 0);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !track) return null;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="track-title" onClick={onClose}>
      <div className={styles.sheet} ref={ref} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.sheetHead}>
          <h3 id="track-title" className={styles.sheetTitle}>{t(track.titleKey)}</h3>
          <button className={styles.close} onClick={onClose} aria-label={t("tracksPage.close")}>×</button>
        </div>
        <div style={{display: "flex"}}>

        <div
          className={styles.sheetCover}
          style={{ backgroundImage: track.cover ? `url("${track.cover}")` : undefined }}
          aria-hidden="true"
        />
        <div className={styles.sheetBody}>
          <p style={{ margin: 0, opacity: .9 }}>{t(track.longKey)}</p>

          {/* {!!track.resources?.length && (
            <div className={styles.resList} aria-label={t("tracksPage.resources")}>
              {track.resources.map((r, i) => (
                <a key={i} className={styles.resLink} href={r.href} target="_blank" rel="noopener noreferrer">
                  {t(r.labelKey)}
                </a>
              ))}
            </div>
          )} */}
        </div>
</div>

      </div>
    </div>
  );
}
