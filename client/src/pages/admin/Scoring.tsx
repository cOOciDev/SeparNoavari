import { useEffect, useMemo, useState } from "react";
import s from "../../styles/panel.module.scss";
import { listAssignments, listIdeas, listJudges } from "../../api";
import type { Assignment, Idea, Judge } from "../../api";

type Row = Assignment & {
  ideaTitle: string;
  judgeName: string;
  submittedAt?: string;
  scoreAvg?: number | null;
};

export default function Scoring() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | "ASSIGNED" | "DONE">("ALL");
  const [sort, setSort] = useState<"newest" | "oldest" | "status" | "score">("newest");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [assigns, ideas, judges] = await Promise.all([
          listAssignments(),
          listIdeas(),
          listJudges(),
        ]);

        const ideaMap = new Map<string, Idea>(ideas.map((i) => [i.id, i]));
        const judgeMap = new Map<string, Judge>(judges.map((j) => [j.id, j]));

        const enriched: Row[] = assigns.map((a) => {
          const i = ideaMap.get(a.ideaId);
          const j = judgeMap.get(a.judgeId);
          return {
            ...a,
            ideaTitle: i?.title ?? a.ideaId,
            judgeName: j?.name ?? a.judgeId,
            submittedAt: i?.submittedAt,
            scoreAvg: i?.scoreAvg ?? null,
          };
        });

        setRows(enriched);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Load failed");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const data = useMemo(() => {
    let d = [...rows];

    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      d = d.filter(
        (r) =>
          r.ideaTitle.toLowerCase().includes(qq) ||
          r.judgeName.toLowerCase().includes(qq) ||
          r.id.toLowerCase().includes(qq) ||
          r.ideaId.toLowerCase().includes(qq) ||
          r.judgeId.toLowerCase().includes(qq) ||
          r.status.toLowerCase().includes(qq)
      );
    }
    if (status !== "ALL") d = d.filter((r) => r.status === status);

    switch (sort) {
      case "oldest":
        d.sort((a, b) => (+new Date(a.submittedAt || 0)) - (+new Date(b.submittedAt || 0)));
        break;
      case "status":
        d.sort((a, b) => a.status.localeCompare(b.status));
        break;
      case "score":
        d.sort((a, b) => (b.scoreAvg ?? -1) - (a.scoreAvg ?? -1));
        break;
      case "newest":
      default:
        d.sort((a, b) => (+new Date(b.submittedAt || 0)) - (+new Date(a.submittedAt || 0)));
        break;
    }
    return d;
  }, [rows, q, status, sort]);

  function exportCsv() {
    const rowsCsv = [
      ["AssignmentID", "IdeaID", "IdeaTitle", "JudgeID", "JudgeName", "Status", "SubmittedAt", "ScoreAvg"],
      ...data.map((r) => [
        r.id,
        r.ideaId,
        r.ideaTitle,
        r.judgeId,
        r.judgeName,
        r.status,
        r.submittedAt ?? "",
        (r.scoreAvg ?? "").toString(),
      ]),
    ];
    const csv = rowsCsv.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scoring.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={s.stack}>
      <h1>Scoring</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <div className={s.filters}>
            <input
              className={s.input}
              placeholder="Search assignment/idea/judge/status…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select className={s.select} value={status} onChange={(e) => setStatus(e.target.value as "ALL" | "ASSIGNED" | "DONE")}>
              <option value="ALL">All</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="DONE">Done</option>
            </select>
            <select className={s.select} value={sort} onChange={(e) => setSort(e.target.value as "newest" | "oldest" | "status" | "score")}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="status">By status</option>
              <option value="score">Top score</option>
            </select>
            <button className={s.btnGhost} onClick={exportCsv}>CSV</button>
          </div>
        </div>
      </div>

      {loading && (
        <div className={s.card}>
          <div className={s.cardBody}>
            <div className={s.stack}>
              <div className={s.muted}>Loading…</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={s.card}>
          <div className={s.cardBody}>
            <div className={s.stack}>
              <div className={s.muted}>Error: {error}</div>
              <button className={s.btnGhost} onClick={() => window.location.reload()}>Reload</button>
            </div>
          </div>
        </div>
      )}

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Idea</th>
              <th>Judge</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Score</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td title={r.ideaId}>{r.ideaTitle}</td>
                <td title={r.judgeId}>{r.judgeName}</td>
                <td>{r.status}</td>
                <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}</td>
                <td>{r.scoreAvg ?? "—"}</td>
                <td>
                  <a className={s.btn} href={`/ideas/${r.ideaId}`} target="_blank" rel="noreferrer">
                    View idea
                  </a>
                </td>
              </tr>
            ))}
            {data.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={7} className={s.muted}>No rows.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
