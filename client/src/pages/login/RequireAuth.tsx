import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function RequireAuth({
  children,
  roles
}: {
  children: ReactNode;
  roles?: Array<"user" | "admin" | "judge">;
}) {
  const { isAuthenticated, user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null; // or a spinner

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }

  if (roles && user && !roles.includes((user.role as any) ?? "user")) {
    // If logged in but not allowed, send to their home
    return <Navigate to="/me" replace />;
  }

  return <>{children}</>;
}
