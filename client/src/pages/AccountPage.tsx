import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Empty,
  Space,
  Spin,
  Tag,
  Typography,
  message,
  theme,
} from "antd";
import {
  FileTextOutlined,
  InboxOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { MdAdminPanelSettings } from 'react-icons/md';

import styles from "./account.module.scss";
import { useAuth } from "../contexts/AuthProvider";
import MyIdea from "../service/apis/account/MyIdea/MyIdea";
import { TRACKS } from "../AppData/tracks";
import { buildIdeaDownloadUrl } from "../utils/download";

import type { FirstMyIdeaType } from "../service/apis/account/MyIdea/type";

const { Title, Text } = Typography;

type Attachment = {
  key: string;
  label: string;
  href: string;
};

const parseAttachments = (
  ideaId: number,
  raw: string | null | undefined
): Attachment[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Record<string, string | null | undefined>;
    const entries: Attachment[] = [];
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (parsed.pdf) {
        entries.push({ key: "pdf", label: "PDF", href: buildIdeaDownloadUrl(ideaId, "pdf") });
      }
      if (parsed.word) {
        entries.push({ key: "word", label: "Word", href: buildIdeaDownloadUrl(ideaId, "word") });
      }
      if (entries.length) {
        return entries;
      }
    }
  } catch {
    // ignore JSON parse issues, fall back to legacy string
  }
  return [{ key: "file", label: "File", href: buildIdeaDownloadUrl(ideaId, "file") }];
};

