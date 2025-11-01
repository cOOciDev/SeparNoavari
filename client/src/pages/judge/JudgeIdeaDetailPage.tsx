import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import IdeaFilesList from "../../components/ideas/IdeaFilesList";
import { useIdea } from "../../service/hooks";
import ReviewForm from "./ReviewForm";
import styles from "./judgeIdeaDetail.module.scss";

const JudgeIdeaDetailPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data, isLoading, error } = useIdea(id);

  if (isLoading) {
    return (
      <section className={styles.card}>
        <span className={styles.loading}>
          {t("common.loading", { defaultValue: "Loading..." })}
        </span>
      </section>
    );
  }

  if (error) {
    const message =
      error instanceof Error
        ? error.message
        : t("judge.detail.error", { defaultValue: "Failed to load idea" });
    return (
      <section className={`${styles.card} ${styles.alert} ${styles.alertError}`}>
        {message}
      </section>
    );
  }

  const idea = data?.idea;

  if (!idea) {
    return (
      <section className={`${styles.card} ${styles.alert} ${styles.alertInfo}`}>
        {t("judge.detail.notFound", { defaultValue: "Idea not found" })}
      </section>
    );
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.card}>
        <div style={{ display: "grid", gap: 12 }}>
          <h1 className={styles.cardTitle}>{idea.title}</h1>
          <span className={styles.badge}>
            {idea.status ?? t("ideas.detail.statusUnknown", { defaultValue: "Pending" })}
          </span>
        </div>
        <div className={styles.descList}>
          <div className={styles.descItem}>
            <span className={styles.descLabel}>
              {t("ideas.detail.category", { defaultValue: "Category" })}
            </span>
            <span className={styles.descValue}>{idea.category || "-"}</span>
          </div>
          <div className={styles.descItem}>
            <span className={styles.descLabel}>
              {t("ideas.detail.summary", { defaultValue: "Summary" })}
            </span>
            <span className={styles.descValue}>
              {idea.summary ||
                t("ideas.detail.noSummary", { defaultValue: "No summary provided." })}
            </span>
          </div>
        </div>
        <IdeaFilesList files={idea.files ?? []} />
      </section>

      {id ? (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            {t("judge.review.title", { defaultValue: "Submit review" })}
          </h2>
          <ReviewForm ideaId={id} />
        </section>
      ) : null}
    </div>
  );
};

export default JudgeIdeaDetailPage;
