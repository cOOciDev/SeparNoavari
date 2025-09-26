import { useEffect, useState } from "react";
import { listIdeas, listJudges, listAssignments } from "../../api";
import type { Idea, Judge, Assignment } from "../../api";
import s from "../../styles/panel.module.scss";

export default function Dashboard() {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [judges, setJudges] = useState<Judge[] | null>(null);
  const [assigns, setAssigns] = useState<Assignment[] | null>(null);

  useEffect(() => {
    listIdeas().then(setIdeas).catch(()=>setIdeas([]));
    listJudges().then(setJudges).catch(()=>setJudges([]));
    listAssignments().then(setAssigns).catch(()=>setAssigns([]));
  }, []);

  return (
    <div className={s.stack}>
      <h1>Dashboard</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <div className={s.stack}>
            <div>Ideas: <strong>{ideas ? ideas.length : "…"}</strong></div>
            <div>Judges: <strong>{judges ? judges.length : "…"}</strong></div>
            <div>Assignments: <strong>{assigns ? assigns.length : "…"}</strong></div>
          </div>
        </div>
      </div>

      <div className={s.card}>
        <div className={s.cardBody}>
          <p className={s.muted}>Quick links: Ideas / Judges / Assignments (use sidebar)</p>
        </div>
      </div>
    </div>
  );
}
