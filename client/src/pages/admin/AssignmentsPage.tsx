import { useMemo, useState } from "react";
import { Card, Space, Select, Button, Spin, Alert, message } from "antd";
import { useTranslation } from "react-i18next";
import DataTable from "../../components/common/DataTable";
import AssignmentModal from "../../components/judges/AssignmentModal";
import EmptyState from "../../components/common/EmptyState";
import { useAdminIdeas, useBulkAssign } from "../../service/hooks";
import type { Idea, IdeaStatus } from "../../types/domain";

const STATUS_VALUES: IdeaStatus[] = ["SUBMITTED", "UNDER_REVIEW", "DONE", "REJECTED"];

const AssignmentsPage = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<IdeaStatus | "ALL">("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const ideasQuery = useAdminIdeas({ status: status === "ALL" ? undefined : status, page: 1, pageSize: 50 });
  const bulkAssign = useBulkAssign();

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
      },
      {
        title: t("admin.ideas.category", { defaultValue: "Category" }),
        dataIndex: "category",
        key: "category",
      },
    ],
    [t]
  );

  const handleBulkAuto = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkAssign.mutateAsync({ ideaIds: selectedIds, strategy: "AUTO", countPerIdea: 3 });
      message.success(t("admin.assignments.autoSuccess", { defaultValue: "Assignments created" }));
      setSelectedIds([]);
    } catch (err: any) {
      if (err?.code === "CONFLICT" || err?.response?.status === 409) {
        message.error(t("admin.assignments.conflict", { defaultValue: "Some assignments already exist" }));
      } else {
        message.error(err?.message || t("admin.assignments.error", { defaultValue: "Failed to assign" }));
      }
    }
  };

  if (ideasQuery.isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (ideasQuery.error) {
    const messageText =
      ideasQuery.error instanceof Error
        ? ideasQuery.error.message
        : t("admin.assignments.error", { defaultValue: "Failed to load" });
    return (
      <Card>
        <Alert type="error" message={messageText} />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card>
        <Space wrap>
          <Select
            value={status}
            style={{ minWidth: 200 }}
            onChange={(value) => setStatus(value as IdeaStatus | "ALL")}
            options={[{ value: "ALL", label: t("ideas.filters.allStatuses", { defaultValue: "All statuses" }) }, ...statusChoices]}
          />
          <Button
            type="primary"
            disabled={selectedIds.length === 0}
            onClick={() => setModalOpen(true)}
          >
            {t("admin.assignments.manual", { defaultValue: "Assign manually" })}
          </Button>
          <Button
            onClick={handleBulkAuto}
            loading={bulkAssign.isPending}
            disabled={selectedIds.length === 0}
          >
            {t("admin.assignments.auto", { defaultValue: "Assign automatically" })}
          </Button>
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
            rowSelection={{
              selectedRowKeys: selectedIds,
              onChange: (keys) => setSelectedIds(keys as string[]),
            }}
          />
        )}
      </Card>

      <AssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        ideaIds={selectedIds}
      />
    </Space>
  );
};

export default AssignmentsPage;
