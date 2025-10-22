import { useMemo } from "react";
import { Card, Spin, Alert, Tag } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DataTable from "../../components/common/DataTable";
import EmptyState from "../../components/common/EmptyState";
import { useJudgeIdeas } from "../../service/hooks";
import type { Idea, IdeaStatus } from "../../types/domain";

const JudgeDashboardPage = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useJudgeIdeas();

  const columns = useMemo(
    () => [
      {
        title: t("judge.table.title", { defaultValue: "Title" }),
        dataIndex: "title",
        key: "title",
        render: (_: string, record: Idea) => <Link to={`/judge/ideas/${record.id}`}>{record.title}</Link>,
      },
      {
        title: t("judge.table.status", { defaultValue: "Status" }),
        dataIndex: "status",
        key: "status",
        render: (value: IdeaStatus) => <Tag color={value === "REVIEWED" ? "green" : "blue"}>{value}</Tag>,
      },
      {
        title: t("judge.table.category", { defaultValue: "Category" }),
        dataIndex: "category",
        key: "category",
      },
      {
        title: t("judge.table.submitted", { defaultValue: "Submitted" }),
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value: string) => new Date(value).toLocaleString(),
      },
    ],
    [t]
  );

  if (isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (error) {
    const message =
      error instanceof Error ? error.message : t("judge.table.error", { defaultValue: "Failed to load assignments" });
    return (
      <Card>
        <Alert type="error" message={message} />
      </Card>
    );
  }

  const assignments = data?.items ?? [];

  return (
    <Card title={t("judge.dashboard.title", { defaultValue: "Assignments" })}>
      {assignments.length === 0 ? (
        <EmptyState
          title={t("judge.dashboard.empty", { defaultValue: "No assignments yet" })}
          description={t("judge.dashboard.emptyDescription", {
            defaultValue: "You will be notified when a new idea is assigned to you.",
          })}
        />
      ) : (
        <DataTable<Idea>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={assignments}
          pagination={{ pageSize: 10 }}
        />
      )}
    </Card>
  );
};

export default JudgeDashboardPage;
