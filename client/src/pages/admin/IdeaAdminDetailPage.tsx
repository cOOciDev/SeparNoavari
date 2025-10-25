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
} from "../../service/hooks";
import IdeaFilesList from "../../components/ideas/IdeaFilesList";
import AssignmentModal from "../../components/judges/AssignmentModal";
import type { Assignment } from "../../types/domain";
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
  const [assignOpen, setAssignOpen] = useState(false);
  const assignmentsQuery = useIdeaAssignments(idea?.id);
  const finalSummaryQuery = useFinalSummary(idea?.id);
  const uploadSummary = useUploadFinalSummary();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const assignments = assignmentsQuery.data?.assignments ?? [];
  const finalSummary = finalSummaryQuery.data;

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
                v{record.submission.version} · {new Date(record.submission.uploadedAt).toLocaleString()}
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
                          {new Date(finalSummary.uploadedAt).toLocaleString()} · {Math.round(finalSummary.size / 1024)} KB
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
              <Alert
                type="info"
                message={t("admin.ideaDetail.reviewsDesc", {
                  defaultValue: "Reviews will be displayed after judges submit them.",
                })}
              />
            ),
          },
        ]}
      />
      <AssignmentModal open={assignOpen} onClose={() => setAssignOpen(false)} ideaId={idea.id} />
    </Card>
  );
};

export default IdeaAdminDetailPage;
