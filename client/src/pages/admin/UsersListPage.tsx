import { useState } from "react";
import { Card, Space, Select, Spin, Alert, Table, Modal, message } from "antd";
import { useTranslation } from "react-i18next";
import type { Role, User } from "../../types/domain";
import { useAdminUsers, useUpdateUserRole } from "../../service/hooks";

const ROLE_OPTIONS: Role[] = ["USER", "JUDGE", "ADMIN"];

const UsersListPage = () => {
  const { t } = useTranslation();
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const usersQuery = useAdminUsers({ role: roleFilter === "ALL" ? undefined : roleFilter, page, pageSize });
  const updateRole = useUpdateUserRole();

  if (usersQuery.isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (usersQuery.error) {
    const messageText =
      usersQuery.error instanceof Error
        ? usersQuery.error.message
        : t("admin.users.error", { defaultValue: "Failed to load users" });
    return (
      <Card>
        <Alert type="error" message={messageText} />
      </Card>
    );
  }

  const changeRole = (user: User, nextRole: Role) => {
    if (user.role === nextRole) return;
    Modal.confirm({
      title: t("admin.users.changeRoleTitle", { defaultValue: "Change user role" }),
      content: t("admin.users.changeRoleContent", {
        defaultValue: "Change role for {{user}} to {{role}}?",
        user: user.name || user.email,
        role: nextRole,
      }),
      onOk: async () => {
        try {
          await updateRole.mutateAsync({ id: String(user.id), role: nextRole });
          message.success(t("admin.users.roleUpdated", { defaultValue: "Role updated" }));
        } catch (err: any) {
          message.error(err?.message || t("admin.users.roleUpdateFailed", { defaultValue: "Failed to update role" }));
        }
      },
    });
  };

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card>
        <Select
          style={{ minWidth: 180 }}
          value={roleFilter}
          onChange={(value) => {
            setRoleFilter(value as Role | "ALL");
            setPage(1);
          }}
          options={[{ value: "ALL", label: t("admin.users.allRoles", { defaultValue: "All roles" }) }, ...ROLE_OPTIONS.map((role) => ({
            value: role,
            label: role,
          }))]}
        />
      </Card>

      <Card>
        <Table<User>
          rowKey={(record) => String(record.id)}
          dataSource={usersQuery.data?.items ?? []}
          loading={updateRole.isPending}
          pagination={{
            total: usersQuery.data?.total ?? 0,
            current: page,
            pageSize,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
          columns={[
            {
              title: t("admin.users.name", { defaultValue: "Name" }),
              dataIndex: "name",
              key: "name",
            },
            {
              title: t("admin.users.email", { defaultValue: "Email" }),
              dataIndex: "email",
              key: "email",
            },
            {
              title: t("admin.users.role", { defaultValue: "Role" }),
              dataIndex: "role",
              key: "role",
              render: (_: unknown, record: User) => (
                <Select
                  size="small"
                  value={record.role}
                  style={{ minWidth: 120 }}
                  onChange={(value) => changeRole(record, value as Role)}
                  options={ROLE_OPTIONS.map((role) => ({ value: role, label: role }))}
                />
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
};

export default UsersListPage;
