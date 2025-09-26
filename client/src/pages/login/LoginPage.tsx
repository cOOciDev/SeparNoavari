import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Form, Input, Button, Typography, message, Card } from "antd";
import { useMutation } from "@tanstack/react-query";
import Login from "../../service/apis/auth/Login/Login";
import { useAuth } from "../../contexts/AuthProvider";
import type { LoginType } from "../../service/apis/auth/Login/type";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const isRTL = (i18n.language || "en").startsWith("fa");
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const next = sp.get("next") || "/";
  const { setUser } = useAuth();

  const { mutateAsync, status } = useMutation({
    mutationFn: Login,
    onSuccess: (res: LoginType) => {
      console.log(res);
      if (res?.id && res?.email) {
        setUser({
          userName: res.userName,
          userEmail: res.email,
          userId: res.id,
        });
        nav("/");
      }

      // message.success(t("auth.loginSuccess"));
    },
    onError: () => {
      message.error(t("auth.errors.invalidCredentials"));
    },
  });

  const onFinish = async (values: LoginForm) => {
    await mutateAsync({
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
          {t("auth.login")}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          {t("auth.loginSub")}
        </Typography.Paragraph>

        <Form layout="vertical" onFinish={onFinish}>
          {/* Email or phone */}
          <Form.Item
            name="email"
            label={t("auth.idLabel")}
            rules={[{ required: true, message: t("auth.errors.required") }]}
          >
            <Input
              placeholder={isRTL ? "ایمیل یا شماره موبایل" : "Email or phone"}
              autoComplete="username"
            />
          </Form.Item>

          {/* Password */}
          <Form.Item
            name="password"
            label={t("auth.password")}
            rules={[{ required: true, message: t("auth.errors.required") }]}
          >
            <Input.Password
              placeholder="••••••••"
              autoComplete="current-password"
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
              {t("auth.login")}
            </Button>
          </Form.Item>
        </Form>

        <Typography.Paragraph style={{ marginTop: 8, fontSize: 13 }}>
          {isRTL ? "حساب ندارید؟ " : "No account? "}
          <Link
            to={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          >
            {t("auth.toSignup")}
          </Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
