import s from "../../styles/panel.module.scss";

export default function Broadcast() {
  return (
    <div className={s.stack}>
      <h1>Broadcast</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <p className={s.muted}>
            Broadcast skeleton. Add message composer, audience filters and delivery logs here.
          </p>
        </div>
      </div>
    </div>
  );
}
