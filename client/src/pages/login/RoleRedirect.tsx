import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function RoleRedirect() {
  const { user } = useAuth();
  const role = user?.role ?? "user";
  if (role === "admin") return <Navigate to="/panel/admin" replace />;
  if (role === "user") return <Navigate to="/panel/user" replace />;
  if (role === "judge") return <Navigate to="/panel/judge" replace />;
  return <Navigate to="/account" replace />;
}
