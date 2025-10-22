// client/src/pages/system/ErrorBoundaryPage.tsx
import { Component, type ReactNode, type JSX } from "react";
import { Button, Result } from "antd";
import { Link, useRouteError } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

type Props = {
  children: ReactNode;
  t: TFunction;
};

type State = {
  hasError: boolean;
  error?: Error;
};

class ErrorBoundaryBase extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined }, () => {
      // در یک پروژه SPA، می‌تونی به‌جای reload، state/route رو ریست کنی.
      window.location.reload();
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, t } = this.props;

    if (!hasError) return children as JSX.Element;

    return (
      <Result
        status="error"
        title={t("system.errorTitle", { defaultValue: "Something went wrong" })}
        subTitle={
          error?.message ||
          t("system.errorSubTitle", {
            defaultValue: "An unexpected error occurred. Please try again.",
          })
        }
        extra={[
          <Button key="retry" type="primary" onClick={this.handleRetry}>
            {t("system.retry", { defaultValue: "Retry" })}
          </Button>,
          <Link key="home" to="/">
            <Button>
              {t("system.backHome", { defaultValue: "Back Home" })}
            </Button>
          </Link>,
        ]}
      />
    );
  }
}

/** Wrapper تابعی برای تزریق t از i18n به کلاس */
export const AppErrorBoundary = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  return <ErrorBoundaryBase t={t}>{children}</ErrorBoundaryBase>;
};

export const RouteErrorBoundary = () => {
  const { t } = useTranslation();
  const error = useRouteError() as
    | { statusText?: string; message?: string }
    | undefined;

  return (
    <Result
      status="error"
      title={t("system.oops", { defaultValue: "Oops" })}
      subTitle={
        error?.message ||
        error?.statusText ||
        t("system.errorSubTitle", {
          defaultValue: "An unexpected error occurred. Please try again.",
        })
      }
      extra={
        <Link to="/">
          <Button type="primary">
            {t("system.backHome", { defaultValue: "Back Home" })}
          </Button>
        </Link>
      }
    />
  );
};

export default AppErrorBoundary;
