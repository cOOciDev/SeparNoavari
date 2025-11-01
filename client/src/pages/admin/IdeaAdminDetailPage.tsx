import { useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Tabs,
  Spin,
  Alert,
  Descriptions,
  Button,
  Table,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { useTranslation } from "react-i18next";
import {
  useIdea,
  useIdeaAssignments,
  useFinalSummary,
  useUploadFinalSummary,
  useIdeaReviews,
} from "../../service/hooks";
import type { ColumnsType } from "antd/es/table";
import IdeaFilesList from "../../components/ideas/IdeaFilesList";
import AssignmentModal from "../../components/judges/AssignmentModal";
import type { Assignment, ReviewScores } from "../../types/domain";
import {
  getEvaluationConstraints,
  isFileTooLarge,
  isAllowedEvaluationType,
} from "../../utils/evaluationFiles";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "default",
  IN_PROGRESS: "blue",
  SUBMITTED: "purple",
  REVIEWED: "green",
  LOCKED: "red",
};

const EVAL_CONSTRAINTS = getEvaluationConstraints();
const SUMMARY_ACCEPT = EVAL_CONSTRAINTS.allowPdf ? ".docx,.pdf" : ".docx";

const IdeaAdminDetailPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data, isLoading, error } = useIdea(id);
  const idea = data?.idea;
  const assignedCount = idea?.assignedJudges?.length ?? 0;
  const [assignOpen, setAssignOpen] = useState(false);
  const assignmentsQuery = useIdeaAssignments(idea?.id);
  const finalSummaryQuery = useFinalSummary(idea?.id);
  const ideaReviewsQuery = useIdeaReviews(idea?.id);
  const uploadSummary = useUploadFinalSummary();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const assignments = assignmentsQuery.data?.assignments ?? [];
  const finalSummary = finalSummaryQuery.data;
  const reviewCriteria = ideaReviewsQuery.data?.criteria ?? [];
  const reviews = ideaReviewsQuery.data?.reviews ?? [];
  const scoreSummary = idea?.scoreSummary;

  type ReviewRow = {
    key: string;
    judgeName: string;
    judgeEmail?: string;
    scores: ReviewScores;
    comment?: string;
    submittedAt?: string;
    average: number | null;
  };

  const reviewRows: ReviewRow[] = useMemo(() => {
    return reviews.map((review) => {
      const judgeUser = review.judge?.user;
      const judgeName =
        judgeUser?.name || judgeUser?.email || review.judge?.id || t("admin.ideaDetail.unknownJudge", { defaultValue: "Unknown judge" });
      const judgeEmail = judgeUser?.email;
      const scores = (review.scores ?? {}) as ReviewScores;
      const numericValues = reviewCriteria
        .map((criterion) => {
          const value = scores?.[criterion.id];
          return typeof value === "number" ? value : null;
        })
        .filter((value): value is number => value !== null);
      const average =
        numericValues.length > 0
          ? Number(
              (numericValues.reduce((acc, value) => acc + value, 0) /
                numericValues.length).toFixed(2)
            )
          : null;
      return {
        key: review.id,
        judgeName,
        judgeEmail,
        scores,
        comment: review.comment,
        submittedAt: review.submittedAt,
        average,
      };
    });
  }, [reviews, reviewCriteria, t]);

  const reviewColumns: ColumnsType<ReviewRow> = useMemo(() => {
    const columns: ColumnsType<ReviewRow> = [
      {
        title: t("admin.ideaDetail.reviewJudge", { defaultValue: "Judge" }),
        key: "judge",
        render: (_value, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{record.judgeName}</Typography.Text>
            {record.judgeEmail ? (
              <Typography.Text type="secondary">{record.judgeEmail}</Typography.Text>
            ) : null}
          </Space>
        ),
      },
    ];

    reviewCriteria.forEach((criterion) => {
      columns.push({
        title: criterion.label,
        key: criterion.id,
        render: (_value, record) => {
          const value = record.scores?.[criterion.id];
          return typeof value === "number" ? value.toFixed(1) : "-";
        },
      });
    });

    columns.push(
      {
        title: t("admin.ideaDetail.reviewAverage", { defaultValue: "Average" }),
        key: "average",
        render: (_value, record) =>
          record.average !== null && record.average !== undefined
            ? record.average.toFixed(2)
            : "-",
      },
      {
        title: t("admin.ideaDetail.reviewSubmitted", { defaultValue: "Submitted" }),
        key: "submittedAt",
        render: (_value, record) =>
          record.submittedAt
            ? new Date(record.submittedAt).toLocaleString()
            : "-",
      },
      {
        title: t("admin.ideaDetail.reviewComment", { defaultValue: "Comment" }),
        dataIndex: "comment",
        key: "comment",
        render: (value: string | undefined) =>
          value && value.trim() ? value : "-",
      }
    );

    return columns;
  }, [reviewCriteria, t]);

  const criteriaLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    reviewCriteria.forEach((criterion) => {
      map.set(criterion.id, criterion.label);
    });
    return map;
  }, [reviewCriteria]);

  const handleSummaryPick = () => {
    fileInputRef.current?.click();
  };

  const handleSummaryChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !idea?.id) {
      return;
    }
    if (isFileTooLarge(file.size, EVAL_CONSTRAINTS)) {
      message.error(
        t("admin.assignments.fileTooLarge", {
          defaultValue: "File exceeds {{mb}}MB limit.",
          mb: EVAL_CONSTRAINTS.maxFileMb,
        })
      );
      return;
    }
    if (!isAllowedEvaluationType(file.name, EVAL_CONSTRAINTS)) {
      message.error(
        t("admin.assignments.invalidType", {
          defaultValue: EVAL_CONSTRAINTS.allowPdf
            ? "Upload DOCX or PDF"
            : "Upload DOCX files only",
        })
      );
      return;
    }
    try {
      await uploadSummary.mutateAsync({ ideaId: idea.id, file });
      message.success(
        t("admin.assignments.finalSummaryUploaded", {
          defaultValue: "Final summary saved.",
        })
      );
    } catch (err: any) {
      message.error(err?.message || t("admin.assignments.error", { defaultValue: "Operation failed" }));
    }
  };

  const assignmentColumns = useMemo(
    () => [
      {
        title: t("admin.assignments.table.judge", { defaultValue: "Judge" }),
        dataIndex: "judge",
        key: "judge",
        render: (_: unknown, record: Assignment) =>
          record.judge?.user?.name || record.judge?.user?.email || record.judge?.id,
      },
      {
        title: t("admin.assignments.table.status", { defaultValue: "Status" }),
        dataIndex: "status",
        key: "status",
        render: (value: Assignment["status"]) => (
          <Tag color={STATUS_COLORS[value] || "default"}>{value}</Tag>
        ),
      },
      {
        title: t("admin.assignments.table.submission", { defaultValue: "Judge file" }),
        dataIndex: "submission",
        key: "submission",
        render: (_: unknown, record: Assignment) => {
          if (!record.submission) {
            return t("admin.assignments.table.noSubmission", { defaultValue: "Not uploaded" });
          }
          return (
            <Space direction="vertical" size={2}>
              <Typography.Text type="secondary">
                v{record.submission.version} � {new Date(record.submission.uploadedAt).toLocaleString()}
              </Typography.Text>
              <Button
                type="link"
                size="small"
                href={record.submission.downloadUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t("admin.assignments.table.download", { defaultValue: "Download" })}
              </Button>
            </Space>
          );
        },
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
    const messageText =
      error instanceof Error ? error.message : t("admin.ideaDetail.error", { defaultValue: "Failed to load idea" });
    return (
      <Card>
        <Alert type="error" message={messageText} />
      </Card>
    );
  }

  if (!idea) {
    return (
      <Card>
        <Alert type="info" message={t("admin.ideaDetail.notFound", { defaultValue: "Idea not found" })} />
      </Card>
    );
  }

  return (
    <Card
      title={idea.title}
      extra={
        <Button type="primary" onClick={() => setAssignOpen(true)}>
          {t("admin.ideas.assign", { defaultValue: "Assign" })}
        </Button>
      }
    >
      <Tabs
        defaultActiveKey="details"
        items={[
          {
            key: "details",
            label: t("admin.ideaDetail.tabs.details", { defaultValue: "Details" }),
            children: (
              <Descriptions column={1} bordered>
                <Descriptions.Item label={t("ideas.detail.category", { defaultValue: "Category" })}>
                  {idea.category || "-"}
                </Descriptions.Item>
                <Descriptions.Item label={t("ideas.detail.status", { defaultValue: "Status" })}>
                  {idea.status}
                </Descriptions.Item>
                <Descriptions.Item
                  label={t("admin.ideas.assignedJudges", { defaultValue: "Assigned judges" })}
                >
                  <Tag color={assignedCount > 0 ? "blue" : "default"}>
                    {t("admin.ideas.assignedCountLabel", {
                      defaultValue: "{{count}} assigned",
                      count: assignedCount,
                    })}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t("ideas.detail.summary", { defaultValue: "Summary" })}>
                  {idea.summary || t("ideas.detail.noSummary", { defaultValue: "No summary provided." })}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: "files",
            label: t("admin.ideaDetail.tabs.files", { defaultValue: "Files" }),
            children: <IdeaFilesList files={idea.files ?? []} />,
          },
          {
            key: "assignments",
            label: t("admin.ideaDetail.tabs.assignments", { defaultValue: "Assignments" }),
            children: (
              <Space direction="vertical" size={24} style={{ width: "100%" }}>
                <Space>
                  <Button type="primary" onClick={() => setAssignOpen(true)}>
                    {t("admin.assignments.manage", { defaultValue: "Manage judges" })}
                  </Button>
                  {assignmentsQuery.isLoading ? <Spin size="small" /> : null}
                </Space>
                {assignmentsQuery.error ? (
                  <Alert
                    type="error"
                    showIcon
                    message={
                      assignmentsQuery.error instanceof Error
                        ? assignmentsQuery.error.message
                        : t("admin.assignments.error", { defaultValue: "Failed to load assignments." })
                    }
                  />
                ) : null}
                <Table<Assignment>
                  rowKey={(record) => record.id}
                  columns={assignmentColumns}
                  dataSource={assignments}
                  pagination={false}
                  locale={{
                    emptyText: t("admin.assignments.table.empty", {
                      defaultValue: "No assignments yet.",
                    }),
                  }}
                />
                <Card title={t("admin.assignments.finalSummary", { defaultValue: "Final summary" })}>
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    {finalSummaryQuery.error ? (
                      <Alert
                        type="error"
                        showIcon
                        message={
                          finalSummaryQuery.error instanceof Error
                            ? finalSummaryQuery.error.message
                            : t("admin.assignments.error", { defaultValue: "Failed to load final summary." })
                        }
                      />
                    ) : null}
                    {finalSummary ? (
                      <Space direction="vertical" size={4}>
                        <Typography.Text>{finalSummary.filename}</Typography.Text>
                        <Typography.Text type="secondary">
                          {new Date(finalSummary.uploadedAt).toLocaleString()} � {Math.round(finalSummary.size / 1024)} KB
                        </Typography.Text>
                        {finalSummary.downloadUrl ? (
                          <Button
                            type="link"
                            href={finalSummary.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("admin.assignments.table.download", { defaultValue: "Download" })}
                          </Button>
                        ) : null}
                      </Space>
                    ) : (
                      <Alert
                        type="info"
                        showIcon
                        message={t("admin.assignments.noFinalSummary", {
                          defaultValue: "No final summary uploaded yet.",
                        })}
                      />
                    )}
                    <div>
                      <input
                        type="file"
                        accept={SUMMARY_ACCEPT}
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleSummaryChange}
                      />
                      <Button onClick={handleSummaryPick} loading={uploadSummary.isPending}>
                        {t("admin.assignments.uploadFinalSummary", {
                          defaultValue: EVAL_CONSTRAINTS.allowPdf
                            ? "Upload DOCX/PDF"
                            : "Upload DOCX",
                        })}
                      </Button>
                    </div>
                  </Space>
                </Card>
              </Space>
            ),
          },
          {
            key: "reviews",
            label: t("admin.ideaDetail.tabs.reviews", { defaultValue: "Reviews" }),
            children: (
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Space wrap>
                  <Tag color="processing">
                    {t("admin.ideaDetail.totalReviewsTag", {
                      defaultValue: "Total reviews: {{count}}",
                      count: scoreSummary?.totalReviews ?? 0,
                    })}
                  </Tag>
                  {typeof scoreSummary?.average === "number" ? (
                    <Tag color="gold">
                      {t("admin.ideaDetail.overallAverageTag", {
                        defaultValue: "Average: {{value}} / 10",
                        value: scoreSummary.average.toFixed(2),
                      })}
                    </Tag>
                  ) : null}
                </Space>
                {scoreSummary?.criteria && Object.keys(scoreSummary.criteria).length > 0 ? (
                  <Space wrap>
                    {Object.entries(scoreSummary.criteria).map(([criterionId, value]) => {
                      if (typeof value !== "number") return null;
                      const label = criteriaLabelMap.get(criterionId) ?? criterionId;
                      return (
                        <Tag key={criterionId} color="blue">
                          {`${label}: ${value.toFixed(2)}`}
                        </Tag>
                      );
                    })}
                  </Space>
                ) : null}
                {ideaReviewsQuery.isLoading ? <Spin /> : null}
                {ideaReviewsQuery.error ? (
                  <Alert
                    type="error"
                    showIcon
                    message={
                      ideaReviewsQuery.error instanceof Error
                        ? ideaReviewsQuery.error.message
                        : t("admin.ideaDetail.reviewsError", { defaultValue: "Failed to load reviews." })
                    }
                  />
                ) : null}
                {!ideaReviewsQuery.isLoading &&
                !ideaReviewsQuery.error &&
                reviewRows.length === 0 ? (
                  <Alert
                    type="info"
                    message={t("admin.ideaDetail.noReviews", {
                      defaultValue: "No reviews submitted yet.",
                    })}
                  />
                ) : null}
                {!ideaReviewsQuery.isLoading &&
                !ideaReviewsQuery.error &&
                reviewRows.length > 0 ? (
                  <Table<ReviewRow>
                    rowKey={(record) => record.key}
                    dataSource={reviewRows}
                    columns={reviewColumns}
                    pagination={false}
                    scroll={{ x: true }}
                  />
                ) : null}
              </Space>
            ),
          },
        ]}
      />
      <AssignmentModal open={assignOpen} onClose={() => setAssignOpen(false)} ideaId={idea.id} />
    </Card>
  );
};

export default IdeaAdminDetailPage;
