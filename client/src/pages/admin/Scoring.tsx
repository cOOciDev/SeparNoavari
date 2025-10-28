import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import s from "../../styles/panel.module.scss";
import {
  listAdminAssignments,
  type AdminAssignmentListItem,
} from "../../service/apis/admin.api";

type StatusFilter = "ALL" | "ACTIVE" | "COMPLETED";
type SortKey = "newest" | "oldest" | "status" | "score";

type Row = AdminAssignmentListItem & {
  judgeName: string;
  ideaTitle: string;
  submittedAt: string | null;
};

const COMPLETED_STATUSES = new Set(["REVIEWED", "LOCKED"]);
const ACTIVE_STATUSES = new Set(["PENDING", "IN_PROGRESS", "SUBMITTED"]);

const normalizeDate = (value?: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export default function Scoring() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const assignments = await listAdminAssignments();
        if (cancelled) return;
        const normalized: Row[] = assignments.map((item) => ({
          ...item,
          ideaTitle: item.ideaTitle ?? item.ideaId,
          judgeName: item.judgeName ?? item.judgeId,
          submittedAt: normalizeDate(item.submittedAt),
          scoreAvg: item.scoreAvg ?? null,
        }));
        setRows(normalized);
      } catch (e) {
        console.error(e);
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Load failed");
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(() => {
    let filtered = [...rows];

    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      filtered = filtered.filter((r) =>
        [r.ideaTitle, r.ideaId, r.judgeName, r.judgeId, r.id, r.status]
          .filter(Boolean)
          .some((value) => value!.toString().toLowerCase().includes(qq))
      );
    }

    if (status === "ACTIVE") {
      filtered = filtered.filter((r) => ACTIVE_STATUSES.has(r.status));
    } else if (status === "COMPLETED") {
      filtered = filtered.filter((r) => COMPLETED_STATUSES.has(r.status));
    }

    const byDateAsc = (value: string | null) => {
      if (!value) return 0;
      return new Date(value).getTime() || 0;
    };

    switch (sort) {
      case "oldest":
        filtered.sort((a, b) => byDateAsc(a.submittedAt) - byDateAsc(b.submittedAt));
        break;
      case "status":
        filtered.sort((a, b) => a.status.localeCompare(b.status));
        break;
      case "score":
        filtered.sort((a, b) => (b.scoreAvg ?? -1) - (a.scoreAvg ?? -1));
        break;
      case "newest":
      default:
        filtered.sort((a, b) => byDateAsc(b.submittedAt) - byDateAsc(a.submittedAt));
        break;
    }

    return filtered;
  }, [rows, q, status, sort]);

  const exportCsv = () => {
    const rowsCsv = [
      [
        "AssignmentID",
        "IdeaID",
        "IdeaTitle",
        "JudgeID",
        "JudgeName",
        "Status",
        "SubmittedAt",
        "ScoreAvg",
      ],
      ...data.map((r) => [
        r.id,
        r.ideaId,
        r.ideaTitle,
        r.judgeId,
        r.judgeName,
        r.status,
        r.submittedAt ?? "",
        r.scoreAvg ?? "",
      ]),
    ];
    const csv = rowsCsv
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scoring.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={s.stack}>
      <h1>{t("admin.scoringPage.title")}</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <div className={s.filters}>
            <input
              className={s.input}
              placeholder={t("admin.scoringPage.searchPlaceholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className={s.select}
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="ALL">{t("admin.scoringPage.all")}</option>
              <option value="ACTIVE">{t("admin.scoringPage.assigned")}</option>
              <option value="COMPLETED">{t("admin.scoringPage.done")}</option>
            </select>
            <select
              className={s.select}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="newest">{t("admin.scoringPage.sort.newest")}</option>
              <option value="oldest">{t("admin.scoringPage.sort.oldest")}</option>
              <option value="status">{t("admin.scoringPage.sort.status")}</option>
              <option value="score">{t("admin.scoringPage.sort.score")}</option>
            </select>
            <button className={s.btnGhost} onClick={exportCsv}>
              {t("admin.scoringPage.csv")}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className={s.card}>
          <div className={s.cardBody}>
            <div className={s.stack}>
              <div className={s.muted}>Loading...</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={s.card}>
          <div className={s.cardBody}>
            <div className={s.stack}>
              <div className={s.muted}>Error: {error}</div>
              <button className={s.btnGhost} onClick={() => window.location.reload()}>
                Reload
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>{t("admin.scoringPage.table.assignment")}</th>
              <th>{t("admin.scoringPage.table.idea")}</th>
              <th>{t("admin.scoringPage.table.judge")}</th>
              <th>{t("admin.scoringPage.table.status")}</th>
              <th>{t("admin.scoringPage.table.submitted")}</th>
              <th>{t("admin.scoringPage.table.score")}</th>
              <th>{t("admin.scoringPage.table.open")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td title={r.ideaId}>{r.ideaTitle}</td>
                <td title={r.judgeId}>{r.judgeName}</td>
                <td>{r.status}</td>
                <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "-"}</td>
                <td>{r.scoreAvg ?? "-"}</td>
                <td>
                  <a
                    className={s.btn}
                    href={`/ideas/${r.ideaId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("admin.scoringPage.viewIdea")}
                  </a>
                </td>
              </tr>
            ))}
            {data.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={7} className={s.muted}>
                  {t("admin.scoringPage.noRows")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
