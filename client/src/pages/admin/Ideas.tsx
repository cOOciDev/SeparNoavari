import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Spin, Button } from "antd";
import { useAdminIdeas } from "../../service/hooks/useAdminData";
import { buildIdeaDownloadUrl, buildIdeaFolderDownloadUrl } from "../../utils/download";
import s from "../../styles/panel.module.scss";

function normalize(value: string) {
  return value.toLowerCase();
}

export default function Ideas() {
  const { t } = useTranslation();
  const { ideas, isLoading } = useAdminIdeas();
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("ALL");

  const tracks = useMemo(() => {
    const set = new Set<string>();
    ideas.forEach((idea) => {
      if (idea.track) {
        set.add(idea.track);
      }
    });
    return Array.from(set).sort();
  }, [ideas]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return ideas.filter((idea) => {
      const matchesSearch = q
        ? [idea.title, idea.submitter, idea.contactEmail, idea.track]
            .filter(Boolean)
            .some((field) => normalize(String(field)).includes(q))
        : true;
      const matchesTrack = trackFilter === 'ALL' ? true : idea.track === trackFilter;
      return matchesSearch && matchesTrack;
    });
  }, [ideas, search, trackFilter]);

  return (
    <div className={s.stack}>
      <h1>{t('admin.ideas.title')}</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <div className={s.filters}>
            <input
              className={s.input}
              placeholder={t('admin.ideas.searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className={s.select}
              value={trackFilter}
              onChange={(event) => setTrackFilter(event.target.value)}
            >
              <option value="ALL">{t('admin.ideas.filterAllTracks')}</option>
              {tracks.map((track) => (
                <option key={track} value={track}>
                  {track || t('admin.ideas.trackUnknown')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={s.tableWrap}>
        {isLoading ? (
          <div className={s.center}><Spin /></div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>{t('admin.ideas.table.title')}</th>
                <th>{t('admin.ideas.table.submitter')}</th>
                <th>{t('admin.ideas.table.email')}</th>
                <th>{t('admin.ideas.table.track')}</th>
                <th>{t('admin.ideas.table.submitted')}</th>
                <th>{t('admin.ideas.table.files')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((idea) => (
                <tr key={idea.id}>
                  <td>{idea.title}</td>
                  <td>{idea.submitter || t('admin.ideas.unknownSubmitter')}</td>
                  <td>{idea.contactEmail || '—'}</td>
                  <td>{idea.track || t('admin.ideas.trackUnknown')}</td>
                  <td>{new Date(idea.submittedAt).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        type="link"
                        size="small"
                        disabled={!idea.files?.pdf}
                        href={buildIdeaDownloadUrl(idea.id, 'pdf')}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('admin.ideas.downloadPdf')}
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        disabled={!idea.files?.word}
                        href={buildIdeaDownloadUrl(idea.id, 'word')}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('admin.ideas.downloadWord')}
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        href={buildIdeaFolderDownloadUrl(idea.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('admin.ideas.downloadFolder')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className={s.muted}>
                    {t('admin.ideas.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
