import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Spin } from "antd";
import { useAdminIdeas, useAdminOverview } from "../../service/hooks/useAdminData";
import s from "../../styles/panel.module.scss";

const formatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "-";
  return formatter.format(dt);
}

export default function Dashboard() {
  const { t } = useTranslation();
  const overviewQuery = useAdminOverview();
  const ideasQuery = useAdminIdeas();

  const topIdeas = useMemo(() => ideasQuery.ideas.slice(0, 5), [ideasQuery.ideas]);

  return (
    <div className={s.stack}>
      <h1>{t("admin.dashboard.title")}</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          {overviewQuery.isLoading ? (
            <div className={s.center}><Spin /></div>
          ) : (
            <div className={s.statsGrid}>
              <div>
                <span className={s.statLabel}>{t("admin.dashboard.totalIdeas")}</span>
                <strong className={s.statValue}>{overviewQuery.data?.totalIdeas ?? 0}</strong>
              </div>
              <div>
                <span className={s.statLabel}>{t("admin.dashboard.totalUsers")}</span>
                <strong className={s.statValue}>{overviewQuery.data?.totalUsers ?? 0}</strong>
              </div>
              <div>
                <span className={s.statLabel}>{t("admin.dashboard.lastSubmission")}</span>
                <strong className={s.statValue}>{formatDate(overviewQuery.data?.lastSubmissionAt)}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={s.card}>
        <div className={s.cardBody}>
          <h2 className={s.cardTitle}>{t("admin.dashboard.latestIdeas")}</h2>
          {ideasQuery.isLoading ? (
            <div className={s.center}><Spin size="small" /></div>
          ) : topIdeas.length ? (
            <ul className={s.simpleList}>
              {topIdeas.map((idea) => (
                <li key={idea.id}>
                  <div className={s.listPrimary}>{idea.title || t("admin.dashboard.untitled")}</div>
                  <div className={s.listMeta}>
                    {(idea.submitter || t("admin.dashboard.unknownSubmitter")) + " · " + formatDate(idea.submittedAt)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.muted}>{t("admin.dashboard.noIdeas")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
