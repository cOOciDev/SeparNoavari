import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Form, Input, Button, Typography, Card, message } from "antd";
import { useMutation } from "@tanstack/react-query";
import SignUp from "../../service/apis/auth/SignUp/SingUp";
import type { SingUpType } from "../../service/apis/auth/SignUp/type";
import { useAuth } from "../../contexts/AuthProvider";

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
  const nextParam = sp.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/";
  const { refreshUser, setUser } = useAuth();

  const { mutateAsync, status } = useMutation<SingUpType, any, SignupForm>({
    mutationFn: async (variables) => SignUp(variables),
    onSuccess: async (res) => {
      if (res?.user) {
        setUser({
          userEmail: res.user.email,
          userId: res.user.id,
          userName: res.user.name ?? "",
          role:
            res.user.role === "admin"
              ? "admin"
              : res.user.role === "judge"
              ? "judge"
              : "user",
        });
      }

      const attempts = 3;
      let result: "ok" | "unauthorized" | "error" = "error";
      for (let i = 0; i < attempts; i += 1) {
        result = await refreshUser({ clearOnFail: i === attempts - 1 });
        if (result === "ok") break;
        if (i < attempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      if (result === "ok") {
        nav(next, { replace: true });
        return;
      }

      const fallback =
        t("auth.errors.signupFailed") || "Signup failed. Please try again.";
      if (result === "unauthorized") {
        message.error(
          t("auth.errors.invalidCredentials") || fallback
        );
        setUser(null);
        return;
      }
      message.error(
        t("auth.errors.sessionFailed") || fallback
      );
      setUser(null);
    },
    onError: (error: any) => {
      const status = error?.status;
      const messageKey =
        status === 401 || status === 403
          ? "auth.errors.invalidCredentials"
          : "auth.errors.signupFailed";
      setUser(null);
      message.error(
        t(messageKey) ||
          (status === 401 || status === 403
            ? "Invalid email or password."
            : "Signup failed. Please try again.")
      );
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
              <Input placeholder={t("auth.nameLabel")} autoComplete="name" />
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
              placeholder={t("auth.emailLabel")}
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
              placeholder={t("auth.password")}
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
          {t("auth.alreadyHaveAccount")}
          <Link
            to={`/login${
              nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""
            }`}
          >
            {t("auth.toLogin")}
          </Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}





