import type { ReactNode } from 'react';
import RequireAuth from '../../pages/login/RequireAuth';

export default function RequireAdmin({ children }: { children: ReactNode }) {
  return <RequireAuth roles={['admin']}>{children}</RequireAuth>;
}

