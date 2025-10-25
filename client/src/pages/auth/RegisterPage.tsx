import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Card, Form, Input, Button, Typography } from "antd";
import { useRegister } from "../../service/hooks";

type RegisterFormValues = {
  name?: string;
  email: string;
  password: string;
};

const RegisterPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const nextParam = searchParams.get("next");
  const {
    mutate: register,
    isPending,
    error,
    isSuccess,
  } = useRegister();

  useEffect(() => {
    if (isSuccess && nextParam && !nextParam.startsWith("/")) {
      navigate("/", { replace: true });
    }
  }, [isSuccess, nextParam, navigate]);

  const onFinish = (values: RegisterFormValues) => {
    register({ ...values, next: nextParam });
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
          {t("auth.loginHeader", { defaultValue: "Register" })}
        </Typography.Title>
        {error ? (
          <Alert
            type="error"
            message={
              error instanceof Error ? error.message : t("auth.error", { defaultValue: "Registration failed" })
            }
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label={t("auth.nameLabel", { defaultValue: "Name" })}>
            <Input autoComplete="name" />
          </Form.Item>
          <Form.Item
            name="email"
            label={t("auth.emailLabel", { defaultValue: "Email" })}
            rules={[
              { required: true, message: t("auth.errors.required", { defaultValue: "Email is required" }) },
              { type: "email", message: t("auth.errors.invalidEmail", { defaultValue: "Invalid email" }) },
            ]}
          >
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t("auth.password", { defaultValue: "Password" })}
            rules={[
              { required: true, message: t("auth.errors.required", { defaultValue: "Password is required" }) },
              { min: 6, message: t("auth.errors.minPassword", { defaultValue: "At least 6 characters" }) },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isPending}>
              {t("auth.toSignup", { defaultValue: "Register" })}
            </Button>
          </Form.Item>
        </Form>
        <Typography.Paragraph style={{ textAlign: "center", marginBottom: 0 }}>
          {t("auth.loginSub", { defaultValue: "Already have an account?" })}{" "}
          <Link to={`/login${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`}>
            {t("auth.login", { defaultValue: "Login" })}
          </Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
};

export default RegisterPage;
