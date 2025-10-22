import { Card, Descriptions, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { useMe } from "../../service/hooks";

const ProfilePage = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useMe();

  if (isLoading) {
    return (
      <Card>
        <Skeleton active />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Descriptions column={1} bordered>
          <Descriptions.Item label={t("profile.error", { defaultValue: "Error" })}>
            {error instanceof Error ? error.message : t("profile.loadFailed", { defaultValue: "Failed to load" })}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  }

  const user = data?.user;

  return (
    <Card>
      <Descriptions
        title={t("profile.title", { defaultValue: "Profile" })}
        bordered
        column={1}
        labelStyle={{ width: 160 }}
      >
        <Descriptions.Item label={t("auth.name", { defaultValue: "Name" })}>
          {user?.name || t("profile.noName", { defaultValue: "Not specified" })}
        </Descriptions.Item>
        <Descriptions.Item label={t("auth.email", { defaultValue: "Email" })}>
          {user?.email}
        </Descriptions.Item>
        <Descriptions.Item label={t("profile.role", { defaultValue: "Role" })}>
          {user?.role || "USER"}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default ProfilePage;
