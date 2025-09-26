import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button, Typography, Spin, Tag, Empty, Alert } from "antd";
import styles from "./account.module.scss";
import { useAuth } from "../contexts/AuthProvider";
import MyIdea from "../service/apis/account/MyIdea/MyIdea";
import { TRACKS } from "../AppData/tracks";

import type { FirstMyIdeaType } from "../service/apis/account/MyIdea/type";

const { Title, Text } = Typography;

export default function AccountPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryFn: () => MyIdea(),
    queryKey: ["my-ideas"],
    enabled: !!user,
  });

  const fmt = (iso?: string) => {
    if (!iso) return "—";
    try {
      // Handle SQLite datetime format (YYYY-MM-DD HH:mm:ss)
      // SQLite stores in local time, so we need to treat it as local time
      let date: Date;
      if (iso.includes('T') || iso.includes('Z')) {
        // ISO format with timezone info
        date = new Date(iso);
      } else {
        // SQLite format without timezone - treat as local time
        // Add 'T' to make it a valid ISO string for local interpretation
        date = new Date(iso.replace(' ', 'T'));
      }
      
      if (isNaN(date.getTime())) {
        return iso; // Return original if can't parse
      }
      
      // Add 3.5 hours (3:30) to compensate for timezone offset
      const adjustedDate = new Date(date.getTime() + (3.5 * 60 * 60 * 1000));
      
      // Use English format with local timezone
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // Use 24-hour format
      }).format(adjustedDate);
    } catch {
      return iso;
    }
  };

  const items: FirstMyIdeaType[] = data?.ideas ?? [];

  const getTrackLabel = (slug?: string) => {
    if (!slug) return "—";
    const match = TRACKS.find((t) => t.slug === slug);
    return match ? t(match.titleKey) : slug;
  };

  return (
    <main className={styles.account} aria-labelledby="accountTitle">
      <div className={styles.headerRow}>
        <Title id="accountTitle" level={1}>
          {t("account.title")}
        </Title>
      </div>

      <section className={styles.block} aria-labelledby="activityTitle">
        <div className={styles.blockHead}>
          <Title id="activityTitle" level={2}>
            {t("account.activityTitle")}
          </Title>
        </div>

        <div className={styles.content}>
          {isLoading && (
            <Spin
              size="large"
              style={{ display: "block", margin: "20px auto" }}
            />
          )}

          {isError && (
            <Alert
              message={t("account.loadError")}
              description={t("account.loadError")}
              type="error"
              showIcon
            />
          )}

          {!isLoading && !isError && items.length === 0 && (
            <Empty
              description={t("account.noIdeas")}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                onClick={() => nav("/submit")}
                style={{ marginTop: 16 }}
              >
                {t("account.submitNewIdea")}
              </Button>
            </Empty>
          )}

          {!isLoading && !isError && items.length > 0 && (
            <div className={styles.listGridWrapper}>
              {items.map((item) => (
                <article className={styles.card} key={item.id}>
                  <div className={styles.cardHead}>
                    <h3 className={styles.cardTitle}>{item.idea_title}</h3>
                    <Tag color="blue">{getTrackLabel(item.track)}</Tag>
                  </div>

                  {item.executive_summary && (
                    <Text style={{ display: "block", marginBottom: 30 }}>
                      {item.executive_summary}
                    </Text>
                  )}

                  <div className={styles.metaList}>
                    <div className={styles.metaWrapper}>
                      <span className={styles.metaKey}>{t("account.submittedAt")}: </span>
                      <span className={styles.metaVal}>{fmt(item.submitted_at)}</span>
                    </div>
                    <div className={styles.metaWrapper}>
                      <span className={styles.metaKey}>{t("account.submitterName") || "Submitter"}: </span>
                      <span className={styles.metaVal}>{item.submitter_full_name || "—"}</span>
                    </div>
                    <div className={styles.metaWrapper}>
                      <span className={styles.metaKey}>{t("account.contactEmail") || "Email"}: </span>
                      <span className={styles.metaVal}>{item.contact_email || "—"}</span>
                    </div>
                    <div className={styles.metaWrapper}>
                      <span className={styles.metaKey}>{t("account.teamMembers") || "Team"}: </span>
                      <span className={styles.metaVal}>{
                        Array.isArray(item.team_members)
                          ? item.team_members.join(", ")
                          : (typeof item.team_members === "object" && item.team_members !== null)
                            ? Object.keys(item.team_members)
                                .sort()
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                .map(k => String((item.team_members as any)[k]))
                                .filter(Boolean)
                                .join(", ") || "—"
                            : (item.team_members || "—")
                      }</span>
                    </div>
                    {item.file_path && (
                      <div className={styles.metaWrapper}>
                        <span className={styles.metaKey}>{t("account.file") || "File"}: </span>
                        <a
                          className={styles.metaValLink}
                          href={`http://localhost:5000/${item.file_path.replace(/^\.\/?/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t("account.viewUploadedFile") || "View uploaded file"}
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
