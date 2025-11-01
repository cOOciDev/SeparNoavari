import { useState } from "react";
import { Button, Card, Space, Spin, Alert, Table, Tag, InputNumber, message } from "antd";
import { useTranslation } from "react-i18next";
import { useAdminJudges, useUpdateJudge } from "../../service/hooks";
import type { Judge } from "../../types/domain";
import JudgeEditModal from "./JudgeEditModal";

const JudgeCapacityEditor = ({ judge }: { judge: Judge }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<number | undefined>(
    typeof judge.capacity === "number" ? judge.capacity : undefined
  );
  const updateJudge = useUpdateJudge();

  const handleSave = async (nextValue: number | undefined) => {
    try {
      await updateJudge.mutateAsync({ id: judge.id, capacity: nextValue ?? null });
      setValue(nextValue);
      message.success(t("admin.judges.capacitySaved", { defaultValue: "Capacity updated" }));
    } catch (err: any) {
      message.error(err?.message || t("admin.judges.error", { defaultValue: "Update failed" }));
    }
  };

  return (
    <Space>
      <InputNumber
        min={1}
        value={value}
        onChange={(val) => setValue(typeof val === "number" ? val : undefined)}
        placeholder={t("admin.judges.unlimited", { defaultValue: "Unlimited" })}
        size="small"
      />
      <Button
        size="small"
        type="primary"
        onClick={() => handleSave(value)}
        loading={updateJudge.isPending}
        disabled={value === undefined && judge.capacity === undefined}
      >
        {t("common.save", { defaultValue: "Save" })}
      </Button>
      <Button
        size="small"
        onClick={() => handleSave(undefined)}
        loading={updateJudge.isPending}
      >
        8
      </Button>
    </Space>
  );
};

const JudgesListPage = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useAdminJudges({ page: 1, pageSize: 100 });
  const [modalOpen, setModalOpen] = useState(false);

  const getRowKey = (judge: Judge, index: number) => {
    const candidate = judge.id ?? judge.user?.id ?? judge.user?.email;
    return candidate ? String(candidate) : `judge-${index}`;
  };

  if (isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (error) {
    const messageText = error instanceof Error ? error.message : t("admin.judges.error", { defaultValue: "Failed to load judges" });
    return (
      <Card>
        <Alert type="error" message={messageText} />
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
<<<<<<< HEAD
          rowKey={(record, index) => getRowKey(record, index)}
=======
          rowKey={(record) => String(record.id)}
          // rowKey={(record) => String("judge-" + record.id)}
<<<<<<< Updated upstream
=======
>>>>>>> a582a459a026773c088d0a1851f4e2816ef5e273
>>>>>>> Stashed changes
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
            {
              title: t("admin.judges.capacity", { defaultValue: "Capacity" }),
              key: "capacity",
              render: (_: unknown, record) => <JudgeCapacityEditor judge={record} />,
            },
          ]}
        />
      </Card>

      <JudgeEditModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Space>
  );
};

export default JudgesListPage;
