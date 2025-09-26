import { Navigate } from "react-router-dom";
export default function AdminIndex() {
  // می‌تونی اینجا چک پرمیشن هم انجام بدی
  return <Navigate to="/panel/admin/dashboard" replace />;
}
