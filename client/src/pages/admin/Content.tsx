import s from "../../styles/panel.module.scss";

export default function Content() {
  return (
    <div className={s.stack}>
      <h1>Content</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <p className={s.muted}>
            Content management skeleton. Add sections for pages, posts, media, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
