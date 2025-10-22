import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../contexts/AuthProvider";

type Role = "ADMIN" | "JUDGE" | "USER";

const CenteredSpinner = () => (
  <div style={{ display: "grid", placeItems: "center", minHeight: "40vh" }}>
    <Spin size="large" />
  </div>
);

type RouteGuardProps = {
  children: ReactNode;
};

export const RouteGuard = ({ children }: RouteGuardProps) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <CenteredSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ next: location.pathname + location.search }} replace />;
  }

  return <>{children}</>;
};

type RoleGuardProps = {
  need: Role[];
  children: ReactNode;
};

export const RoleGuard = ({ need, children }: RoleGuardProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <CenteredSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ next: location.pathname + location.search }} replace />;
  }

  if (!need.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;
