import { useParams } from "react-router-dom";
import { Card, Descriptions, Spin, Alert } from "antd";
import { useTranslation } from "react-i18next";
import { useIdea } from "../../service/hooks";
import IdeaFilesList from "../../components/ideas/IdeaFilesList";
import ReviewForm from "./ReviewForm";

const JudgeIdeaDetailPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data, isLoading, error } = useIdea(id);

  if (isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (error) {
    const message =
      error instanceof Error ? error.message : t("judge.detail.error", { defaultValue: "Failed to load idea" });
    return (
      <Card>
        <Alert type="error" message={message} />
      </Card>
    );
  }

  const idea = data?.idea;

  if (!idea) {
    return (
      <Card>
        <Alert type="info" message={t("judge.detail.notFound", { defaultValue: "Idea not found" })} />
      </Card>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <Card title={idea.title}>
        <Descriptions column={1} bordered size="middle" style={{ marginBottom: 24 }}>
          <Descriptions.Item label={t("ideas.detail.category", { defaultValue: "Category" })}>
            {idea.category || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("ideas.detail.status", { defaultValue: "Status" })}>
            {idea.status}
          </Descriptions.Item>
          <Descriptions.Item label={t("ideas.detail.summary", { defaultValue: "Summary" })}>
            {idea.summary || t("ideas.detail.noSummary", { defaultValue: "No summary provided." })}
          </Descriptions.Item>
        </Descriptions>
        <IdeaFilesList files={idea.files ?? []} />
      </Card>

      {id ? (
        <Card title={t("judge.review.title", { defaultValue: "Submit review" })}>
          <ReviewForm ideaId={id} />
        </Card>
      ) : null}
    </div>
  );
};

export default JudgeIdeaDetailPage;
