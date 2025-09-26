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

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TRACKS = [
  { value: "", labelKey: "submit.tracks.placeholder" },
  { value: "resilience", labelKey: "submit.tracks.resilience" },
  { value: "crisis-tech", labelKey: "submit.tracks.crisisTech" },
  { value: "passive-defense", labelKey: "submit.tracks.passiveDefense" },
  { value: "emergency-logistics", labelKey: "submit.tracks.logistics" },
  { value: "health-humanitarian", labelKey: "submit.tracks.health" },
  { value: "education-awareness", labelKey: "submit.tracks.education" },
];

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
  const [fileList, setFileList] = useState<UploadFile<RcFile>[]>([]);

  useEffect(() => {
    if (!user) {
      nav(`/login?next=${encodeURIComponent("/submit")}`, { replace: true });
    }
  }, [user, nav]);

  useEffect(() => {
    document.title = t("submit.title") + " — Separ Noavari";
  }, [t]);

  const onFinish = async (values: SubmitIdeaProps) => {
    if (fileList.length === 0) {
      message.error(t("submit.errors.fileRequired"));
      return;
    }
    setSubmitting(true);

    const submitData = {
      ...values,
      file: fileList[0].originFileObj,
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

  const beforeUpload = (file: RcFile) => {
    const isAllowed =
      file.type === "application/pdf" ||
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (!isAllowed) {
      message.error(t("submit.errors.fileType"));
      return Upload.LIST_IGNORE;
    }
    const isLt50M = file.size / 1024 / 1024 < 50;
    if (!isLt50M) {
      message.error(t("submit.errors.fileSize"));
      return Upload.LIST_IGNORE;
    }
    setFileList([
      {
        uid: file.uid,
        name: file.name,
        status: "done",
        originFileObj: file,
      },
    ]);
    return false; // prevent automatic upload
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

          {/* Track */}
          <Form.Item
            label={t("submit.track")}
            name="track"
            rules={[{ required: true, message: t("submit.errors.track") }]}
          >
            <Select size="large" placeholder={t("submit.tracks.placeholder")}>
              {TRACKS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
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

          {/* File Upload */}
          <Form.Item label={t("submit.file")} required>
            <Upload
              beforeUpload={beforeUpload}
              fileList={fileList}
              onRemove={() => setFileList([])}
              maxCount={1}
              accept=".pdf,.doc,.docx"
              style={{ width: "100%" }}
            >
              <Button
                icon={<UploadOutlined />}
                size="large"
                style={{ width: "100%" }}
              >
                {t("submit.uploadFile")}
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
                placeholder={isRTL ? "نام عضو" : "Team member name"}
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
