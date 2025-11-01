import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import JudgeSelector from "./JudgeSelector";
import styles from "./assignmentModal.module.scss";
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

export type AssignmentModalProps = {
  open: boolean;
  onClose: () => void;
  ideaId?: string;
};

const STATUS_VARIANTS: Record<Assignment["status"], string> = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  REVIEWED: "reviewed",
  LOCKED: "locked",
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
  t: ReturnType<typeof useTranslation>["t"]
): string => {
  if (entries.length === 0) return "";

  const grouped = entries.reduce<Record<AssignmentSkipReason, { count: number; labels: string[] }>>(
    (acc, entry) => {
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
    },
    {} as Record<AssignmentSkipReason, { count: number; labels: string[] }>
  );

  return Object.entries(grouped)
    .map(([reason, info]) => {
      const copy =
        SKIP_REASON_COPY[reason as AssignmentSkipReason] ?? SKIP_REASON_COPY.ALREADY_ASSIGNED;
      const base = t(copy.summary, {
        count: info.count,
        defaultValue: copy.defaultSummary,
      });

      if (info.labels.length === 0) {
        return base;
      }

      const labelPreview =
        info.labels.length > 3
          ? `${info.labels.slice(0, 3).join(", ")}, ...`
          : info.labels.join(", ");

      return `${base} (${labelPreview})`;
    })
    .join("; ");
};

