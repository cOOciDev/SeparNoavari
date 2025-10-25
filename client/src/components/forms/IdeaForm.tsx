import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Upload,
  Button,
  Space,
  type UploadFile,
  type UploadProps,
  message,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export type IdeaFormValues = {
  title: string;
  summary: string;
  category: string;
  submitterName: string;
  contactEmail: string;
  phone?: string;
  teamMembers?: string[];
  proposalDoc?: UploadFile;
  proposalPdf?: UploadFile;
};

export type IdeaFormProps = {
  categories: Array<{ label: string; value: string }>;
  initialValues?: Partial<IdeaFormValues>;
  submitting?: boolean;
  onSubmit: (values: IdeaFormValues) => void;
};

const MAX_FILE_SIZE = 30 * 1024 * 1024;

const isPdf = (file: File | UploadFile) => {
  const name = (file as UploadFile).name || "";
  const type = (file as UploadFile).type || "";
  return type === "application/pdf" || /\.pdf$/i.test(name);
};

const isWord = (file: File | UploadFile) => {
  const name = (file as UploadFile).name || "";
  const type = (file as UploadFile).type || "";
  return (
    type === "application/msword" ||
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    /\.(doc|docx)$/i.test(name)
  );
};

const sizeOk = (file: File | UploadFile) => {
  const size = (file as UploadFile).size;
  return typeof size === "number" ? size <= MAX_FILE_SIZE : true;
};

