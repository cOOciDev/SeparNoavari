import { Form, Input, InputNumber, Button, Space, Alert, Spin, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { useSubmitReview, useJudgeReviewCriteria } from "../../service/hooks";
import type { ReviewScores } from "../../types/domain";

type ReviewFormProps = {
  ideaId: string;
};

type ReviewFormValues = Record<string, number | string | undefined>;

const ReviewForm = ({ ideaId }: ReviewFormProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<ReviewFormValues>();
  const { mutateAsync, isPending, error } = useSubmitReview();
  const criteriaQuery = useJudgeReviewCriteria();
  const [submitted, setSubmitted] = useState(false);

  const criteria = useMemo(() => criteriaQuery.data ?? [], [criteriaQuery.data]);

  useEffect(() => {
    if (criteria.length > 0) {
      const defaultValues: ReviewFormValues = criteria.reduce(
        (acc, item) => ({ ...acc, [item.id]: 5 }),
        {}
      );
      form.setFieldsValue({ ...defaultValues, comment: form.getFieldValue("comment") });
    }
  }, [criteria, form]);

  const handleSubmit = async (values: ReviewFormValues) => {
    const { comment, ...rawScores } = values;
    const scores: ReviewScores = {};
    criteria.forEach((item) => {
      const rawValue = rawScores[item.id];
      scores[item.id] =
        typeof rawValue === "number"
          ? rawValue
          : Number.parseFloat(String(rawValue ?? 0)) || 0;
    });

    await mutateAsync({
      ideaId,
      scores,
      comment: typeof comment === "string" && comment.trim() ? comment : undefined,
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
      {criteriaQuery.isLoading ? (
        <Spin style={{ marginBottom: 16 }} />
      ) : null}
      {submitted ? (
        <Alert
          type="success"
          message={t("judge.review.success", { defaultValue: "Review submitted successfully" })}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {criteria.length > 0 ? (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          {t("judge.review.scaleHint", {
            defaultValue: "Score each criterion from 0 to 10. Half steps are allowed.",
          })}
        </Typography.Paragraph>
      ) : null}
      {criteria.length === 0 && !criteriaQuery.isLoading ? (
        <Alert
          type="warning"
          message={t("judge.review.noCriteria", {
            defaultValue: "No scoring criteria configured. Contact administrator.",
          })}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <Form layout="vertical" form={form} onFinish={handleSubmit} disabled={criteria.length === 0}>
        {criteria.map((criterion) => (
          <Form.Item
            key={criterion.id}
            name={criterion.id}
            label={
              <Typography.Text strong>
                {criterion.label}
              </Typography.Text>
            }
            rules={[
              {
                required: true,
                message: t("judge.review.required", { defaultValue: "Required" }),
              },
            ]}
          >
            <InputNumber min={0} max={10} step={0.5} style={{ width: "100%" }} />
          </Form.Item>
        ))}
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