const AssignmentModal = ({ open, onClose, ideaId }: AssignmentModalProps) => {
  const { t } = useTranslation();
  const [selectedJudges, setSelectedJudges] = useState<string[]>([]);
  const assignmentsQuery = useIdeaAssignments(open ? ideaId : undefined);
  const manualAssign = useManualAssign();
  const deleteAssignment = useDeleteAssignment();
  const lockAssignment = useLockAssignment();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedJudges([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const node = dialogRef.current;
    node?.focus();
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

  const handleJudgeSelection = useCallback(
    (nextValues: string[]) => {
      if (slotsLeft > 0 && nextValues.length > slotsLeft) {
        toast(
          t("admin.assignments.limitWarning", {
            defaultValue: "You can add up to {{count}} more judges.",
            count: slotsLeft,
          }),
          { icon: "⚠️" }
        );
        setSelectedJudges(nextValues.slice(0, slotsLeft));
        return;
      }
      setSelectedJudges(nextValues);
    },
    [slotsLeft, t]
  );

  const handleAssign = useCallback(async () => {
    if (!ideaId) {
      toast.error(
        t("admin.assignments.ideaRequired", {
          defaultValue: "Select an idea first.",
        })
      );
      return;
    }
    if (selectedJudges.length === 0) {
      toast(t("admin.assignments.chooseJudge", { defaultValue: "Choose at least one judge." }));
      return;
    }

    try {
      const result = await manualAssign.mutateAsync({
        ideaId,
        judgeIds: selectedJudges,
      });
      const createdCount = result?.assignments?.length ?? 0;
      const skipped = result?.skipped ?? [];
      const remainingSlots = result?.meta?.remainingSlots;

      if (createdCount > 0) {
        toast.success(
          t("admin.assignments.manualSuccess", {
            defaultValue: "{{count}} judge(s) assigned successfully.",
            count: createdCount,
          })
        );
      } else {
        toast(t("admin.assignments.noNewAssignments", { defaultValue: "No new assignments were created." }));
      }

      if (typeof remainingSlots === "number") {
        toast(
          t("admin.assignments.remainingSlots", {
            defaultValue: "{{count}} assignment slot(s) remaining.",
            count: remainingSlots,
          })
        );
      }

      if (skipped.length > 0) {
        toast(
          t("admin.assignments.partialWarning", {
            defaultValue: "Skipped: {{summary}}.",
            summary: summarizeSkipped(skipped, t),
          }),
          { icon: "⚠️" }
        );
      }

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
      toast.error(errMsg);
    }
  }, [ideaId, manualAssign, selectedJudges, t]);

  const triggerDelete = useCallback(
    async (record: Assignment) => {
      if (!ideaId) return;
      const confirmMessage = t("admin.assignments.deleteConfirm", {
        defaultValue: "Remove this assignment?",
      });
      if (!window.confirm(confirmMessage)) return;

      await deleteAssignment.mutateAsync({ id: record.id, ideaId });
      toast.success(t("admin.assignments.deleted", { defaultValue: "Assignment removed." }));
    },
    [deleteAssignment, ideaId, t]
  );

  const triggerLock = useCallback(
    async (record: Assignment) => {
      if (!ideaId) return;
      const confirmMessage = t("admin.assignments.lockConfirm", {
        defaultValue: "Lock this assignment?",
      });
      if (!window.confirm(confirmMessage)) return;

      await lockAssignment.mutateAsync({ id: record.id, ideaId });
      toast.success(t("admin.assignments.locked", { defaultValue: "Assignment locked." }));
    },
    [ideaId, lockAssignment, t]
  );

  if (!open) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-modal-title"
        ref={dialogRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="assignment-modal-title" className={styles.title}>
            {t("admin.assignments.manual", { defaultValue: "Assign judges" })}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t("common.close", { defaultValue: "Close" })}>
            ×
          </button>
        </header>

        <section className={styles.body}>
          {!ideaId ? (
            <div className={styles.notice} data-variant="info">
              {t("admin.assignments.ideaRequired", {
                defaultValue: "Please choose an idea to continue.",
              })}
            </div>
          ) : null}

          {assignmentsQuery.error ? (
            <div className={styles.notice} data-variant="error">
              {assignmentsQuery.error instanceof Error
                ? assignmentsQuery.error.message
                : t("admin.assignments.error", { defaultValue: "Failed to load." })}
            </div>
          ) : null}

          <div className={styles.statusRow}>
            <span className={styles.counter}>
              {t("admin.assignments.counter", {
                defaultValue: "Assigned {{assigned}} / {{max}} judges",
                assigned: assignedCount,
                max: maxJudges,
              })}
            </span>
            <span className={styles.chip} data-variant={slotsLeft > 0 ? "available" : "full"}>
              {slotsLeft > 0
                ? t("admin.assignments.slotsLeft", {
                    defaultValue: "{{count}} slots available",
                    count: slotsLeft,
                  })
                : t("admin.assignments.slotsFull", {
                    defaultValue: "All judge slots filled",
                  })}
            </span>
          </div>

          {slotsLeft === 0 ? (
            <div className={styles.notice} data-variant="warning">
              {t("admin.assignments.maxReached", {
                defaultValue: "Maximum judges reached for this idea.",
              })}
            </div>
          ) : null}

          <div>
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
              <p className={styles.hint}>
                {t("admin.assignments.selectorHint", {
                  defaultValue: "Judges already assigned are disabled above.",
                })}
              </p>
            ) : null}
          </div>

          <div className={styles.tableWrap}>
            {assignmentsQuery.isLoading ? (
              <div className={styles.tableEmpty}>
                {t("common.loading", { defaultValue: "Loading..." })}
              </div>
            ) : assignments.length === 0 ? (
              <div className={styles.tableEmpty}>
                {t("admin.assignments.table.empty", { defaultValue: "No assignments yet." })}
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t("admin.assignments.table.judge", { defaultValue: "Judge" })}</th>
                    <th>{t("admin.assignments.table.status", { defaultValue: "Status" })}</th>
                    <th>{t("admin.assignments.table.submission", { defaultValue: "Judge file" })}</th>
                    <th>{t("common.actions", { defaultValue: "Actions" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((record) => (
                    <tr key={record.id}>
                      <td>{record.judge?.user?.name || record.judge?.user?.email || "-"}</td>
                      <td>
                        <span
                          className={styles.status}
                          data-variant={STATUS_VARIANTS[record.status]}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td>
                        {record.submission ? (
                          <div className={styles.submissionMeta}>
                            <span>
                              {record.submission.version ? `v${record.submission.version} • ` : ""}
                              {new Date(record.submission.uploadedAt).toLocaleString()}
                            </span>
                            <a
                              href={record.submission.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {t("admin.assignments.table.download", { defaultValue: "Download" })}
                            </a>
                          </div>
                        ) : (
                          t("admin.assignments.table.noSubmission", {
                            defaultValue: "Not uploaded",
                          })
                        )}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.btn}
                            data-variant="ghost"
                            onClick={() => triggerLock(record)}
                            disabled={record.status === "LOCKED" || lockAssignment.isPending}
                          >
                            {t("admin.assignments.lock", { defaultValue: "Lock" })}
                          </button>
                          <button
                            type="button"
                            className={styles.btn}
                            data-variant="danger"
                            onClick={() => triggerDelete(record)}
                            disabled={record.status === "LOCKED" || deleteAssignment.isPending}
                          >
                            {t("common.delete", { defaultValue: "Delete" })}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.btn}
            data-variant="ghost"
            onClick={onClose}
            disabled={manualAssign.isPending}
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </button>
          <button
            type="button"
            className={styles.btn}
            data-variant="primary"
            onClick={handleAssign}
            disabled={slotsLeft === 0 || selectedJudges.length === 0 || !ideaId || manualAssign.isPending}
          >
            {manualAssign.isPending
              ? t("common.loading", { defaultValue: "Saving..." })
              : t("admin.assignments.assign", { defaultValue: "Assign" })}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};

export default AssignmentModal;
