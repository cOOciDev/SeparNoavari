import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, message } from "antd";
import { useNavigate } from "react-router-dom";
import { type IdeaFormValues } from "../../components/forms/IdeaForm";
import IdeaForm from "../../components/forms/IdeaForm";
import { TRACKS } from "../../AppData/tracks";
import { useCreateIdea } from "../../service/hooks";

const SubmitIdeaPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useCreateIdea();

  const categories = TRACKS.map((track) => ({
    label: t(track.titleKey, { defaultValue: track.slug }),
    value: track.slug,
  }));

  const handleSubmit = useCallback(
    async (values: IdeaFormValues) => {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("summary", values.summary);
      formData.append("category", values.category);
      values.files.forEach((file) => {
        if (file.originFileObj) {
          formData.append("files", file.originFileObj);
        }
      });

      try {
        await mutateAsync(formData);
        message.success(t("ideas.submit.success", { defaultValue: "Idea submitted successfully" }));
        navigate("/ideas/mine", { replace: true });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t("ideas.submit.error", { defaultValue: "Submission failed" });
        message.error(errorMessage);
      }
    },
    [mutateAsync, navigate, t]
  );

  return (
    <Card title={t("ideas.submit.title", { defaultValue: "Submit Idea" })} bordered={false}>
      <IdeaForm categories={categories} submitting={isPending} onSubmit={handleSubmit} />
    </Card>
  );
};

export default SubmitIdeaPage;
