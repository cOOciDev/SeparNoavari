import { Form, Input, InputNumber, Button, Space, Alert } from "antd";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useSubmitReview } from "../../service/hooks";

export type ReviewFormValues = {
  novelty: number;
  feasibility: number;
  impact: number;
  comment?: string;
};

type ReviewFormProps = {
  ideaId: string;
};

const ReviewForm = ({ ideaId }: ReviewFormProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<ReviewFormValues>();
  const { mutateAsync, isPending, error } = useSubmitReview();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (values: ReviewFormValues) => {
    await mutateAsync({
      ideaId,
      scores: {
        novelty: values.novelty,
        feasibility: values.feasibility,
        impact: values.impact,
      },
      comment: values.comment,
    });
    setSubmitted(true);
  };

  return (
    <div style={{ maxWidth: 520 }}>
      {error ? (
        <Alert
          type="error"
          message={
            error instanceof Error
              ? error.message
              : t("judge.review.error", { defaultValue: "Failed to submit review" })
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {submitted ? (
        <Alert
          type="success"
          message={t("judge.review.success", { defaultValue: "Review submitted successfully" })}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <Form
        layout="vertical"
        form={form}
        initialValues={{ novelty: 50, feasibility: 50, impact: 50 }}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="novelty"
          label={t("judge.review.novelty", { defaultValue: "Novelty" })}
          rules={[{ required: true, message: t("judge.review.required", { defaultValue: "Required" }) }]}
        >
          <InputNumber min={0} max={100} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="feasibility"
          label={t("judge.review.feasibility", { defaultValue: "Feasibility" })}
          rules={[{ required: true, message: t("judge.review.required", { defaultValue: "Required" }) }]}
        >
          <InputNumber min={0} max={100} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="impact"
          label={t("judge.review.impact", { defaultValue: "Impact" })}
          rules={[{ required: true, message: t("judge.review.required", { defaultValue: "Required" }) }]}
        >
          <InputNumber min={0} max={100} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="comment" label={t("judge.review.comment", { defaultValue: "Comment" })}>
          <Input.TextArea rows={4} placeholder={t("judge.review.commentPlaceholder", { defaultValue: "Optional notes" })} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={isPending}>
              {t("judge.review.submit", { defaultValue: "Submit review" })}
            </Button>
            <Button onClick={() => form.resetFields()} disabled={isPending}>
              {t("common.reset", { defaultValue: "Reset" })}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ReviewForm;
