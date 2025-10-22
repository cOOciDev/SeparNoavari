import { RouterProvider } from "react-router-dom";
import AppProviders from "./AppProviders";
import router from "./routes";
import AppErrorBoundary from "../pages/system/ErrorBoundaryPage";

const App = () => (
  <AppProviders>
    <AppErrorBoundary>
      <RouterProvider router={router} />
    </AppErrorBoundary>
  </AppProviders>
);

export default App;
