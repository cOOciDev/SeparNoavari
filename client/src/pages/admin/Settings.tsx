import s from "../../styles/panel.module.scss";

export default function Settings() {
  return (
    <div className={s.stack}>
      <h1>Settings</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <p className={s.muted}>
            Settings skeleton. Add configuration forms (branding, links, toggles) here.
          </p>
        </div>
      </div>
    </div>
  );
}
