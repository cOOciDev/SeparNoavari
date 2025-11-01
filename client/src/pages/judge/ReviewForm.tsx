import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useSubmitReview, useJudgeReviewCriteria } from "../../service/hooks";
import type { ReviewScores } from "../../types/domain";
import styles from "./reviewForm.module.scss";

type ReviewFormProps = {
  ideaId: string;
};

type ScoreState = Record<string, number>;

const ReviewForm = ({ ideaId }: ReviewFormProps) => {
  const { t } = useTranslation();
  const [scores, setScores] = useState<ScoreState>({});
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const criteriaQuery = useJudgeReviewCriteria();
  const { mutateAsync, isPending, error } = useSubmitReview();

  const criteria = useMemo(() => criteriaQuery.data ?? [], [criteriaQuery.data]);

  useEffect(() => {
    if (criteria.length > 0) {
      const defaults: ScoreState = {};
      criteria.forEach((item) => {
        defaults[item.id] = 5;
      });
      setScores(defaults);
    }
  }, [criteria]);

  const handleScoreChange = (criterionId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (criteria.length === 0) return;

    const payload: ReviewScores = {};
    criteria.forEach((criterion) => {
      const raw = scores[criterion.id];
      const clamped = Number.isFinite(raw) ? Math.min(10, Math.max(0, raw)) : 0;
      payload[criterion.id] = clamped;
    });

    await mutateAsync({
      ideaId,
      scores: payload,
      comment: comment.trim() || undefined,
    });
    setSubmitted(true);
    toast.success(
      t("judge.review.success", {
        defaultValue: "Review submitted successfully.",
      })
    );
  };

  useEffect(() => {
    if (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("judge.review.error", { defaultValue: "Failed to submit review" });
      toast.error(message);
    }
  }, [error, t]);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {criteriaQuery.isLoading ? (
        <div className={styles.note}>
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      ) : null}

      {submitted ? (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          {t("judge.review.success", { defaultValue: "Review submitted successfully." })}
        </div>
      ) : null}

      {criteria.length === 0 && !criteriaQuery.isLoading ? (
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          {t("judge.review.noCriteria", {
            defaultValue: "No scoring criteria configured. Contact administrator.",
          })}
        </div>
      ) : null}

      {criteria.length > 0 ? (
        <>
          <p className={styles.note}>
            {t("judge.review.scaleHint", {
              defaultValue: "Score each criterion from 0 to 10. Half steps are allowed.",
            })}
          </p>
          <div className={styles.criteriaList}>
            {criteria.map((criterion) => (
              <div className={styles.criterion} key={criterion.id}>
                <label className={styles.criterionLabel} htmlFor={`criterion-${criterion.id}`}>
                  {criterion.label}
                </label>
                <input
                  id={`criterion-${criterion.id}`}
                  className={styles.inputNumber}
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={scores[criterion.id] ?? 0}
                  onChange={(event) => handleScoreChange(criterion.id, Number.parseFloat(event.target.value))}
                  disabled={isPending}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className={styles.criterion}>
        <label className={styles.criterionLabel} htmlFor="review-comment">
          {t("judge.review.comment", { defaultValue: "Comment" })}
        </label>
        <textarea
          id="review-comment"
          className={styles.comment}
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t("judge.review.commentPlaceholder", {
            defaultValue: "Optional notes for the organisers",
          })}
          disabled={isPending}
        />
      </div>

      <div className={styles.buttons}>
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={isPending || criteria.length === 0}
        >
          {isPending
            ? t("common.loading", { defaultValue: "Saving..." })
            : t("judge.review.submit", { defaultValue: "Submit review" })}
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => {
            setComment("");
            setSubmitted(false);
            const resetScores: ScoreState = {};
            criteria.forEach((criterion) => {
              resetScores[criterion.id] = 5;
            });
            setScores(resetScores);
          }}
          disabled={isPending}
        >
          {t("common.reset", { defaultValue: "Reset" })}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;
