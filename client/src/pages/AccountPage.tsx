import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  theme,
} from "antd";
import {
  FileTextOutlined,
  InboxOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import styles from "./account.module.scss";
import { useAuth } from "../contexts/AuthProvider";
import MyIdea from "../service/apis/account/MyIdea/MyIdea";
import { TRACKS } from "../AppData/tracks";

import type { FirstMyIdeaType } from "../service/apis/account/MyIdea/type";

const { Title, Text } = Typography;

type Attachment = {
  key: string;
  label: string;
  href: string;
};

const buildFileUrl = (relativePath: string) => {
  if (!relativePath) return "";
  const normalized = relativePath
    .replace(/^\.\//, "")
    .replace(/^\//, "")
    .replace(/\\/g, "/");
  if (/^https?:/i.test(normalized)) {
    return normalized;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:5501";
  return `${apiBase}/${normalized}`;
};

const parseAttachments = (raw: string | null | undefined): Attachment[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { pdf?: string | null; word?: string | null };
    const entries: Attachment[] = [];
    if (parsed.pdf) {
      entries.push({ key: "pdf", label: "PDF", href: buildFileUrl(parsed.pdf) });
    }
    if (parsed.word) {
      entries.push({ key: "word", label: "Word", href: buildFileUrl(parsed.word) });
    }
    if (entries.length) {
      return entries;
    }
  } catch (err) {
    // fall back to legacy path string
  }
  return [{ key: "file", label: "File", href: buildFileUrl(raw) }];
};

export default function AccountPage() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const { user } = useAuth();
  const { token } = theme.useToken();

  const { data, isLoading, isError } = useQuery({
    queryFn: () => MyIdea(),
    queryKey: ["my-ideas"],
    enabled: !!user,
  });

  const items: FirstMyIdeaType[] = data?.ideas ?? [];

  const fmtDate = (iso?: string) => {
    if (!iso) return "—";
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
    if (!slug) return "—";
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
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => nav("/submit")}
              >
                {t("account.submitNewIdea")}
              </Button>
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
                    onClick={() => nav("/submit")}
                  >
                    {t("account.submitNewIdea")}
                  </Button>
                </Empty>
              </div>
            )}

            {hasIdeas && (
              <div className={styles.ideaGrid}>
                {items.map((idea) => {
                  const attachments = parseAttachments(idea.file_path);
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
                            <Text strong>{idea.submitter_full_name || "â€”"}</Text>
                          </div>
                          <div className={styles.metaItem}>
                            <Text type="secondary">{t("account.contactEmail")}</Text>
                            <Text strong>{idea.contact_email || "â€”"}</Text>
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
                                      .join(", ") || "â€”"
                                  : idea.team_members || "â€”"}
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