export default function AccountPage() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const { user } = useAuth();
  const { token } = theme.useToken();

  const { data, isLoading, isError, error } = useQuery({
    queryFn: () => MyIdea(),
    queryKey: ["my-ideas"],
    enabled: !!user,
  });

  useEffect(() => {
    const authError = error as { status?: number } | null | undefined;
    if (authError && (authError.status === 401 || authError.status === 403)) {
      message.error(
        t("account.sessionExpired", {
          defaultValue: "Your session has expired. Please log in again.",
        })
      );
      nav(`/login?next=${encodeURIComponent("/account")}`, { replace: true });
    }
  }, [error, nav, t]);

  // Debug: log current auth user at render
  if (import.meta.env.DEV) console.log('[AccountPage] user:', user);

  const items: FirstMyIdeaType[] = data?.ideas ?? [];

  const fmtDate = (iso?: string) => {
    if (!iso) return "-";
    try {
      const parsed = iso.includes("T") || iso.includes("Z")
        ? new Date(iso)
        : new Date(iso.replace(" ", "T"));
      if (Number.isNaN(parsed.getTime())) {
        return iso;
      }
      const adjusted = new Date(parsed.getTime() + 3.5 * 60 * 60 * 1000);
      return new Intl.DateTimeFormat(i18n.language || "en", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(adjusted);
    } catch (err) {
      return iso;
    }
  };

  const getTrackLabel = (slug?: string) => {
    if (!slug) return "-";
    const match = TRACKS.find((entry) => entry.slug === slug);
    return match ? t(match.titleKey) : slug;
  };

  const hasIdeas = !isLoading && !isError && items.length > 0;

  return (
    <main className={styles.page} style={{ background: token.colorBgLayout }}>
      <div className={styles.container}>
        <Space direction="vertical" size={token.sizeLG} style={{ width: "100%" }}>
          <Card
            className={styles.hero}
            style={{
              background: token.colorBgContainer,
              boxShadow: token.boxShadowTertiary,
              borderColor: token.colorBorderSecondary,
            }}
          >
            <div className={styles.heroContent}>
              <div className={styles.heroText}>
                <Title level={2} className={styles.heroTitle}>
                  {t("account.title")}
                </Title>
                <Text type="secondary">{user?.userEmail}</Text>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={() => nav("/ideas/new")}
                >
                  {t("account.submitNewIdea")}
                </Button>
                {((String(user?.role || '').toLowerCase() === 'admin') ||
                  (String(user?.userEmail || '').trim().toLowerCase() === 'hamedanian79@gmail.com') ||
                  (String(user?.userId || '') === 'admin')) && (
                  <Button
                    className={styles.adminButton}
                    type="default"
                    size="large"
                    onClick={() => nav('/panel/admin')}
                    data-qa="admin-panel-btn"
                  >
                    <MdAdminPanelSettings style={{ marginInlineEnd: 8 }} />
                    {t('admin.topbar.title') || 'Admin'}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card
            className={styles.section}
            title={t("account.activityTitle")}
            style={{
              background: token.colorBgContainer,
              boxShadow: token.boxShadowTertiary,
              borderColor: token.colorBorderSecondary,
            }}
          >
            {isLoading && (
              <div className={styles.stateWrapper}>
                <Spin size="large" />
              </div>
            )}

            {isError && (
              <Alert
                type="error"
                message={t("account.loadError")}
                showIcon
                className={styles.alert}
              />
            )}

            {!isLoading && !isError && !items.length && (
              <div className={styles.stateWrapper}>
                <Empty
                  image={<InboxOutlined style={{ fontSize: 48, color: token.colorIcon }} />}
                  description={t("account.noIdeas")}
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => nav("/ideas/new")}
                  >
                    {t("account.submitNewIdea")}
                  </Button>
                </Empty>
              </div>
            )}

            {hasIdeas && (
              <div className={styles.ideaGrid}>
                {items.map((idea) => {
                  const ideaOwnerId = Number(idea.user_id);
                  const currentUserId =
                    typeof user?.userId === "number"
                      ? user.userId
                      : Number(user?.userId);
                  const canViewFiles =
                    (user?.role === "admin") ||
                    (Number.isInteger(currentUserId) && currentUserId === ideaOwnerId);
                  const attachments = canViewFiles
                    ? parseAttachments(idea.id, idea.file_path)
                    : [];
                  return (
                    <Card
                      key={idea.id}
                      className={styles.ideaCard}
                      
                      hoverable
                      style={{
                        borderColor: token.colorBorderSecondary,
                        background: token.colorBgContainer,
                      }}
                    >
                      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                        <div className={styles.ideaHeader}>
                          <Title level={4} className={styles.ideaTitle}>
                            {idea.idea_title || t("account.untitledIdea")}
                          </Title>
                          {idea.track && (
                            <p className={styles.accountcardtrack} >
                              {getTrackLabel(idea.track)}
                            </p>
                          )}
                        </div>

                        {idea.executive_summary && (
                          <Text type="secondary" className={styles.summary}>
                            {idea.executive_summary}
                          </Text>
                        )}

                        <div className={styles.metaGrid}>
                          <div className={styles.metaItem}>
                            <Text type="secondary">{t("account.submittedAt")}</Text>
                            <Text strong>{fmtDate(idea.submitted_at)}</Text>
                          </div>
                          <div className={styles.metaItem}>
                            <Text type="secondary">{t("account.submitterName")}</Text>
                            <Text strong>{idea.submitter_full_name || "-"}</Text>
                          </div>
                          <div className={styles.metaItem}>
                            <Text type="secondary">{t("account.contactEmail")}</Text>
                            <Text strong>{idea.contact_email || "-"}</Text>
                          </div>
                          <div className={styles.metaItem}>
                            <Text type="secondary">{t("account.teamMembers")}</Text>
                            <Text strong>
                              {Array.isArray(idea.team_members)
                                ? idea.team_members.join(", ")
                                : typeof idea.team_members === "object" && idea.team_members !== null
                                  ? Object.keys(idea.team_members)
                                      .sort()
                                      .map((key) => String((idea.team_members as Record<string, unknown>)[key]))
                                      .filter(Boolean)
                                      .join(", ") || "-"
                                  : idea.team_members || "-"}
                            </Text>
                          </div>
                        </div>

                        {!!attachments.length && (
                          <Space size={[8, 8]} wrap>
                            {attachments.map((file) => (
                              <Button
                                key={file.key}
                                href={file.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                icon={<FileTextOutlined />}
                              >
                                {file.label}
                              </Button>
                            ))}
                          </Space>
                        )}
                      </Space>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </Space>
      </div>
    </main>
  );
}


