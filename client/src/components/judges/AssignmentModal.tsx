import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import {
  App,
  Alert,
  Button,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useTranslation } from "react-i18next";
import JudgeSelector from "./JudgeSelector";
import type { Assignment } from "../../types/domain";
import {
  useIdeaAssignments,
  useManualAssign,
  useDeleteAssignment,
  useLockAssignment,
} from "../../service/hooks";
import type {
  AssignmentSkipEntry,
  AssignmentSkipReason,
} from "../../service/apis/admin.api";
<<<<<<< Updated upstream
=======


>>>>>>> Stashed changes

export type AssignmentModalProps = {
  open: boolean;
  onClose: () => void;
  ideaId?: string;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "default",
  IN_PROGRESS: "blue",
  SUBMITTED: "purple",
  REVIEWED: "green",
  LOCKED: "red",
};

const SKIP_REASON_COPY: Record<AssignmentSkipReason, { summary: string; defaultSummary: string }> = {
  NOT_FOUND: {
    summary: "admin.assignments.skip.summary.notFound",
    defaultSummary: "{{count}} not found",
  },
  INACTIVE: {
    summary: "admin.assignments.skip.summary.inactive",
    defaultSummary: "{{count}} inactive",
  },
  ALREADY_ASSIGNED: {
    summary: "admin.assignments.skip.summary.alreadyAssigned",
    defaultSummary: "{{count}} already assigned",
  },
  NO_SLOT_AVAILABLE: {
    summary: "admin.assignments.skip.summary.noSlot",
    defaultSummary: "{{count}} without available slot",
  },
  CAPACITY_REACHED: {
    summary: "admin.assignments.skip.summary.capacity",
    defaultSummary: "{{count}} over capacity",
  },
};

const summarizeSkipped = (
  entries: AssignmentSkipEntry[],
  t: TFunction
): string => {
  if (entries.length === 0) return "";
  const grouped = entries.reduce<
    Record<AssignmentSkipReason, { count: number; labels: string[] }>
  >((acc, entry) => {
    const reason = entry.reason;
    if (!acc[reason]) {
      acc[reason] = { count: 0, labels: [] };
    }
    acc[reason].count += 1;
    if (entry.judgeName) {
      acc[reason].labels.push(entry.judgeName);
    } else if (entry.judgeId) {
      acc[reason].labels.push(entry.judgeId);
    }
    return acc;
  }, {} as Record<AssignmentSkipReason, { count: number; labels: string[] }>);

  return Object.entries(grouped)
    .map(([reason, info]) => {
      const copy =
        SKIP_REASON_COPY[reason as AssignmentSkipReason] ??
        SKIP_REASON_COPY.ALREADY_ASSIGNED;
      const base = t(copy.summary, {
        count: info.count,
        defaultValue: copy.defaultSummary,
      });
      if (info.labels.length === 0) {
        return base;
      }
      const labelPreview =
        info.labels.length > 3
          ? `${info.labels.slice(0, 3).join(", ")}…`
          : info.labels.join(", ");
      return `${base} (${labelPreview})`;
    })
    .join(" • ");
};

