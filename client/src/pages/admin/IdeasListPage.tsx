import { useMemo, useState } from "react";
import { Card, Space, Input, Select, Spin, Alert, Button } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import EmptyState from "../../components/common/EmptyState";
import AssignmentModal from "../../components/judges/AssignmentModal";
import { useAdminIdeas } from "../../service/hooks";
import type { Idea, IdeaStatus } from "../../types/domain";

const STATUS_VALUES: IdeaStatus[] = ["SUBMITTED", "UNDER_REVIEW", "DONE", "REJECTED"];

const IdeasListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<IdeaStatus | "ALL">("ALL");
  const [category, setCategory] = useState<string | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [assignIdeaId, setAssignIdeaId] = useState<string | null>(null);

  const ideasQuery = useAdminIdeas({
    status: status === "ALL" ? undefined : status,
    category: category === "ALL" ? undefined : category,
    q: query || undefined,
    page,
    pageSize,
  });

  const dataSource = ideasQuery.data?.items ?? [];
  const total = ideasQuery.data?.total ?? 0;

  const statusChoices = useMemo(
    () =>
      STATUS_VALUES.map((value) => ({
        value,
        label: t(`ideas.status.${value.toLowerCase()}`, { defaultValue: value }),
      })),
    [t]
  );

  const categoryChoices = useMemo(() => {
    const distinct = Array.from(new Set(dataSource.map((idea) => idea.category).filter(Boolean)));
    return distinct.map((cat) => ({ value: cat, label: cat }));
  }, [dataSource]);

  const columns = useMemo(
    () => [
      {
        title: t("admin.ideas.title", { defaultValue: "Title" }),
        dataIndex: "title",
        key: "title",
      },
      {
        title: t("admin.ideas.submitter", { defaultValue: "Submitter" }),
        dataIndex: "submitterName",
        key: "submitterName",
        render: (_: unknown, record: Idea) => record.submitterName || record.contactEmail,
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
      {
        title: t("admin.ideas.submittedAt", { defaultValue: "Submitted" }),
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value: string) => new Date(value).toLocaleString(),
      },
      {
        title: t("admin.ideas.actions", { defaultValue: "Actions" }),
        key: "actions",
        render: (_: unknown, record: Idea) => (
          <Space>
            <Button size="small" onClick={() => navigate(`/admin/ideas/${record.id}`)}>
              {t("common.view", { defaultValue: "View" })}
            </Button>
            <Button size="small" onClick={() => setAssignIdeaId(String(record.id))}>
              {t("admin.ideas.assign", { defaultValue: "Assign" })}
            </Button>
          </Space>
        ),
      },
    ],
    [navigate, t]
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
        : t("admin.ideas.error", { defaultValue: "Failed to load ideas" });
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
          <Input.Search
            placeholder={t("admin.ideas.search", { defaultValue: "Search by title or submitter" })}
            value={query}
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
            style={{ minWidth: 240 }}
          />
          <Select
            value={status}
            style={{ minWidth: 180 }}
            onChange={(value) => {
              setPage(1);
              setStatus(value as IdeaStatus | "ALL");
            }}
            options={[{ value: "ALL", label: t("ideas.filters.allStatuses", { defaultValue: "All statuses" }) }, ...statusChoices]}
          />
          <Select
            value={category}
            style={{ minWidth: 180 }}
            onChange={(value) => {
              setPage(1);
              setCategory(value as string | "ALL");
            }}
            options={[{ value: "ALL", label: t("ideas.filters.allCategories", { defaultValue: "All categories" }) }, ...categoryChoices]}
          />
        </Space>
      </Card>

      <Card>
        {dataSource.length === 0 ? (
          <EmptyState
            title={t("admin.ideas.empty", { defaultValue: "No ideas match your filters" })}
            description={t("admin.ideas.adjustFilters", { defaultValue: "Try changing the filters or search term." })}
          />
        ) : (
          <DataTable<Idea>
            rowKey={(record) => record.id}
            columns={columns}
            dataSource={dataSource}
            pagination={{
              total,
              current: page,
              pageSize,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              },
            }}
          />
        )}
      </Card>

      <AssignmentModal
        open={assignIdeaId !== null}
        ideaId={assignIdeaId ?? undefined}
        onClose={() => setAssignIdeaId(null)}
      />
    </Space>
  );
};

export default IdeasListPage;
