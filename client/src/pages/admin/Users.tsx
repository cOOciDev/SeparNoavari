import { useTranslation } from "react-i18next";
import { Spin, Select, message } from "antd";
import { useAdminUsers } from "../../service/hooks/useAdminData";
import s from "../../styles/panel.module.scss";
import api from "../../service/api";
import { useState } from "react";
import { useQueryClient } from '@tanstack/react-query';

function formatDate(iso?: string | null) {
  if (!iso) return '-';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleString();
}

export default function Users() {
  const { t } = useTranslation();
  const { users, isLoading } = useAdminUsers();
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();

  return (
    <div className={s.stack}>
      <h1>{t('admin.users.title')}</h1>
      <div className={s.tableWrap}>
        {isLoading ? (
          <div className={s.center}><Spin /></div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>{t('admin.users.table.name')}</th>
                <th>{t('admin.users.table.email')}</th>
                <th>{t('admin.users.table.role')}</th>
                <th>{t('admin.users.table.ideas')}</th>
                <th>{t('admin.users.table.lastSubmission')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name || t('admin.users.unnamed')}</td>
                  <td>{user.email || '-'}</td>
                    <td>
                      <Select
                        value={user.role}
                        onChange={async (val) => {
                          const prev = user.role;
                          try {
                            setUpdating((s) => ({ ...s, [String(user.id)]: true }));
                            await api.put(`/admin/users/${user.id}/role`, { role: val });
                            // refetch users list so UI stays in sync
                            await qc.invalidateQueries({ queryKey: ['admin', 'users'] });
                            message.success(t('admin.users.roleUpdatedWithValues', { prev, next: val }));
                          } catch (err) {
                            console.error(err);
                            message.error(t('admin.users.roleUpdateFailed'));
                          } finally {
                            setUpdating((s) => ({ ...s, [String(user.id)]: false }));
                          }
                        }}
                        style={{ width: 140 }}
                        options={[
                          { label: t('admin.users.roles.user'), value: 'user' },
                          { label: t('admin.users.roles.judge'), value: 'judge' },
                          { label: t('admin.users.roles.admin'), value: 'admin' },
                        ]}
                        disabled={updating[String(user.id)]}
                      />
                      {updating[String(user.id)] && <Spin size="small" style={{ marginLeft: 8 }} />}
                    </td>
                  <td>{user.ideasCount ?? '-'}</td>
                  <td>{formatDate(user.lastSubmissionAt)}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className={s.muted}>
                    {t('admin.users.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