const AssignmentModal = ({ open, onClose, ideaId }: AssignmentModalProps) => {
  const { t } = useTranslation();
  const { message: messageApi } = App.useApp();
  const [selectedJudges, setSelectedJudges] = useState<string[]>([]);
  const assignmentsQuery = useIdeaAssignments(open ? ideaId : undefined);
  const manualAssign = useManualAssign();
  const deleteAssignment = useDeleteAssignment();
  const lockAssignment = useLockAssignment();

  useEffect(() => {
    if (!open) {
      setSelectedJudges([]);
    }
  }, [open]);

  const assignments = assignmentsQuery.data?.assignments ?? [];
  const maxJudges = assignmentsQuery.data?.maxJudges ?? 10;
  const assignedCount = assignments.length;
  const slotsLeft = Math.max(maxJudges - assignedCount, 0);
  const assignedJudgeIds = useMemo(
    () =>
      assignments
        .map((assignment) => {
          const judge = assignment.judge;
          if (!judge) return null;
          return (
            judge.id ||
            (judge as unknown as { _id?: string })?._id ||
            (judge.user?.id ? String(judge.user.id) : null)
          );
        })
        .filter((id): id is string => Boolean(id)),
    [assignments]
  );

  const handleJudgeSelection = (value: string[]) => {
    if (value.length > slotsLeft) {
      messageApi.warning(
        t("admin.assignments.limitWarning", {
          defaultValue: "You can add up to {{count}} more judges.",
          count: slotsLeft,
        })
      );
      setSelectedJudges(value.slice(0, slotsLeft));
      return;
    }
    setSelectedJudges(value);
  };

  const handleAssign = async () => {
    if (!ideaId) {
      messageApi.error(
        t("admin.assignments.ideaRequired", {
          defaultValue: "Select an idea first.",
        })
      );
      return;
    }
    if (selectedJudges.length === 0) {
      messageApi.warning(
        t("admin.assignments.chooseJudge", {
          defaultValue: "Choose at least one judge.",
        })
      );
      return;
    }
    try {
<<<<<<< Updated upstream
=======
<<<<<<< HEAD
      await manualAssign.mutateAsync({ ideaId, judgeIds: selectedJudges });
      messageApi.success(
        t("admin.assignments.manualSuccess", {
          defaultValue: "Judges assigned successfully.",
        })
      );
=======
>>>>>>> Stashed changes
      const result = await manualAssign.mutateAsync({
        ideaId,
        judgeIds: selectedJudges,
      });
      const createdCount = result?.assignments?.length ?? 0;
      const skipped = result?.skipped ?? [];
      const remainingSlots = result?.meta?.remainingSlots;

      if (createdCount > 0) {
        message.success(
          t("admin.assignments.manualSuccess", {
            defaultValue: "{{count}} judge(s) assigned successfully.",
            count: createdCount,
          })
        );
      } else {
        message.info(
          t("admin.assignments.noNewAssignments", {
            defaultValue: "No new assignments were created.",
          })
        );
      }

      if (typeof remainingSlots === "number") {
        message.info(
          t("admin.assignments.remainingSlots", {
            defaultValue: "{{count}} assignment slot(s) remaining.",
            count: remainingSlots,
          })
        );
      }

      if (skipped.length > 0) {
        const summaryParts = summarizeSkipped(
          skipped,
          t
        );
        message.warning(
          t("admin.assignments.partialWarning", {
            defaultValue: "Skipped: {{summary}}.",
            summary: summaryParts,
          })
        );
      }

<<<<<<< Updated upstream
=======
>>>>>>> a582a459a026773c088d0a1851f4e2816ef5e273
>>>>>>> Stashed changes
      setSelectedJudges([]);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : t("admin.assignments.error", {
              defaultValue: "Assignment failed.",
            });
      messageApi.error(errMsg);
    }
  };

  const triggerDelete = async (record: Assignment) => {
    if (!ideaId) return;
    await deleteAssignment.mutateAsync({ id: record.id, ideaId });
    messageApi.success(
      t("admin.assignments.deleted", {
        defaultValue: "Assignment removed.",
      })
    );
  };

  const triggerLock = async (record: Assignment) => {
    if (!ideaId) return;
    await lockAssignment.mutateAsync({ id: record.id, ideaId });
    messageApi.success(
      t("admin.assignments.locked", {
        defaultValue: "Assignment locked.",
      })
    );
  };

  const columns = useMemo(
    () => [
      {
        title: t("admin.assignments.table.judge", { defaultValue: "Judge" }),
        dataIndex: "judge",
        key: "judge",
        render: (_: unknown, record: Assignment) =>
          record.judge?.user?.name || record.judge?.user?.email || "-",
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
        title: t("admin.assignments.table.submission", {
          defaultValue: "Judge file",
        }),
        dataIndex: "submission",
        key: "submission",
        render: (_: unknown, record: Assignment) => {
          if (!record.submission) {
            return t("admin.assignments.table.noSubmission", {
              defaultValue: "Not uploaded",
            });
          }
          return (
            <Space size={4} direction="vertical">
              <Typography.Text type="secondary">
<<<<<<< Updated upstream
                v{record.submission.version} �
=======
<<<<<<< HEAD
                v{record.submission.version} -
=======
                v{record.submission.version} �
>>>>>>> a582a459a026773c088d0a1851f4e2816ef5e273
>>>>>>> Stashed changes
                {" "}
                {new Date(record.submission.uploadedAt).toLocaleString()}
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
      {
        title: t("common.actions", { defaultValue: "Actions" }),
        key: "actions",
        render: (_: unknown, record: Assignment) => (
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => triggerLock(record)}
              disabled={record.status === "LOCKED"}
              loading={lockAssignment.isPending}
            >
              {t("admin.assignments.lock", { defaultValue: "Lock" })}
            </Button>
            <Popconfirm
              title={t("admin.assignments.deleteConfirm", {
                defaultValue: "Remove this assignment?",
              })}
              okText={t("common.delete", { defaultValue: "Delete" })}
              cancelText={t("common.cancel", { defaultValue: "Cancel" })}
              onConfirm={() => triggerDelete(record)}
              disabled={record.status === "LOCKED"}
            >
              <Button
                danger
                size="small"
                disabled={record.status === "LOCKED"}
                loading={deleteAssignment.isPending}
              >
                {t("common.delete", { defaultValue: "Delete" })}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [t, deleteAssignment.isPending, lockAssignment.isPending]
  );

  return (
    <Modal
      title={t("admin.assignments.manual", { defaultValue: "Assign judges" })}
      open={open}
      onCancel={onClose}
      onOk={handleAssign}
      okButtonProps={{
        disabled: slotsLeft === 0 || selectedJudges.length === 0 || !ideaId,
        loading: manualAssign.isPending,
      }}
      cancelButtonProps={{ disabled: manualAssign.isPending }}
      width={720}
      destroyOnHidden
    >
      {!ideaId ? (
        <Alert
          type="info"
          showIcon
          message={t("admin.assignments.ideaRequired", {
            defaultValue: "Please choose an idea to continue.",
          })}
        />
      ) : null}

      {assignmentsQuery.error ? (
        <Alert
          type="error"
          showIcon
          message={
            assignmentsQuery.error instanceof Error
              ? assignmentsQuery.error.message
              : t("admin.assignments.error", { defaultValue: "Failed to load." })
          }
        />
      ) : null}

      <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 16 }}>
        <Space align="center" size={8} wrap>
          <Typography.Text strong>
            {t("admin.assignments.counter", {
              defaultValue: "Assigned {{assigned}} / {{max}} judges",
              assigned: assignedCount,
              max: maxJudges,
            })}
          </Typography.Text>
          <Tag color={slotsLeft > 0 ? "blue" : "red"}>
            {slotsLeft > 0
              ? t("admin.assignments.slotsLeft", {
                  defaultValue: "{{count}} slots available",
                  count: slotsLeft,
                })
              : t("admin.assignments.slotsFull", {
                  defaultValue: "All judge slots filled",
                })}
          </Tag>
        </Space>

        {slotsLeft === 0 ? (
          <Alert
            type="warning"
            showIcon
            message={t("admin.assignments.maxReached", {
              defaultValue: "Maximum judges reached for this idea.",
            })}
          />
        ) : null}

        <JudgeSelector
          value={selectedJudges}
          onChange={handleJudgeSelection}
          placeholder={t("admin.assignments.selectJudges", {
            defaultValue: "Choose judges",
          })}
          disabled={slotsLeft === 0 || !ideaId}
          excludeIds={assignedJudgeIds}
        />
        {assignedJudgeIds.length > 0 ? (
          <Typography.Text type="secondary">
            {t("admin.assignments.selectorHint", {
              defaultValue: "Judges already assigned are disabled above.",
            })}
          </Typography.Text>
        ) : null}
      </Space>

      <Table<Assignment>
        style={{ marginTop: 24 }}
        rowKey={(record) => record.id}
        loading={assignmentsQuery.isLoading}
        columns={columns}
        dataSource={assignments}
        pagination={false}
        locale={{
          emptyText: t("admin.assignments.table.empty", {
            defaultValue: "No assignments yet.",
          }),
        }}
      />
    </Modal>
  );
};

export default AssignmentModal;

