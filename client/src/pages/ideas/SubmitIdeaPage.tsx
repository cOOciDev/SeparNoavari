import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthProvider";
import { type IdeaFormValues } from "../../components/forms/IdeaForm";
import IdeaForm from "../../components/forms/IdeaForm";
import { TRACKS } from "../../AppData/tracks";
import { useCreateIdea } from "../../service/hooks";

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

  const initialValues = useMemo<Partial<IdeaFormValues>>(
    () => ({
      submitterName: user?.name ?? "",
      contactEmail: user?.email ?? "",
      teamMembers: [],
    }),
    [user?.email, user?.name]
  );

  const handleSubmit = useCallback(
    async (values: IdeaFormValues) => {
      if (
        !values.proposalDoc?.originFileObj ||
        !values.proposalPdf?.originFileObj
      ) {
        message.error(t("ideas.form.fileRules.wordRequired", { defaultValue: "Word file is required." }));
        message.error(t("ideas.form.fileRules.pdfRequired", { defaultValue: "PDF file is required." }));
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
      (values.teamMembers ?? []).forEach((member) => {
        if (member) {
          formData.append("teamMembers[]", member);
        }
      });
      formData.append("proposalDoc", values.proposalDoc.originFileObj);
      formData.append("proposalPdf", values.proposalPdf.originFileObj);
      // console.log("formData :", formData);

      try {
        await mutateAsync(formData);
        
        message.success(
          t("ideas.submit.success", {
            defaultValue: "Idea submitted successfully",
          })
        );
        navigate("/ideas/mine", { replace: true });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("ideas.submit.error", {
                defaultValue: "Submission failed",
              });
        message.error(errorMessage);
      }
    },
    [mutateAsync, navigate, t]
  );

  return (
    <Card
      title={t("ideas.submit.title", { defaultValue: "Submit Idea" })}
      bordered={false}
    >
      <IdeaForm
        key={user?.id || user?.email || "idea-form"}
        categories={categories}
        submitting={isPending}
        onSubmit={handleSubmit}
        initialValues={initialValues}
      />
    </Card>
  );
};

export default SubmitIdeaPage;
