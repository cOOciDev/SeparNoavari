import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, Descriptions, Spin, Alert } from "antd";
import { useTranslation } from "react-i18next";
import { useIdea } from "../../service/hooks";
import IdeaFilesList from "../../components/ideas/IdeaFilesList";

const IdeaDetailPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data, isLoading, error } = useIdea(id);

  const idea = data?.idea;

  const metadata = useMemo(
    () =>
      idea
        ? [
            { label: t("ideas.detail.category", { defaultValue: "Category" }), value: idea.category || "-" },
            { label: t("ideas.detail.status", { defaultValue: "Status" }), value: idea.status },
            {
              label: t("ideas.detail.submittedAt", { defaultValue: "Submitted" }),
              value: new Date(idea.createdAt).toLocaleString(),
            },
            {
              label: t("ideas.detail.updatedAt", { defaultValue: "Last update" }),
              value: new Date(idea.updatedAt).toLocaleString(),
            },
          ]
        : [],
    [idea, t]
  );

  if (isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : t("ideas.detail.error", { defaultValue: "Failed to load idea" });
    return (
      <Card>
        <Alert type="error" message={message} />
      </Card>
    );
  }

  if (!idea) {
    return (
      <Card>
        <Alert type="info" message={t("ideas.detail.notFound", { defaultValue: "Idea not found" })} />
      </Card>
    );
  }

  return (
    <Card title={idea.title}>
      <Descriptions column={1} bordered size="middle" style={{ marginBottom: 24 }}>
        {metadata.map((item) => (
          <Descriptions.Item key={item.label as string} label={item.label}>
            {item.value}
          </Descriptions.Item>
        ))}
        <Descriptions.Item label={t("ideas.detail.summary", { defaultValue: "Summary" })}>
          {idea.summary || t("ideas.detail.noSummary", { defaultValue: "No summary provided." })}
        </Descriptions.Item>
      </Descriptions>
      <IdeaFilesList files={idea.files ?? []} />
    </Card>
  );
};

export default IdeaDetailPage;
