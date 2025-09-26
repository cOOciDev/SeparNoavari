import ReactQueryProvider from "./contexts/ReactQueryContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { router } from "./router";
import { AuthProvider } from "./contexts/AuthProvider";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReactQueryProvider>
          <RouterProvider router={router} />
          <Toaster />
        </ReactQueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
