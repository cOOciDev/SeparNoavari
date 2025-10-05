import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthProvider";

export default function RoleRedirect() {
  const { user } = useAuth();
  const role = user?.role ?? "user";
  if (role === "admin") return <Navigate to="/panel/admin" replace />;
  if (role === "user") return <Navigate to="/account" replace />;
  if (role === "judge") return <Navigate to="/account" replace />;
  return <Navigate to="/account" replace />;
}
