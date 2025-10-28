import { Modal, Form, Input, Select, Alert, InputNumber } from "antd";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useCreateJudge } from "../../service/hooks";

export type JudgeEditModalProps = {
  open: boolean;
  onClose: () => void;
};

const JudgeEditModal = ({ open, onClose }: JudgeEditModalProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<{ name?: string; email: string; password: string; expertise?: string[]; capacity?: number }>();
  const { mutateAsync, isPending, error } = useCreateJudge();
  const [submitted, setSubmitted] = useState(false);

  const handleOk = async () => {
    const values = await form.validateFields();
    await mutateAsync(values);
    setSubmitted(true);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={t("admin.judges.add", { defaultValue: "Add judge" })}
      open={open}
      onCancel={() => {
        setSubmitted(false);
        onClose();
      }}
      confirmLoading={isPending}
      onOk={handleOk}
      destroyOnHidden
    >
      {error ? (
        <Alert
          type="error"
          style={{ marginBottom: 16 }}
          message={
            error instanceof Error ? error.message : t("admin.judges.error", { defaultValue: "Failed to create judge" })
          }
        />
      ) : null}
      {submitted ? (
        <Alert
          type="success"
          style={{ marginBottom: 16 }}
          message={t("admin.judges.success", { defaultValue: "Judge created" })}
        />
      ) : null}
      <Form form={form} layout="vertical">
        
        <Form.Item name="name" label={t("auth.name", { defaultValue: "Name" })}>
          <Input autoComplete="name" />
        </Form.Item>
        <Form.Item
          name="email"
          label={t("auth.email", { defaultValue: "Email" })}
          rules={[
            { required: true, message: t("auth.errors.required", { defaultValue: "Email is required" }) },
            { type: "email", message: t("auth.errors.invalidEmail", { defaultValue: "Invalid email" }) },
          ]}
        >
          <Input autoComplete="email" />
        </Form.Item>
        <Form.Item
          name="password"
          label={t("auth.password", { defaultValue: "Password" })}
          rules={[
            { required: true, message: t("auth.errors.required", { defaultValue: "Password is required" }) },
            { min: 8, message: t("auth.errors.invalidPassword", { defaultValue: "Password must be at least 8 characters" }) },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="expertise" label={t("admin.judges.expertise", { defaultValue: "Expertise" })}>
          <Select mode="tags" tokenSeparators={[",", " "]} placeholder={t("admin.judges.expertisePlaceholder", { defaultValue: "Add expertise tags" })} />
        </Form.Item>
        <Form.Item
          name="capacity"
          label={t("admin.judges.capacity", { defaultValue: "Capacity" })}
          tooltip={t("admin.judges.capacityHint", { defaultValue: "Leave empty for unlimited" })}
        >
          <InputNumber min={1} style={{ width: "100%" }} placeholder={t("admin.judges.unlimited", { defaultValue: "Unlimited" })} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default JudgeEditModal;

