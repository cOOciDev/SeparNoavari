import type { ReactNode } from "react";
import { RoleGuard } from "../../utils/guard";

export default function RequireAdmin({ children }: { children: ReactNode }) {
  return <RoleGuard need={["ADMIN"]}>{children}</RoleGuard>;
}
