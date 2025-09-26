import { useEffect, useState } from "react";
import { listJudges, createJudge } from "../../api";
import type { Judge } from "../../api";
import s from "../../styles/panel.module.scss";

export default function Judges() {
  const [data, setData] = useState<Judge[] | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function reload() {
    try { setData(await listJudges()); } catch { setData([]); }
  }
  useEffect(()=>{ reload(); }, []);

  async function add() {
    if (!name.trim()) return;
    await createJudge({ name: name.trim(), email: email.trim() || undefined });
    setName(""); setEmail("");
    reload();
  }

  return (
    <div className={s.stack}>
      <h1>Judges</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <div className={s.filters}>
            <input className={s.input} placeholder="Judge name…" value={name} onChange={e=>setName(e.target.value)} />
            <input className={s.input} placeholder="Email (optional)…" value={email} onChange={e=>setEmail(e.target.value)} />
            <button className={s.btnPrimary} onClick={add}>Add judge</button>
          </div>
        </div>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
          <tbody>
            {data?.map(j=>(
              <tr key={j.id}>
                <td>{j.id}</td>
                <td>{j.name}</td>
                <td>{j.email || "—"}</td>
              </tr>
            ))}
            {(!data || data.length===0) && <tr><td colSpan={3} className={s.muted}>No judges.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
