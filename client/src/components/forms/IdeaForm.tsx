import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./ideaForm.module.scss";

export type IdeaFormValues = {
  title: string;
  summary: string;
  category: string;
  submitterName: string;
  contactEmail: string;
  phone?: string;
  teamMembers: string[];
  proposalDoc?: File;
  proposalPdf?: File;
};

export type IdeaFormProps = {
  categories: Array<{ label: string; value: string }>;
  initialValues?: Partial<IdeaFormValues>;
  submitting?: boolean;
  onSubmit: (values: IdeaFormValues) => void;
};

type FieldErrors = Partial<Record<string, string>>;

const MAX_FILE_SIZE = 30 * 1024 * 1024;

const cx = (...tokens: Array<string | null | undefined | false>) =>
  tokens.filter(Boolean).join(" ");

const formatBytes = (bytes?: number) => {
  if (!bytes && bytes !== 0) return "";
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const isPdf = (file: File | undefined | null) =>
  Boolean(file && (/\.pdf$/i.test(file.name) || file.type === "application/pdf"));

const isWord = (file: File | undefined | null) =>
  Boolean(
    file &&
      (/\.(doc|docx)$/i.test(file.name) ||
        file.type === "application/msword" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
  );

const defaultValues: IdeaFormValues = {
  title: "",
  summary: "",
  category: "",
  submitterName: "",
  contactEmail: "",
  phone: "",
  teamMembers: [],
  proposalDoc: undefined,
  proposalPdf: undefined,
};

const IdeaForm = ({ categories, initialValues, submitting, onSubmit }: IdeaFormProps) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<IdeaFormValues>(() => ({
    ...defaultValues,
    ...initialValues,
    teamMembers: initialValues?.teamMembers ?? [],
    proposalDoc: initialValues?.proposalDoc,
    proposalPdf: initialValues?.proposalPdf,
  }));
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (initialValues) {
      setValues({
        ...defaultValues,
        ...initialValues,
        teamMembers: initialValues.teamMembers ?? [],
        proposalDoc: initialValues.proposalDoc,
        proposalPdf: initialValues.proposalPdf,
      });
    }
  }, [initialValues]);

  const hasTeamMembers = useMemo(
    () => values.teamMembers && values.teamMembers.length > 0,
    [values.teamMembers]
  );

  const updateField = (field: keyof IdeaFormValues, next: string | File | undefined) => {
    setValues((prev) => ({
      ...prev,
      [field]: next,
    }));
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleInputChange = (field: keyof IdeaFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    updateField(field, event.target.value);
  };

  const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateField("summary", event.target.value);
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateField("category", event.target.value);
  };

  const handleAddMember = () => {
    setValues((prev) => ({ ...prev, teamMembers: [...(prev.teamMembers ?? []), ""] }));
  };

  const handleMemberChange = (index: number, value: string) => {
    setValues((prev) => {
      const nextMembers = [...(prev.teamMembers ?? [])];
      nextMembers[index] = value;
      return { ...prev, teamMembers: nextMembers };
    });
  };

  const handleRemoveMember = (index: number) => {
    setValues((prev) => {
      const nextMembers = [...(prev.teamMembers ?? [])];
      nextMembers.splice(index, 1);
      return { ...prev, teamMembers: nextMembers };
    });
  };

  const handleFileChange = (field: "proposalDoc" | "proposalPdf") => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    updateField(field, file);
    if (!file) {
      setErrors((prev) => ({ ...prev, [field]: t("ideas.form.fileRules.required", { defaultValue: "File is required." }) }));
      return;
    }
    const valid =
      (field === "proposalDoc" ? isWord(file) : isPdf(file)) &&
      (typeof file.size !== "number" || file.size <= MAX_FILE_SIZE);
    if (!valid) {
      setErrors((prev) => ({
        ...prev,
        [field]:
          field === "proposalDoc"
            ? t("ideas.form.fileRules.wordRequired", { defaultValue: "Upload a DOC or DOCX file under 30MB." })
            : t("ideas.form.fileRules.pdfRequired", { defaultValue: "Upload a PDF file under 30MB." }),
      }));
    } else {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  };

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};
    if (!values.title.trim()) {
      nextErrors.title = t("ideas.form.titleRequired", { defaultValue: "Title is required." });
    }
    if (!values.summary.trim()) {
      nextErrors.summary = t("ideas.form.summaryRequired", { defaultValue: "Summary is required." });
    }
    if (!values.category) {
      nextErrors.category = t("ideas.form.categoryRequired", { defaultValue: "Category is required." });
    }
    if (values.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail)) {
      nextErrors.contactEmail = t("auth.errors.invalidEmail", { defaultValue: "Invalid email address." });
    }
    if (!values.proposalDoc) {
      nextErrors.proposalDoc = t("ideas.form.fileRules.wordRequired", { defaultValue: "Word file is required." });
    } else if (!isWord(values.proposalDoc)) {
      nextErrors.proposalDoc = t("ideas.form.fileRules.wordRequired", { defaultValue: "Upload a DOC or DOCX file." });
    } else if (values.proposalDoc.size > MAX_FILE_SIZE) {
      nextErrors.proposalDoc = t("ideas.form.fileRules.sizeLimit", {
        defaultValue: "Maximum allowed size for each file is 30MB.",
      });
    }
    if (!values.proposalPdf) {
      nextErrors.proposalPdf = t("ideas.form.fileRules.pdfRequired", { defaultValue: "PDF file is required." });
    } else if (!isPdf(values.proposalPdf)) {
      nextErrors.proposalPdf = t("ideas.form.fileRules.pdfRequired", { defaultValue: "Upload a PDF document." });
    } else if (values.proposalPdf.size > MAX_FILE_SIZE) {
      nextErrors.proposalPdf = t("ideas.form.fileRules.sizeLimit", {
        defaultValue: "Maximum allowed size for each file is 30MB.",
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleReset = () => {
    if (initialValues) {
      setValues({
        ...defaultValues,
        ...initialValues,
        teamMembers: initialValues.teamMembers ?? [],
        proposalDoc: initialValues.proposalDoc,
        proposalPdf: initialValues.proposalPdf,
      });
    } else {
      setValues(defaultValues);
    }
    setErrors({});
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const cleanedMembers = (values.teamMembers ?? []).map((member) => member.trim()).filter(Boolean);

    onSubmit({
      ...values,
      teamMembers: cleanedMembers,
      proposalDoc: values.proposalDoc,
      proposalPdf: values.proposalPdf,
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.gridTwo}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="idea-title">
            {t("ideas.form.title", { defaultValue: "Idea title" })}
          </label>
          <input
            id="idea-title"
            className={cx(styles.input, errors.title && styles.invalid)}
            value={values.title}
            onChange={handleInputChange("title")}
            placeholder={t("ideas.form.titlePlaceholder", { defaultValue: "e.g. Smart irrigation system" })}
          />
          {errors.title ? <span className={styles.errors}>{errors.title}</span> : null}
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="idea-category">
            {t("ideas.form.category", { defaultValue: "Category" })}
          </label>
          <select
            id="idea-category"
            className={cx(styles.select, errors.category && styles.invalid)}
            value={values.category}
            onChange={handleSelectChange}
          >
            <option value="">{t("ideas.form.categoryPlaceholder", { defaultValue: "Choose a category" })}</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category ? <span className={styles.errors}>{errors.category}</span> : null}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="idea-summary">
          {t("ideas.form.summary", { defaultValue: "Idea summary" })}
        </label>
        <textarea
          id="idea-summary"
          className={cx(styles.textarea, errors.summary && styles.invalid)}
          value={values.summary}
          onChange={handleTextAreaChange}
          placeholder={t("ideas.form.summaryPlaceholder", { defaultValue: "Write a short description of the idea" })}
        />
        {errors.summary ? <span className={styles.errors}>{errors.summary}</span> : null}
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="idea-submitter">
            {t("ideas.form.submitterName", { defaultValue: "Submitter name" })}
          </label>
          <input
            id="idea-submitter"
            className={styles.input}
            value={values.submitterName}
            onChange={handleInputChange("submitterName")}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="idea-email">
            {t("ideas.form.contactEmail", { defaultValue: "Contact email" })}
          </label>
          <input
            id="idea-email"
            className={cx(styles.input, errors.contactEmail && styles.invalid)}
            value={values.contactEmail}
            onChange={handleInputChange("contactEmail")}
            placeholder="name@example.com"
          />
          {errors.contactEmail ? <span className={styles.errors}>{errors.contactEmail}</span> : null}
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="idea-phone">
            {t("ideas.form.phone", { defaultValue: "Phone number" })}
          </label>
          <input
            id="idea-phone"
            className={styles.input}
            value={values.phone ?? ""}
            onChange={handleInputChange("phone")}
            placeholder="+98 ..."
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.label}>{t("ideas.form.teamMembers", { defaultValue: "Team members" })}</span>
        <div className={styles.teamList}>
          {hasTeamMembers
            ? values.teamMembers.map((member, index) => (
                <div className={styles.teamRow} key={`member-${index}`}>
                  <input
                    className={styles.input}
                    value={member}
                    onChange={(event) => handleMemberChange(index, event.target.value)}
                    placeholder={t("ideas.form.teamMemberPlaceholder", { defaultValue: "Team member" })}
                  />
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => handleRemoveMember(index)}
                    aria-label={t("ideas.form.removeMember", { defaultValue: "Remove member" })}
                  >
                    &minus;
                  </button>
                </div>
              ))
            : null}
          <button type="button" className={styles.addButton} onClick={handleAddMember}>
            {t("ideas.form.addMember", { defaultValue: "Add member" })}
          </button>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.fileInput}>
          <span className={styles.label}>{t("ideas.form.proposalDoc", { defaultValue: "Word file (DOC / DOCX)" })}</span>
          <label className={cx(styles.fileControl, errors.proposalDoc && styles.invalid)}>
            <input type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange("proposalDoc")} />
            <div>
              <div className={styles.fileName}>
                {values.proposalDoc?.name ??
                  t("ideas.form.uploadDoc", { defaultValue: "Choose Word document" })}
              </div>
              {values.proposalDoc ? (
                <div className={styles.fileMeta}>{formatBytes(values.proposalDoc.size)}</div>
              ) : (
                <div className={styles.fileHint}>
                  {t("ideas.form.uploadDocHint", { defaultValue: "Maximum 30MB. Formats: DOC or DOCX" })}
                </div>
              )}
            </div>
          </label>
          {errors.proposalDoc ? <span className={styles.errors}>{errors.proposalDoc}</span> : null}
        </div>

        <div className={styles.fileInput}>
          <span className={styles.label}>{t("ideas.form.proposalPdf", { defaultValue: "PDF file" })}</span>
          <label className={cx(styles.fileControl, errors.proposalPdf && styles.invalid)}>
            <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange("proposalPdf")} />
            <div>
              <div className={styles.fileName}>
                {values.proposalPdf?.name ?? t("ideas.form.uploadPdf", { defaultValue: "Choose PDF document" })}
              </div>
              {values.proposalPdf ? (
                <div className={styles.fileMeta}>{formatBytes(values.proposalPdf.size)}</div>
              ) : (
                <div className={styles.fileHint}>
                  {t("ideas.form.uploadPdfHint", { defaultValue: "Maximum 30MB. Format: PDF" })}
                </div>
              )}
            </div>
          </label>
          {errors.proposalPdf ? <span className={styles.errors}>{errors.proposalPdf}</span> : null}
        </div>
      </div>

      <div className={styles.footer}>
        <button
          type="submit"
          className={cx(styles.button, styles.buttonPrimary)}
          disabled={Boolean(submitting)}
        >
          {t("ideas.form.submit", { defaultValue: "Submit idea" })}
        </button>
        <button
          type="button"
          className={cx(styles.button, styles.buttonGhost)}
          onClick={handleReset}
          disabled={Boolean(submitting)}
        >
          {t("ideas.form.reset", { defaultValue: "Clear form" })}
        </button>
      </div>
    </form>
  );
};

export default IdeaForm;
