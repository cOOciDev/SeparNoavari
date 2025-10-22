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

const MAX_30MB = 30 * 1024 * 1024;

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
  return typeof size === "number" ? size <= MAX_30MB : true;
};

const IdeaForm = ({
  categories,
  initialValues,
  submitting,
  onSubmit,
}: IdeaFormProps) => {
  const [form] = Form.useForm<IdeaFormValues>();
  const [docFileList, setDocFileList] = useState<UploadFile[]>([]);
  const [pdfFileList, setPdfFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
    if (initialValues?.proposalDoc) {
      setDocFileList([initialValues.proposalDoc]);
    } else {
      setDocFileList([]);
    }
    if (initialValues?.proposalPdf) {
      setPdfFileList([initialValues.proposalPdf]);
    } else {
      setPdfFileList([]);
    }
  }, [form, initialValues]);

  const validateFilesPair = (): boolean => {
    if (docFileList.length !== 1 || pdfFileList.length !== 1) {
      message.error("لطفاً هر دو فایل Word و PDF ایده را بارگذاری کنید.");
      return false;
    }
    const doc = docFileList[0];
    const pdf = pdfFileList[0];
    if (!doc || !isWord(doc)) {
      message.error("فایل Word معتبر انتخاب نشده است.");
      return false;
    }
    if (!pdf || !isPdf(pdf)) {
      message.error("فایل PDF معتبر انتخاب نشده است.");
      return false;
    }
    if (![doc, pdf].every(sizeOk)) {
      message.error("حجم هر فایل باید حداکثر ۳۰ مگابایت باشد.");
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
          ? "فقط فایل‌های Word با پسوند DOC یا DOCX مجاز هستند."
          : "فقط فایل‌های PDF مجاز هستند.";
      if (!validator(raw)) {
        message.error(failMessage);
        return Upload.LIST_IGNORE;
      }
      if (!sizeOk(raw)) {
        message.error("حجم هر فایل باید حداکثر ۳۰ مگابایت باشد.");
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: ({ fileList: next }) => {
      const latest = next.slice(-1).filter((item) =>
        (type === "doc" ? isWord(item) : isPdf(item)) && sizeOk(item)
      );
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
        label="عنوان ایده"
        rules={[{ required: true, message: "عنوان ایده را وارد کنید." }]}
      >
        <Input placeholder="عنوان ایده" />
      </Form.Item>

      <Form.Item
        name="summary"
        label="خلاصه ایده"
        rules={[{ required: true, message: "خلاصه ایده را وارد کنید." }]}
      >
        <Input.TextArea rows={6} placeholder="توضیح کوتاه درباره ایده" />
      </Form.Item>

      <Form.Item
        name="category"
        label="دسته‌بندی"
        rules={[{ required: true, message: "دسته‌بندی ایده را انتخاب کنید." }]}
      >
        <Select options={categories} placeholder="انتخاب دسته‌بندی" allowClear />
      </Form.Item>

      <Form.Item
        name="submitterName"
        label="نام ثبت‌کننده"
        rules={[{ required: true, message: "نام ثبت‌کننده الزامی است." }]}
      >
        <Input placeholder="نام و نام خانوادگی" disabled />
      </Form.Item>

      <Form.Item
        name="contactEmail"
        label="ایمیل تماس"
        rules={[
          { required: true, message: "ایمیل تماس الزامی است." },
          { type: "email", message: "ایمیل معتبر وارد کنید." },
        ]}
      >
        <Input placeholder="example@email.com" type="email" disabled />
      </Form.Item>

      <Form.Item name="phone" label="شماره تماس (اختیاری)">
        <Input placeholder="0912..." />
      </Form.Item>

      <Form.List name="teamMembers">
        {(fields, { add, remove }) => (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>اعضای تیم (اختیاری، حداکثر ۱۰ نفر)</span>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => {
                  if (fields.length >= 10) {
                    message.warning("حداکثر ۱۰ عضو تیم مجاز است.");
                    return;
                  }
                  add();
                }}
              >
                افزودن عضو
              </Button>
            </div>
            <Space direction="vertical" style={{ width: "100%", marginTop: 8 }}>
              {fields.map((field) => (
                <Space key={field.key} align="baseline">
                  <Form.Item
                    {...field}
                    rules={[
                      {
                        required: true,
                        message:
                          "نام عضو تیم را وارد کنید یا فیلد را حذف نمایید.",
                      },
                    ]}
                  >
                    <Input placeholder="نام عضو تیم" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}
            </Space>
          </div>
        )}
      </Form.List>

      <Form.Item label="فایل Word (DOC/DOCX)" required>
        <Upload.Dragger {...docUploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            یک فایل Word با پسوند DOC یا DOCX و حداکثر ۳۰ مگابایت بارگذاری کنید.
          </p>
        </Upload.Dragger>
      </Form.Item>

      <Form.Item label="فایل PDF" required>
        <Upload.Dragger {...pdfUploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            یک فایل PDF با حداکثر حجم ۳۰ مگابایت بارگذاری کنید.
          </p>
        </Upload.Dragger>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={submitting}>
            ارسال
          </Button>
          <Button onClick={resetForm} disabled={submitting}>
            بازنشانی
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default IdeaForm;
