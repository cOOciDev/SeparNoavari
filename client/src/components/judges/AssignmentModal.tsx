/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Alert, Form, InputNumber, Modal, Select, Typography } from "antd";
import JudgeSelector from "./JudgeSelector";
import { useAdminJudges, useBulkAssign } from "../../service/hooks";

export type AssignmentModalProps = {
  open: boolean;
  onClose: () => void;
  ideaId?: string;
  ideaIds?: string[];
  defaultCount?: number;
};

const AssignmentModal = ({ open, onClose, ideaId, ideaIds, defaultCount = 3 }: AssignmentModalProps) => {
  const [form] = Form.useForm();
  const { mutateAsync, isPending } = useBulkAssign();
  const [error, setError] = useState<string | null>(null);
  const judgesQuery = useAdminJudges();

  const handleOk = async () => {
    try {
      setError(null);
      const values = (await form.validateFields()) as {
        judges: string[];
        count: number;
        strategy: "AUTO" | "MANUAL";
      };
      const payload = {
        ideaId,
        ideaIds,
        judgeIds: values.strategy === "MANUAL" ? values.judges : undefined,
        countPerIdea: values.count,
        strategy: values.strategy,
      } as {
        ideaId?: string;
        ideaIds?: string[];
        judgeIds?: string[];
        countPerIdea: number;
        strategy: "AUTO" | "MANUAL";
      };

      await mutateAsync(payload);
      onClose();
      form.resetFields();
    } catch (err: any) {
      if (err?.code === "CONFLICT" || err?.response?.status === 409) {
        setError(err?.message || err?.code || "Conflict");
        return;
      }
      if (err?.message) {
        setError(err.message);
      }
    }
  };

  return (
    <Modal
      open={open}
      title="Assign Judges"
      okText="Assign"
      confirmLoading={isPending}
      onCancel={() => {
        setError(null);
        onClose();
      }}
      onOk={handleOk}
      destroyOnClose
    >
      {error ? (
        <Alert type="error" message={error} style={{ marginBottom: 16 }} />
      ) : null}
      <Typography.Paragraph type="secondary">
        Select judges to review this idea. You can choose manual judges or leave it to automatic assignment strategy.
      </Typography.Paragraph>
      <Form
        layout="vertical"
        form={form}
        initialValues={{
          judges: [],
          count: defaultCount,
          strategy: "AUTO",
        }}
      >
        <Form.Item name="strategy" label="Strategy">
          <Select
            options={[
              { value: "AUTO", label: "Auto" },
              { value: "MANUAL", label: "Manual" },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="judges"
          label="Judges"
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value: string[]) {
                if (getFieldValue("strategy") === "MANUAL" && (!value || value.length === 0)) {
                  return Promise.reject(new Error("Select at least one judge"));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <JudgeSelector disabled={judgesQuery.isLoading} />
        </Form.Item>
        <Form.Item
          name="count"
          label="Judges per idea"
          rules={[{ required: true, message: "Enter judge count" }]}
        >
          <InputNumber min={1} max={10} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssignmentModal;
