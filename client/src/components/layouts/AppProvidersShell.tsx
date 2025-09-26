import { Outlet } from "react-router-dom";
// … other admin imports
import { AuthProvider } from "../../contexts/AuthContext";

export default function AppProvidersShell() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}