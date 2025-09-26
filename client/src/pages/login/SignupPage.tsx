import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Form, Input, Button, Typography, Card } from "antd";
import { useMutation } from "@tanstack/react-query";
import SignUp from "../../service/apis/auth/SignUp/SingUp";
import type { SingUpType } from "../../service/apis/auth/SignUp/type";

type SignupForm = {
  name: string;
  email: string;
  password: string;
};

export default function SignupPage() {
  const { t, i18n } = useTranslation();
  const isRTL = (i18n.language || "en").startsWith("fa");
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const next = sp.get("next") || "/";
  // const { setUser } = useAuth();

  const { mutateAsync, status } = useMutation({
    mutationFn: SignUp,
    onSuccess: (res: SingUpType) => {
      if (res?.userId && res?.userEmail && res?.userName) {
        nav("/login");
      }
    },
  });

  const onFinish = async (values: SignupForm) => {
    await mutateAsync({
      name: values.name,
      email: values.email,
      password: values.password,
    });
  };

  return (
    <div
      className="container section"
      style={{ minHeight: "60vh", display: "flex", justifyContent: "center" }}
    >
      <Card style={{ maxWidth: 520, width: "100%" }}>
        <Typography.Title level={2} style={{ marginBottom: 6 }}>
          {t("auth.signup")}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          {t("auth.signupSub")}
        </Typography.Paragraph>

        <Form layout="vertical" onFinish={onFinish}>
          {/* Name */}
          <Form.Item
            name="name"
            label={t("auth.nameLabel")}
            rules={[{ required: true, message: t("auth.errors.required") }]}
          >
            <Input placeholder={isRTL ? "نام" : "Name"} autoComplete="name" />
          </Form.Item>

          {/* Email */}
          <Form.Item
            name="email"
            label={t("auth.emailLabel")}
            rules={[
              { required: true, message: t("auth.errors.required") },
              { type: "email", message: t("auth.errors.invalidEmail") },
            ]}
          >
            <Input
              placeholder={isRTL ? "ایمیل" : "Email"}
              autoComplete="email"
            />
          </Form.Item>

          {/* Password */}
          <Form.Item
            name="password"
            label={t("auth.password")}
            rules={[
              { required: true, message: t("auth.errors.required") },
              { min: 6, message: t("auth.errors.minPassLength") },
            ]}
          >
            <Input.Password
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Form.Item>

          {/* Submit button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={status === "pending"}
            >
              {t("auth.signup")}
            </Button>
          </Form.Item>
        </Form>

        <Typography.Paragraph style={{ marginTop: 8, fontSize: 13 }}>
          {isRTL ? "حساب دارید؟ " : "Already have an account? "}
          <Link to={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
            {t("auth.toLogin")}
          </Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
