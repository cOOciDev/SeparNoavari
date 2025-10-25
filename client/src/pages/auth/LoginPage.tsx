import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Card, Form, Input, Button, Typography } from "antd";
import { useLogin } from "../../service/hooks";

type LoginFormValues = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const nextParam = searchParams.get("next");
  const {
    mutate: login,
    isPending,
    error,
    isSuccess,
  } = useLogin();

  useEffect(() => {
    if (isSuccess && nextParam && !nextParam.startsWith("/")) {
      navigate("/", { replace: true });
    }
  }, [isSuccess, nextParam, navigate]);

  const onFinish = (values: LoginFormValues) => {
    login({ ...values, next: nextParam });
  };

  const isRTL = (i18n.language || "fa").startsWith("fa");

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "70vh",
      }}
    >
      <Card style={{ width: "100%", maxWidth: 420 }} dir={isRTL ? "rtl" : "ltr"}>
        <Typography.Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
          {t("auth.signupHeader", { defaultValue: "Login" })}
        </Typography.Title>
        {error ? (
          <Alert
            type="error"
            message={error instanceof Error ? error.message : t("auth.error", { defaultValue: "Login failed" })}
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="email"
            label={t("auth.emailLabel", { defaultValue: "Email" })}
            rules={[
              { required: true, message: t("auth.errors.required", { defaultValue: "Email is required" }) },
              { type: "email", message: t("auth.errors.invalidEmail", { defaultValue: "Invalid email" }) },
            ]}
          >
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t("auth.password", { defaultValue: "Password" })}
            rules={[{ required: true, message: t("auth.errors.required", { defaultValue: "Password is required" }) }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isPending}>
              {t("auth.login", { defaultValue: "Login" })}
            </Button>
          </Form.Item>
        </Form>
        <Typography.Paragraph style={{ textAlign: "center", marginBottom: 0 }}>
          {t("auth.signupSub", { defaultValue: "Don't have an account?" })}{" "}
          <Link to={`/register${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`}>
            {t("auth.signup", { defaultValue: "Register" })}
          </Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
};

export default LoginPage;
