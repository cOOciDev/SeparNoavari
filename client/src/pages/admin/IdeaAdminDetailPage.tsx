import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Tabs, Spin, Alert, Descriptions, Button } from "antd";
import { useTranslation } from "react-i18next";
import { useIdea } from "../../service/hooks";
import IdeaFilesList from "../../components/ideas/IdeaFilesList";
import AssignmentModal from "../../components/judges/AssignmentModal";
import EmptyState from "../../components/common/EmptyState";

const IdeaAdminDetailPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data, isLoading, error } = useIdea(id);
  const [assignOpen, setAssignOpen] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (error) {
    const message =
      error instanceof Error ? error.message : t("admin.ideaDetail.error", { defaultValue: "Failed to load idea" });
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
        <Alert type="info" message={t("admin.ideaDetail.notFound", { defaultValue: "Idea not found" })} />
      </Card>
    );
  }

  return (
    <Card
      title={idea.title}
      extra={
        <Button type="primary" onClick={() => setAssignOpen(true)}>
          {t("admin.ideas.assign", { defaultValue: "Assign" })}
        </Button>
      }
    >
      <Tabs
        defaultActiveKey="details"
        items={[
          {
            key: "details",
            label: t("admin.ideaDetail.tabs.details", { defaultValue: "Details" }),
            children: (
              <Descriptions column={1} bordered>
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
            ),
          },
          {
            key: "files",
            label: t("admin.ideaDetail.tabs.files", { defaultValue: "Files" }),
            children: <IdeaFilesList files={idea.files ?? []} />,
          },
          {
            key: "assignments",
            label: t("admin.ideaDetail.tabs.assignments", { defaultValue: "Assignments" }),
            children: (
              <EmptyState
                title={t("admin.ideaDetail.assignmentsEmpty", { defaultValue: "Assignments" })}
                description={t("admin.ideaDetail.assignmentsDesc", {
                  defaultValue: "Assignment data will appear here once available.",
                })}
              />
            ),
          },
          {
            key: "reviews",
            label: t("admin.ideaDetail.tabs.reviews", { defaultValue: "Reviews" }),
            children: (
              <EmptyState
                title={t("admin.ideaDetail.reviewsEmpty", { defaultValue: "Reviews" })}
                description={t("admin.ideaDetail.reviewsDesc", {
                  defaultValue: "Reviews will be displayed after judges submit them.",
                })}
              />
            ),
          },
        ]}
      />
      <AssignmentModal open={assignOpen} onClose={() => setAssignOpen(false)} ideaId={idea.id} />
    </Card>
  );
};

export default IdeaAdminDetailPage;
