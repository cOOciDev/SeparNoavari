import { useEffect, useState } from "react";
import { listUsers } from "../../api";
import type { AdminUser } from "../../api";
import s from "../../styles/panel.module.scss";

export default function Users() {
  const [data, setData] = useState<AdminUser[] | null>(null);
  useEffect(()=>{ listUsers().then(setData).catch(()=>setData([])); },[]);
  return (
    <div className={s.stack}>
      <h1>Users</h1>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr></thead>
          <tbody>
            {data?.map(u=>(
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{new Date(u.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {(!data || data.length===0) && <tr><td colSpan={5} className={s.muted}>No users.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
