import { useState } from "react";
import { Button, Card, Space, Spin, Alert, Table, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useAdminJudges } from "../../service/hooks";
import type { Judge } from "../../types/domain";
import JudgeEditModal from "./JudgeEditModal";

const JudgesListPage = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useAdminJudges({ page: 1, pageSize: 100 });
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : t("admin.judges.error", { defaultValue: "Failed to load judges" });
    return (
      <Card>
        <Alert type="error" message={message} />
      </Card>
    );
  }

  const judges = data?.items ?? [];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card>
        <Button type="primary" onClick={() => setModalOpen(true)}>
          {t("admin.judges.add", { defaultValue: "Add judge" })}
        </Button>
      </Card>

      <Card>
        <Table<Judge>
          rowKey={(record) => String(record.id)}
          dataSource={judges}
          columns={[
            {
              title: t("admin.judges.name", { defaultValue: "Name" }),
              dataIndex: ["user", "name"],
              key: "name",
              render: (_: string, record) => record.user?.name || record.user?.email || record.id,
            },
            {
              title: t("admin.judges.email", { defaultValue: "Email" }),
              dataIndex: ["user", "email"],
              key: "email",
            },
            {
              title: t("admin.judges.expertise", { defaultValue: "Expertise" }),
              dataIndex: "expertise",
              key: "expertise",
              render: (expertise?: string[]) => (
                <Space wrap>{(expertise ?? []).map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
              ),
            },
            {
              title: t("admin.judges.status", { defaultValue: "Status" }),
              dataIndex: "active",
              key: "active",
              render: (active?: boolean) => (active === false ? t("common.inactive", { defaultValue: "Inactive" }) : t("common.active", { defaultValue: "Active" })),
            },
          ]}
        />
      </Card>

      <JudgeEditModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Space>
  );
};

export default JudgesListPage;
