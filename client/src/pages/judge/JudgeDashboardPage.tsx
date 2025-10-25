import { useMemo } from "react";
import { Card, Spin, Alert, Tag, Table, Button, Upload, message } from "antd";
import type { UploadProps } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import EmptyState from "../../components/common/EmptyState";
import { useJudgeAssignments, useJudgeSubmissionUpload } from "../../service/hooks";
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

const JudgeDashboardPage = () => {
  const { t } = useTranslation();
  const assignmentsQuery = useJudgeAssignments();
  const uploadSubmission = useJudgeSubmissionUpload();

  const assignments = assignmentsQuery.data ?? [];

  const columns = useMemo(
    () => [
      {
        title: t("judge.table.title", { defaultValue: "Idea" }),
        dataIndex: "idea",
        key: "idea",
        render: (_: unknown, record: Assignment) => (
          <Link to={`/judge/ideas/${record.idea?.id}`}>{record.idea?.title || record.idea?.id}</Link>
        ),
      },
      {
        title: t("judge.table.status", { defaultValue: "Status" }),
        dataIndex: "status",
        key: "status",
        render: (value: Assignment["status"]) => (
          <Tag color={STATUS_COLORS[value] || "default"}>{value}</Tag>
        ),
      },
      {
        title: t("judge.table.template", { defaultValue: "Template" }),
        dataIndex: "template",
        key: "template",
        render: (_: unknown, record: Assignment) => (
          <Button
            type="link"
            href={record.template?.url}
            target="_blank"
            rel="noreferrer"
            disabled={!record.template?.available}
          >
            {t("judge.table.downloadTemplate", { defaultValue: "Download" })}
          </Button>
        ),
      },
      {
        title: t("judge.table.submission", { defaultValue: "Your file" }),
        dataIndex: "submission",
        key: "submission",
        render: (_: unknown, record: Assignment) => {
          if (!record.submission) {
            return t("judge.table.notSubmitted", { defaultValue: "Not uploaded" });
          }
          return (
            <div>
              v{record.submission.version} · {new Date(record.submission.uploadedAt).toLocaleString()} –{" "}
              <Button
                type="link"
                href={record.submission.downloadUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t("judge.table.download", { defaultValue: "Download" })}
              </Button>
            </div>
          );
        },
      },
      {
        title: t("judge.table.actions", { defaultValue: "Actions" }),
        key: "actions",
        render: (_: unknown, record: Assignment) => {
          const uploadProps: UploadProps = {
            accept: EVAL_CONSTRAINTS.allowPdf ? ".docx,.pdf" : ".docx",
            showUploadList: false,
            beforeUpload: (file) => {
              if (record.status === "LOCKED") {
                message.warning(
                  t("judge.table.locked", { defaultValue: "Assignment locked by admin." })
                );
                return Upload.LIST_IGNORE;
              }
              if (isFileTooLarge(file.size, EVAL_CONSTRAINTS)) {
                message.error(
                  t("admin.assignments.fileTooLarge", {
                    defaultValue: "File exceeds {{mb}}MB limit.",
                    mb: EVAL_CONSTRAINTS.maxFileMb,
                  })
                );
                return Upload.LIST_IGNORE;
              }
              if (!isAllowedEvaluationType(file.name, EVAL_CONSTRAINTS)) {
                message.error(
                  t("admin.assignments.invalidType", {
                    defaultValue: EVAL_CONSTRAINTS.allowPdf
                      ? "Upload DOCX or PDF"
                      : "Upload DOCX files only",
                  })
                );
                return Upload.LIST_IGNORE;
              }
              uploadSubmission
                .mutateAsync({ assignmentId: record.id, file })
                .then(() => {
                  message.success(
                    t("judge.table.uploaded", { defaultValue: "Submission saved." })
                  );
                })
                .catch((err: any) => {
                  message.error(
                    err?.message ||
                      t("admin.assignments.error", { defaultValue: "Upload failed." })
                  );
                });
              return Upload.LIST_IGNORE;
            },
          };

          return (
            <Upload {...uploadProps}>
              <Button loading={uploadSubmission.isPending}>
                {t("judge.table.upload", { defaultValue: "Upload" })}
              </Button>
            </Upload>
          );
        },
      },
    ],
    [t, uploadSubmission]
  );

  if (assignmentsQuery.isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (assignmentsQuery.error) {
    const messageText =
      assignmentsQuery.error instanceof Error
        ? assignmentsQuery.error.message
        : t("judge.table.error", { defaultValue: "Failed to load assignments" });
    return (
      <Card>
        <Alert type="error" message={messageText} />
      </Card>
    );
  }

  return (
    <Card title={t("judge.dashboard.title", { defaultValue: "Assignments" })}>
      {assignments.length === 0 ? (
        <EmptyState
          title={t("judge.dashboard.empty", { defaultValue: "No assignments yet" })}
          description={t("judge.dashboard.emptyDescription", {
            defaultValue: "You will be notified when a new idea is assigned to you.",
          })}
        />
      ) : (
        <Table<Assignment>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={assignments}
          pagination={{ pageSize: 10 }}
        />
      )}
    </Card>
  );
};

export default JudgeDashboardPage;