const IdeaForm = ({
  categories,
  initialValues,
  submitting,
  onSubmit,
}: IdeaFormProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<IdeaFormValues>();
  const [docFileList, setDocFileList] = useState<UploadFile[]>([]);
  const [pdfFileList, setPdfFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
    setDocFileList(initialValues?.proposalDoc ? [initialValues.proposalDoc] : []);
    setPdfFileList(initialValues?.proposalPdf ? [initialValues.proposalPdf] : []);
  }, [form, initialValues]);

  const validateFilesPair = () => {
    if (docFileList.length !== 1 || pdfFileList.length !== 1) {
      message.error(
        t("ideas.form.fileRules.wordRequired", {
          defaultValue: "Word file is required.",
        })
      );
      message.error(
        t("ideas.form.fileRules.pdfRequired", {
          defaultValue: "PDF file is required.",
        })
      );
      return false;
    }
    if (!isWord(docFileList[0])) {
      message.error(
        t("ideas.form.fileRules.wordRequired", {
          defaultValue: "Word file is required.",
        })
      );
      return false;
    }
    if (!isPdf(pdfFileList[0])) {
      message.error(
        t("ideas.form.fileRules.pdfRequired", {
          defaultValue: "PDF file is required.",
        })
      );
      return false;
    }
    if (![docFileList[0], pdfFileList[0]].every(sizeOk)) {
      message.error(
        t("ideas.form.fileRules.sizeLimit", {
          defaultValue: "Maximum allowed size for each file is 30MB.",
        })
      );
      return false;
    }
    return true;
  };

  const handleFinish = (values: IdeaFormValues) => {
    if (!validateFilesPair()) return;
    const teamMembers =
      values.teamMembers?.map((member) => member.trim()).filter(Boolean) ?? [];

    onSubmit({
      ...values,
      teamMembers,
      proposalDoc: docFileList[0],
      proposalPdf: pdfFileList[0],
    });
  };

  const makeUploadProps = (
    type: "doc" | "pdf",
    list: UploadFile[],
    setter: (files: UploadFile[]) => void
  ): UploadProps => ({
    fileList: list,
    multiple: false,
    maxCount: 1,
    accept:
      type === "doc"
        ? ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : ".pdf,application/pdf",
    beforeUpload: (raw) => {
      const validator = type === "doc" ? isWord : isPdf;
      const failMessage =
        type === "doc"
          ? t("ideas.form.fileRules.wordRequired", {
              defaultValue: "Word file is required.",
            })
          : t("ideas.form.fileRules.pdfRequired", {
              defaultValue: "PDF file is required.",
            });
      if (!validator(raw)) {
        message.error(failMessage);
        return Upload.LIST_IGNORE;
      }
      if (!sizeOk(raw)) {
        message.error(
          t("ideas.form.fileRules.sizeLimit", {
            defaultValue: "Maximum allowed size for each file is 30MB.",
          })
        );
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: ({ fileList: next }) => {
      const latest = next.slice(-1).filter((item) => {
        const valid = (type === "doc" ? isWord(item) : isPdf(item)) && sizeOk(item);
        return valid;
      });
      setter(latest);
    },
    itemRender: (originNode) => originNode,
  });

  const docUploadProps = makeUploadProps("doc", docFileList, setDocFileList);
  const pdfUploadProps = makeUploadProps("pdf", pdfFileList, setPdfFileList);

  const resetForm = () => {
    form.resetFields();
    setDocFileList([]);
    setPdfFileList([]);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleFinish}
    >
      <Form.Item
        name="title"
        label={t("ideas.form.title", { defaultValue: "Idea title" })}
        rules={[
          {
            required: true,
            message: t("ideas.form.titleRequired", {
              defaultValue: "Title is required.",
            }),
          },
        ]}
      >
        <Input placeholder={t("ideas.form.titlePlaceholder", { defaultValue: "Enter idea title" })} />
      </Form.Item>

      <Form.Item
        name="summary"
        label={t("ideas.form.summary", { defaultValue: "Idea summary" })}
        rules={[
          {
            required: true,
            message: t("ideas.form.summaryRequired", {
              defaultValue: "Summary is required.",
            }),
          },
        ]}
      >
        <Input.TextArea
          rows={6}
          placeholder={t("ideas.form.summaryPlaceholder", {
            defaultValue: "Write a short description of the idea",
          })}
        />
      </Form.Item>

      <Form.Item
        name="category"
        label={t("ideas.form.category", { defaultValue: "Category" })}
        rules={[
          {
            required: true,
            message: t("ideas.form.categoryRequired", {
              defaultValue: "Category is required.",
            }),
          },
        ]}
      >
        <Select
          options={categories}
          placeholder={t("ideas.form.category", { defaultValue: "Category" })}
          allowClear
        />
      </Form.Item>

      <Form.Item
        name="submitterName"
        label={t("ideas.form.submitterName", { defaultValue: "Submitter name" })}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="contactEmail"
        label={t("ideas.form.contactEmail", { defaultValue: "Contact email" })}
        rules={[
          { type: "email", message: t("auth.errors.invalidEmail", { defaultValue: "Invalid email" }) },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="phone"
        label={t("ideas.form.phone", { defaultValue: "Phone number" })}
      >
        <Input />
      </Form.Item>

      <Form.List name="teamMembers">
        {(fields, { add, remove }) => (
          <Space direction="vertical" style={{ width: "100%" }}>
            <label>{t("ideas.form.teamMembers", { defaultValue: "Team members" })}</label>
            {fields.map(({ key, name, ...rest }) => (
              <Space key={key} align="baseline">
                <Form.Item
                  {...rest}
                  name={name}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder={t("ideas.form.teamMembers", { defaultValue: "Team member" })} />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
            <Button
              icon={<PlusOutlined />}
              type="dashed"
              onClick={() => add()}
            >
              {t("ideas.form.addMember", { defaultValue: "Add member" })}
            </Button>
          </Space>
        )}
      </Form.List>

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <label>{t("ideas.form.proposalDoc", { defaultValue: "Word file (DOC / DOCX)" })}</label>
          <Upload {...docUploadProps}>
            <Button icon={<UploadOutlined />}>
              {t("ideas.form.uploadDoc", { defaultValue: "Upload Word" })}
            </Button>
          </Upload>
        </div>
        <div>
          <label>{t("ideas.form.proposalPdf", { defaultValue: "PDF file" })}</label>
          <Upload {...pdfUploadProps}>
            <Button icon={<UploadOutlined />}>
              {t("ideas.form.uploadPdf", { defaultValue: "Upload PDF" })}
            </Button>
          </Upload>
        </div>
      </Space>

      <Space style={{ marginTop: 24 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
        >
          {t("ideas.form.submit", { defaultValue: "Submit idea" })}
        </Button>
        <Button onClick={resetForm} disabled={submitting}>
          {t("ideas.form.reset", { defaultValue: "Clear form" })}
        </Button>
      </Space>
    </Form>
  );
};

export default IdeaForm;
