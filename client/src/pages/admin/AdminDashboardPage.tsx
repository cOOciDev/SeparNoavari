import { Card, Col, Row, Statistic, Spin, Alert } from "antd";
import { useTranslation } from "react-i18next";
import { useAdminIdeas, useAdminJudges } from "../../service/hooks";

const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const ideasQuery = useAdminIdeas({ page: 1, pageSize: 100 });
  const judgesQuery = useAdminJudges({ page: 1, pageSize: 100 });

  if (ideasQuery.isLoading || judgesQuery.isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (ideasQuery.error || judgesQuery.error) {
    const message =
      ideasQuery.error instanceof Error
        ? ideasQuery.error.message
        : judgesQuery.error instanceof Error
        ? judgesQuery.error.message
        : t("admin.dashboard.error", { defaultValue: "Failed to load dashboard" });
    return (
      <Card>
        <Alert type="error" message={message} />
      </Card>
    );
  }

  const ideas = ideasQuery.data?.items ?? [];
  const totalIdeas = ideas.length;
  const doneCount = ideas.filter((idea: { status: string; }) => idea.status === "DONE").length;
  const inReviewCount = ideas.filter((idea: { status: string; }) => idea.status === "UNDER_REVIEW").length;
  const submittedCount = ideas.filter((idea: { status: string; }) => idea.status === "SUBMITTED").length;
  const completedPercentage = totalIdeas === 0 ? 0 : Math.round((doneCount / totalIdeas) * 100);

  const judges = judgesQuery.data?.items ?? [];
  const activeJudges = judges.filter((judge: { active: boolean; }) => judge.active !== false).length;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12} lg={6}>
        <Card>
          <Statistic
            title={t("admin.dashboard.totalIdeas", { defaultValue: "Total ideas" })}
            value={totalIdeas}
          />
        </Card>
      </Col>
      <Col xs={24} md={12} lg={6}>
        <Card>
          <Statistic
            title={t("admin.dashboard.submitted", { defaultValue: "Submitted" })}
            value={submittedCount}
          />
        </Card>
      </Col>
      <Col xs={24} md={12} lg={6}>
        <Card>
          <Statistic
            title={t("admin.dashboard.underReview", { defaultValue: "Under review" })}
            value={inReviewCount}
          />
        </Card>
      </Col>
      <Col xs={24} md={12} lg={6}>
        <Card>
          <Statistic
            title={t("admin.dashboard.done", { defaultValue: "Completed" })}
            value={doneCount}
            suffix={`(${completedPercentage}%)`}
          />
        </Card>
      </Col>
      <Col xs={24} md={12} lg={6}>
        <Card>
          <Statistic
            title={t("admin.dashboard.activeJudges", { defaultValue: "Active judges" })}
            value={activeJudges}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default AdminDashboardPage;
