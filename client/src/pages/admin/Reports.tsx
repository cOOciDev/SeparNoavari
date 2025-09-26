import s from "../../styles/panel.module.scss";

export default function Reports() {
  return (
    <div className={s.stack}>
      <h1>Reports</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <p className={s.muted}>
            Reports skeleton. Add KPIs, charts and export actions here.
          </p>
        </div>
      </div>
    </div>
  );
}
