import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import IdeaForm, { type IdeaFormValues } from "../../components/forms/IdeaForm";
import { TRACKS } from "../../AppData/tracks";
import { useCreateIdea } from "../../service/hooks";
import { useAuth } from "../../contexts/AuthProvider";
import styles from "./submitIdea.module.scss";

const SubmitIdeaPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useCreateIdea();
  const { user } = useAuth();

  const categories = useMemo(
    () =>
      TRACKS.map((track) => ({
        label: t(track.titleKey, { defaultValue: track.slug }),
        value: track.slug,
      })),
    [t]
  );

  const initialValues = useMemo(
    () => ({
      submitterName: user?.name ?? "",
      contactEmail: user?.email ?? "",
      teamMembers: [],
    }),
    [user?.email, user?.name]
  );

  const handleSubmit = useCallback(
    async (values: IdeaFormValues) => {
      if (!values.proposalDoc || !values.proposalPdf) {
        toast.error(
          t("ideas.form.fileRules.pairRequired", {
            defaultValue: "Word and PDF files are both required.",
          })
        );
        return;
      }

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("summary", values.summary);
      formData.append("category", values.category);
      formData.append("submitterName", values.submitterName);
      formData.append("contactEmail", values.contactEmail);
      if (values.phone) {
        formData.append("phone", values.phone);
      }
      values.teamMembers.forEach((member) => formData.append("teamMembers[]", member));
      formData.append("proposalDoc", values.proposalDoc);
      formData.append("proposalPdf", values.proposalPdf);

      try {
        await mutateAsync(formData);
        toast.success(
          t("ideas.submit.success", {
            defaultValue: "Idea submitted successfully.",
          })
        );
        navigate("/ideas/mine", { replace: true });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : t("ideas.submit.error", { defaultValue: "Submission failed." });
        toast.error(message);
      }
    },
    [mutateAsync, navigate, t]
  );

  return (
    <div className={styles.wrap}>
      <section className={styles.card}>
        <div>
          <h1 className={styles.title}>
            {t("ideas.submit.title", { defaultValue: "Submit your innovation" })}
          </h1>
          <p className={styles.description}>
            {t("ideas.submit.subtitle", {
              defaultValue:
                "Upload both Word and PDF versions using the provided templates so our judges can review your idea consistently.",
            })}
          </p>
        </div>
        <IdeaForm
          categories={categories}
          submitting={isPending}
          onSubmit={handleSubmit}
          initialValues={initialValues}
        />
      </section>
    </div>
  );
};

export default SubmitIdeaPage;
