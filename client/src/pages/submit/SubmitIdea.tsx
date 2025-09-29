import { useEffect, useState } from "react";
import type { UploadFile } from "antd";
import type { RcFile } from "antd/es/upload/interface";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Form,
  Input,
  Button,
  Select,
  Typography,
  Upload,
  message,
  Space,
  Tag,
  Card,
} from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import submitIdea, {
  type SubmitIdeaProps,
} from "../../service/apis/idea/submitIdea/submitIdea";
import { useAuth } from "../../contexts/AuthProvider";
import { TRACKS } from "../../AppData/tracks";

type SubmitIdeaFormValues = Omit<SubmitIdeaProps, "pdf_file" | "word_file" | "team_members">;

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function SubmitIdeaPage() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const isRTL = (i18n.language || "en").startsWith("fa");
  const { user } = useAuth();

  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [pdfFileList, setPdfFileList] = useState<UploadFile<RcFile>[]>([]);
  const [wordFileList, setWordFileList] = useState<UploadFile<RcFile>[]>([]);

  useEffect(() => {
    if (!user) {
      nav(`/login?next=${encodeURIComponent("/submit")}`, { replace: true });
    }
  }, [user, nav]);

  useEffect(() => {
    document.title = t("submit.title") + "  Separ Noavari";
  }, [t]);

  const onFinish = async (values: SubmitIdeaFormValues) => {
    const pdfFile = pdfFileList[0]?.originFileObj as File | undefined;
    if (!pdfFile) {
      message.error(t("submit.errors.fileRequired"));
      return;
    }
    const wordFile = wordFileList[0]?.originFileObj as File | undefined;
    if (!wordFile) {
      message.error(
        t("submit.errors.wordRequired", {
          defaultValue: t("submit.errors.fileRequired"),
        })
      );
      return;
    }
    setSubmitting(true);

    const submitData: SubmitIdeaProps = {
      ...values,
      pdf_file: pdfFile,
      word_file: wordFile,
      team_members: teamMembers,
    };

    try {
      const res = await submitIdea(submitData);
      if (res.ideaId) {
        message.success(t("submit.success.text"));
        setDone(true);
      } else {
        message.error(t("submit.errors.submitFailed"));
      }
    } catch {
      message.error(t("submit.errors.submitFailed"));
    }
    setSubmitting(false);
  };


  const onAddMember = () => {
    const name = memberInput.trim();
    if (name && !teamMembers.includes(name)) {
      setTeamMembers((prev) => [...prev, name]);
      setMemberInput("");
    }
  };

  const onRemoveMember = (name: string) => {
    setTeamMembers((prev) => prev.filter((m) => m !== name));
  };

  const beforeUploadPdf = (file: RcFile) => {
    const isPdf = file.type === "application/pdf";
    if (!isPdf) {
      message.error(t("submit.errors.fileType"));
      return Upload.LIST_IGNORE;
    }
    const isLt30M = file.size / 1024 / 1024 < 30;
    if (!isLt30M) {
      message.error(t("submit.errors.fileSize"));
      return Upload.LIST_IGNORE;
    }
    setPdfFileList([
      {
        uid: file.uid,
        name: file.name,
        status: "done",
        originFileObj: file,
      },
    ]);
    console.log("pdfFileList ", pdfFileList);
    return false;
  };

  const beforeUploadWord = (file: RcFile) => {
    const isWord =
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (!isWord) {
      message.error(t("submit.errors.fileType"));
      return Upload.LIST_IGNORE;
    }
    const isLt30M = file.size / 1024 / 1024 < 30;
    if (!isLt30M) {
      message.error(t("submit.errors.fileSize"));
      return Upload.LIST_IGNORE;
    }
    setWordFileList([
      {
        uid: file.uid,
        name: file.name,
        status: "done",
        originFileObj: file,
      },
    ]);
    return false;
  };

  if (done) {
    return (
      <main style={{ maxWidth: 600, margin: "auto", padding: 24 }}>
        <Title level={3}>{t("submit.success.title")}</Title>
        <Text>{t("submit.success.text")}</Text>
        <br />
        <Button type="primary" href="/account" style={{ marginTop: 20 }}>
          {t("submit.success.back")}
        </Button>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "auto",
        padding: 24,
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      <Card style={{ width: "100%" }}>
        <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
          {t("submit.title")}
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            submitter_full_name: user?.userName || "",
            contact_email: user?.userEmail || "",
          }}
        >
          {/* Name & Email */}
          <Form.Item
            label={t("submit.submitterName")}
            name="submitter_full_name"
            rules={[
              { required: true, message: t("submit.errors.submitterName") },
            ]}
          >
            <Input size="large" placeholder={t("submit.submitterName")} />
          </Form.Item>

          <Form.Item
            label={t("submit.contactEmail")}
            name="contact_email"
            rules={[
              { required: true, message: t("submit.errors.email") },
              { type: "email", message: t("submit.errors.emailValid") },
            ]}
          >
            <Input size="large" placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            label={t("submit.contactPhone")}
            name="phone"
            rules={[
              { required: true, message: t("submit.errors.phone") },
              {
                pattern: /^(\+?[0-9\-\s()]{7,20})$/,
                message: t("submit.errors.phoneValid"),
              },
            ]}
          >
            <Input size="large" placeholder={isRTL ? "0912xxxxxxx" : "+98 (912) xxx-xxxx"} />
          </Form.Item>

          {/* Track */}
          <Form.Item
            label={t("submit.track")}
            name="track"
            rules={[{ required: true, message: t("submit.errors.track") }]}
          >
            <Select size="large" placeholder={t("submit.tracks.placeholder")}>
              {TRACKS.map((opt) => (
                <Option key={opt.slug} value={opt.slug}>
                  {t(opt.titleKey)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Idea Title */}
          <Form.Item
            label={t("submit.ideaTitle")}
            name="idea_title"
            rules={[{ required: true, message: t("submit.errors.title") }]}
          >
            <Input size="large" placeholder={t("submit.ideaTitle")} />
          </Form.Item>

          {/* Executive Summary */}
          <Form.Item
            label={t("submit.executiveSummary")}
            name="executive_summary"
            rules={[
              { required: true, message: t("submit.errors.summary") },
              { min: 50, message: t("submit.errors.summaryLength") },
            ]}
          >
            <TextArea rows={6} placeholder={t("submit.executiveSummary")} />
          </Form.Item>

          {/* File Uploads */}
          <Form.Item label={t("submit.file")} required>
            <Upload
              beforeUpload={beforeUploadPdf}
              fileList={pdfFileList}
              onRemove={() => setPdfFileList([])}
              maxCount={1}
              accept=".pdf"
              style={{ width: "100%" }}
            >
              <Button
                icon={<UploadOutlined />}
                size="large"
                style={{ width: "100%" }}
              >
                {t("submit.uploadFile")} (PDF {"<"} 30MB)
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item label={t("submit.file2")} required>
            <Upload
              beforeUpload={beforeUploadWord}
              fileList={wordFileList}
              onRemove={() => setWordFileList([])}
              maxCount={1}
              accept=".doc,.docx"
              style={{ width: "100%" }}
            >
              <Button
                icon={<UploadOutlined />}
                size="large"
                style={{ width: "100%" }}
              >
                {t("submit.uploadFile")} (Word {"<"} 30MB)
              </Button>
            </Upload>
          </Form.Item>

          {/* Team Members */}
          <Form.Item label={t("submit.teamMembers")}>
            <Space style={{ marginBottom: 12 }} wrap>
              <Input
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onPressEnter={(e) => {
                  e.preventDefault();
                  onAddMember();
                }}
                placeholder={isRTL ? "نام عضو تیم" : "Team member name"}
                style={{ width: 240 }}
                size="middle"
              />
              <Button
                type="dashed"
                onClick={onAddMember}
                icon={<PlusOutlined />}
              >
                {t("submit.addMember")}
              </Button>
            </Space>
            <div style={{ marginTop: 8 }}>
              {teamMembers.map((member) => (
                <Tag
                  key={member}
                  closable
                  onClose={() => onRemoveMember(member)}
                  style={{ marginBottom: 6 }}
                >
                  {member}
                </Tag>
              ))}
            </div>
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              size="large"
              block
              style={{ borderRadius: 6 }}
            >
              {submitting ? t("submit.sending") : t("submit.send")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </main>
  );
}

