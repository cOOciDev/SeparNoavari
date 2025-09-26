import { useEffect, useMemo, useState } from "react";
import { listIdeas } from "../../api";
import type { Idea, IdeaStatus } from "../../api";
import s from "../../styles/panel.module.scss";

export default function Ideas() {
  const [data, setData] = useState<Idea[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | IdeaStatus>("ALL");
  const [sort, setSort] = useState<"newest"|"oldest"|"status"|"score">("newest");

  useEffect(() => {
    listIdeas().then(setData).catch(()=>setData([]));
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    let d = [...data];

    if (q.trim()) {
      const qq = q.toLowerCase();
      d = d.filter(i => i.title.toLowerCase().includes(qq) || (i.track||"").toLowerCase().includes(qq));
    }
    if (status !== "ALL") d = d.filter(i => i.status === status);

    switch (sort) {
      case "oldest": d.sort((a,b)=>+new Date(a.submittedAt)-+new Date(b.submittedAt)); break;
      case "status": d.sort((a,b)=>a.status.localeCompare(b.status)); break;
      case "score":  d.sort((a,b)=>(b.scoreAvg||-1)-(a.scoreAvg||-1)); break;
      default:       d.sort((a,b)=>+new Date(b.submittedAt)-+new Date(a.submittedAt));
    }
    return d;
  }, [data, q, status, sort]);

  return (
    <div className={s.stack}>
      <h1>Ideas</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <div className={s.filters}>
            <input className={s.input} placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} />
            <select className={s.select} value={status} onChange={e=>setStatus(e.target.value as "ALL" | IdeaStatus)}>
              <option value="ALL">All</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              className={s.select}
              value={sort}
              onChange={e => setSort(e.target.value as "newest" | "oldest" | "status" | "score")}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="status">By status</option>
              <option value="score">Top score</option>
            </select>
          </div>
        </div>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead><tr>
            <th>ID</th><th>Title</th><th>Track</th><th>Status</th><th>Submitted</th><th>Score</th>
          </tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>{r.id}</td>
                <td><a href={`/ideas/${r.id}`}>{r.title}</a></td>
                <td>{r.track || "—"}</td>
                <td>{r.status}</td>
                <td>{new Date(r.submittedAt).toLocaleString()}</td>
                <td>{r.scoreAvg ?? "—"}</td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan={6} className={s.muted}>No ideas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
