import { Result, Button } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <Result
      status="404"
      title="404"
      subTitle={t("system.notFound", { defaultValue: "The page you visited does not exist." })}
      extra={
        <Link to="/">
          <Button type="primary">{t("system.backHome", { defaultValue: "Back Home" })}</Button>
        </Link>
      }
    />
  );
};

export default NotFoundPage;
