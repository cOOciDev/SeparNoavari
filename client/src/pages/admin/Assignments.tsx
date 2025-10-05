import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { message } from "antd";
import {
  createAssignment,
  listAssignments,
  listIdeas,
  listJudges,
} from "../../api";
import type { Assignment } from "../../api";
import s from "../../styles/panel.module.scss";

type IdeaLite = { id: string; title: string };
type JudgeLite = { id: string; name: string };

export default function Assignments() {
  const { t } = useTranslation();
  const [assigns, setAssigns] = useState<Assignment[]>([]);
  const [ideas, setIdeas] = useState<IdeaLite[]>([]);
  const [judges, setJudges] = useState<JudgeLite[]>([]);
  const [ideaId, setIdeaId] = useState<string>("");
  const [chosen, setChosen] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const [a, i, j] = await Promise.all([
          listAssignments(),
          listIdeas({}),
          listJudges(),
        ]);

        setAssigns(a);
        setIdeas(i.map((it: { id: string; title: string }) => ({ id: it.id, title: it.title })));
        setJudges(j.map((jt: { id: string; name: string }) => ({ id: jt.id, name: jt.name })));
      } catch (err) {
        console.error("Init load failed", err);
        setAssigns([]);
        setIdeas([]);
        setJudges([]);
      }
    })();
  }, []);

  async function doAssign() {
    if (!ideaId || chosen.length === 0) return;
    try {
      setLoading(true);
      await createAssignment(ideaId, chosen);
      const fresh = await listAssignments();
      setAssigns(fresh);
      setChosen([]);
      message.success("Assigned");
    } catch (err) {
      console.error("Assign failed", err);
      message.error("Failed to assign");
    } finally {
      setLoading(false);
    }
  }

  function onIdeaChange(e: ChangeEvent<HTMLSelectElement>) {
    setIdeaId(e.target.value);
  }

  function onJudgesChange(e: ChangeEvent<HTMLSelectElement>) {
    const vals = Array.from(e.currentTarget.selectedOptions).map((o) => o.value);
    setChosen(vals);
  }

  return (
    <div className={s.stack}>
      <h1>{t('admin.assignmentsPage.title')}</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <div className={s.filters}>
            <select
              className={s.select}
              value={ideaId}
              onChange={onIdeaChange}
              aria-label="Select idea"
            >
              <option value="">{t('admin.assignmentsPage.selectIdeaPlaceholder')}</option>
              {ideas.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>

            <select
              multiple
              className={s.selectMulti}
              value={chosen}
              onChange={onJudgesChange}
              aria-label="Select judges"
            >
              {judges.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>

            <button className={s.btnPrimary} onClick={doAssign} disabled={loading}>
              {loading ? t('admin.assignmentsPage.assigning') : t('admin.assignmentsPage.assignButton')}
            </button>
          </div>
        </div>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>{t('admin.assignmentsPage.table.assignment')}</th>
              <th>{t('admin.assignmentsPage.table.idea')}</th>
              <th>{t('admin.assignmentsPage.table.judge')}</th>
              <th>{t('admin.assignmentsPage.table.status')}</th>
            </tr>
          </thead>
          <tbody>
            {assigns.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.ideaId}</td>
                <td>{a.judgeId}</td>
                <td>{a.status}</td>
              </tr>
            ))}
            {assigns.length === 0 && (
              <tr>
                <td colSpan={4} className={s.muted}>
                  {t('admin.assignmentsPage.noAssignments')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

