import { useMemo, useState } from "react";
import { Card, Space, Select, Button, Spin, Alert, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import AssignmentModal from "../../components/judges/AssignmentModal";
import EmptyState from "../../components/common/EmptyState";
import { useAdminIdeas } from "../../service/hooks";
import type { Idea, IdeaStatus } from "../../types/domain";

const STATUS_COLORS: Record<IdeaStatus, string> = {
  SUBMITTED: "default",
  UNDER_REVIEW: "blue",
  DONE: "green",
  REJECTED: "red",
};

const STATUS_VALUES: IdeaStatus[] = ["SUBMITTED", "UNDER_REVIEW", "DONE", "REJECTED"];

const AssignmentsPage = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<IdeaStatus | "ALL">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [focusedIdeaId, setFocusedIdeaId] = useState<string | undefined>();
  const ideasQuery = useAdminIdeas({ status: status === "ALL" ? undefined : status, page: 1, pageSize: 50 });

  const ideas = ideasQuery.data?.items ?? [];

  const statusChoices = useMemo(
    () =>
      STATUS_VALUES.map((value) => ({
        value,
        label: t(`ideas.status.${value.toLowerCase()}`, { defaultValue: value }),
      })),
    [t]
  );

  const columns = useMemo(
    () => [
      {
        title: t("admin.ideas.title", { defaultValue: "Title" }),
        dataIndex: "title",
        key: "title",
      },
      {
        title: t("admin.ideas.status", { defaultValue: "Status" }),
        dataIndex: "status",
        key: "status",
        render: (value: IdeaStatus) => (
          <Tag color={STATUS_COLORS[value] || "default"}>
            {t(`ideas.status.${value.toLowerCase()}`, { defaultValue: value })}
          </Tag>
        ),
      },
      {
        title: t("admin.assignments.summaryColumn", {
          defaultValue: "Assigned judges",
        }),
        key: "assignedJudges",
        render: (_: unknown, record: Idea) => {
          const assignedCount = record.assignedJudges?.length ?? 0;
          return (
            <Tag color={assignedCount > 0 ? "blue" : "default"}>
              {t("admin.assignments.assignedCount", {
                defaultValue: "{{count}} assigned",
                count: assignedCount,
              })}
            </Tag>
          );
        },
      },
      {
        title: t("admin.ideas.category", { defaultValue: "Category" }),
        dataIndex: "category",
        key: "category",
      },
      {
        title: t("common.actions", { defaultValue: "Actions" }),
        key: "actions",
        render: (_: unknown, record: Idea) => (
          <Space>
            <Button
              type="primary"
              onClick={() => {
                setFocusedIdeaId(record.id);
                setModalOpen(true);
              }}
            >
              {t("admin.assignments.manage", { defaultValue: "Manage judges" })}
            </Button>
            <Link to={`/admin/ideas/${record.id}`}>
              {t("admin.assignments.viewIdea", { defaultValue: "View idea" })}
            </Link>
          </Space>
        ),
      },
    ],
    [t]
  );

  if (ideasQuery.isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (ideasQuery.error) {
    const message =
      ideasQuery.error instanceof Error
        ? ideasQuery.error.message
        : t("admin.assignments.error", { defaultValue: "Failed to load" });
    return (
      <Card>
        <Alert type="error" message={message} />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Space wrap>
            <Select
              value={status}
              style={{ minWidth: 200 }}
              onChange={(value) => setStatus(value as IdeaStatus | "ALL")}
              options={[{ value: "ALL", label: t("ideas.filters.allStatuses", { defaultValue: "All statuses" }) }, ...statusChoices]}
            />
          </Space>
        </Space>
      </Card>

      <Card>
        {ideas.length === 0 ? (
          <EmptyState
            title={t("admin.assignments.empty", { defaultValue: "No ideas available" })}
            description={t("admin.assignments.emptyDesc", {
              defaultValue: "Adjust the filters to find ideas ready for review.",
            })}
          />
        ) : (
          <DataTable<Idea>
            rowKey={(record) => record.id}
            dataSource={ideas}
            columns={columns}
            pagination={false}
          />
        )}
      </Card>

      <AssignmentModal open={modalOpen} onClose={() => setModalOpen(false)} ideaId={focusedIdeaId} />
    </Space>
  );
};

export default AssignmentsPage;
