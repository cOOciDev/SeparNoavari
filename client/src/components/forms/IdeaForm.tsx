import { useState } from "react";
import {
  Form,
  Input,
  Select,
  Upload,
  Button,
  Space,
  type UploadFile,
  type UploadProps,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

export type IdeaFormValues = {
  title: string;
  summary: string;
  category: string;
  files: UploadFile[];
};

export type IdeaFormProps = {
  categories: Array<{ label: string; value: string }>;
  initialValues?: Partial<IdeaFormValues>;
  submitting?: boolean;
  onSubmit: (values: IdeaFormValues) => void;
};

const IdeaForm = ({ categories, initialValues, submitting, onSubmit }: IdeaFormProps) => {
  const [form] = Form.useForm<IdeaFormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>(initialValues?.files ?? []);

  const handleFinish = (values: IdeaFormValues) => {
    onSubmit({ ...values, files: fileList });
  };

  const uploadProps: UploadProps = {
    fileList,
    multiple: true,
    beforeUpload: () => false,
    onChange: ({ fileList: nextList }) => setFileList(nextList),
  };

  return (
    <Form form={form} layout="vertical" initialValues={initialValues} onFinish={handleFinish}>
      <Form.Item
        name="title"
        label="Title"
        rules={[{ required: true, message: "Please enter the title" }]}
      >
        <Input placeholder="Idea title" />
      </Form.Item>

      <Form.Item
        name="summary"
        label="Summary"
        rules={[{ required: true, message: "Please provide a summary" }]}
      >
        <Input.TextArea rows={6} placeholder="Describe your idea" />
      </Form.Item>

      <Form.Item
        name="category"
        label="Category"
        rules={[{ required: true, message: "Select a category" }]}
      >
        <Select options={categories} placeholder="Choose" allowClear />
      </Form.Item>

      <Form.Item label="Files" required>
        <Upload.Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag files to upload</p>
        </Upload.Dragger>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Submit
          </Button>
          <Button onClick={() => form.resetFields()} disabled={submitting}>
            Reset
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default IdeaForm;
