import { useMemo, useState } from "react";
import { Card, Select, Space, Spin, Alert, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import EmptyState from "../../components/common/EmptyState";
import { useMyIdeas } from "../../service/hooks";
import type { Idea, IdeaStatus } from "../../types/domain";
import { useAuth } from "../../contexts/AuthProvider";

const STATUS_VALUES: IdeaStatus[] = ["SUBMITTED", "UNDER_REVIEW", "DONE", "REJECTED"];

const MyIdeasPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, error } = useMyIdeas(isAuthenticated);
  const [status, setStatus] = useState<IdeaStatus | "ALL">("ALL");
  const [category, setCategory] = useState<string | "ALL">("ALL");

  const ideas = data?.items ?? [];

  const statusChoices = useMemo(() => {
    return STATUS_VALUES.map((statusValue) => ({
      value: statusValue,
      label: t(`ideas.status.${statusValue.toLowerCase()}` , { defaultValue: statusValue }),
    }));
  }, [t]);

  const categoryChoices = useMemo(() => {
    const distinct = Array.from(new Set(ideas.map((idea) => idea.category).filter(Boolean)));
    return distinct.map((cat) => ({ value: cat, label: cat }));
  }, [ideas]);

  const filtered = useMemo(() => {
    return ideas.filter((idea) => {
      const statusMatch = status === "ALL" || idea.status === status;
      const categoryMatch = category === "ALL" || idea.category === category;
      return statusMatch && categoryMatch;
    });
  }, [ideas, status, category]);

  const columns = useMemo(
    () => [
      {
        title: t("ideas.table.title", { defaultValue: "Title" }),
        dataIndex: "title",
        key: "title",
        render: (_: string, record: Idea) => <Link to={`/ideas/${record.id}`}>{record.title}</Link>,
      },
      {
        title: t("ideas.table.status", { defaultValue: "Status" }),
        dataIndex: "status",
        key: "status",
        render: (value: IdeaStatus) => <Tag>{value}</Tag>,
      },
      {
        title: t("ideas.table.category", { defaultValue: "Category" }),
        dataIndex: "category",
        key: "category",
      },
      {
        title: t("ideas.table.files", { defaultValue: "Files" }),
        dataIndex: "files",
        key: "files",
        render: (files: Idea["files"]) => files?.length ?? 0,
      },
      {
        title: t("ideas.table.submittedAt", { defaultValue: "Submitted" }),
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
      error instanceof Error ? error.message : t("ideas.table.error", { defaultValue: "Failed to load" });
    return (
      <Card>
        <Alert type="error" message={message} />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card>
        <Space wrap>
          <Select
            value={status}
            style={{ minWidth: 180 }}
            onChange={(value) => setStatus(value as IdeaStatus | "ALL")}
            options={[{ value: "ALL", label: t("ideas.filters.allStatuses", { defaultValue: "All statuses" }) }, ...statusChoices]}
          />
          <Select
            value={category}
            style={{ minWidth: 180 }}
            onChange={(value) => setCategory(value as string | "ALL")}
            options={[{ value: "ALL", label: t("ideas.filters.allCategories", { defaultValue: "All categories" }) }, ...categoryChoices]}
          />
        </Space>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title={t("ideas.empty.title", { defaultValue: "No ideas yet" })}
            description={t("ideas.empty.description", {
              defaultValue: "Submit your first idea to see it listed here.",
            })}
          />
        ) : (
          <DataTable<Idea>
            rowKey={(record) => record.id}
            dataSource={filtered}
            columns={columns}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
    </Space>
  );
};

export default MyIdeasPage;
