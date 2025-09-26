import s from "../../styles/panel.module.scss";

export default function Milestones() {
  return (
    <div className={s.stack}>
      <h1>Milestones</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <p className={s.muted}>
            Milestones page skeleton. Add timeline, phases and date management here.
          </p>
        </div>
      </div>
    </div>
  );
}
