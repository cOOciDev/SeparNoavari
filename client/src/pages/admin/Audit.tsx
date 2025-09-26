import s from "../../styles/panel.module.scss";

export default function Audit() {
  return (
    <div className={s.stack}>
      <h1>Audit</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <p className={s.muted}>
            Audit skeleton. Add activity logs, filters and search here.
          </p>
        </div>
      </div>
    </div>
  );
}
