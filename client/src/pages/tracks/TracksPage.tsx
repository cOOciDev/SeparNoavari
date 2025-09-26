// client/src/app/pages/tracks/TracksPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./tracks.module.scss";

import { TRACKS } from "../../AppData/tracks";
import type { Track } from "../../AppData/tracks";

import TrackCard from "./TrackCard";
import TrackModal from "./TrackModal";

export default function TracksPage() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Track | null>(null);

  // فیلتر سریع
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return TRACKS;
    return TRACKS.filter((m) => {
      const hay = [
        t(m.titleKey),
        t(m.shortKey),
        t(m.longKey),
        ...(m.tags ?? []),
      ].join(" ").toLowerCase();
      return hay.includes(s);
    });
  }, [q, i18n.language, t]);

  // deep-link با hash
  useEffect(() => {
    const slug = window.location.hash?.slice(1);
    if (!slug) return;
    const found = TRACKS.find((x) => x.slug === slug);
    if (found) setSelected(found);
  }, []);

  const openTrack = (tr: Track) => {
    setSelected(tr);
    // sync hash
    if (location.hash.slice(1) !== tr.slug) {
      history.pushState(null, "", `#${tr.slug}`);
    }
  };
  const closeModal = () => {
    setSelected(null);
    // پاک کردن hash
    history.replaceState(null, "", location.pathname);
  };

  return (
    <div className={styles.wrap}>

      <main className={styles.container}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.title}>{t("tracksPage.title")}</h1>
            <p className={styles.sub}>{t("tracksPage.subtitle")}</p>
          </div>

          <input
            className={styles.search}
            placeholder={t("tracksPage.searchPh")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t("tracksPage.searchPh")}
          />
        </div>

        <section className={styles.grid} aria-live="polite">
          {list.map((tr) => (
            <TrackCard key={tr.id} track={tr} onOpen={openTrack} />
          ))}
        </section>

        {list.length === 0 && (
          <p className="muted" style={{ marginTop: 14 }}>{t("tracksPage.noResult")}</p>
        )}
      </main>



      <TrackModal open={selected !== null} track={selected} onClose={closeModal} />
    </div>
  );
}
