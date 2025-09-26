import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "./pages/DefaultLayout";
import AdminLayout from "./pages/admin/AdminLayout";
import Landing from "./pages/Landing";
import TracksPage from "./pages/tracks/TracksPage";
import TrackDetail from "./pages/tracks/TrackDetail";
import CommitteePage from "./pages/committee/CommitteePage";
import SubmitIdea from "./pages/submit/SubmitIdea";
import LoginPage from "./pages/login/LoginPage";
import SignupPage from "./pages/login/SignupPage";
import AccountPage from "./pages/AccountPage";
import NewIdea from "./pages/ideas/NewIdea";
import IdeaDetail from "./pages/ideas/IdeaDetail";
import IdeaEdit from "./pages/ideas/IdeaEdit";
import IdeaExport from "./pages/ideas/IdeaExport";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminIdeas from "./pages/admin/Ideas";
import AppProvidersShell from "./components/layouts/AppProvidersShell";

export const router = createBrowserRouter([
  { element: <AppProvidersShell />, // ✅ AuthProvider now lives under the Router
    children: [
    {
    path: "/",
    element: <DefaultLayout />, // you can keep <ScrollRestoration /> inside this layout now
    children: [
      { index: true, element: <Landing /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "committee", element: <CommitteePage /> },
      { path: "tracks", element: <TracksPage /> },
      { path: "tracks/:slug", element: <TrackDetail /> },
      { path: "submit", element: <SubmitIdea /> },
      { path: "account", element: <AccountPage /> },
      { path: "ideas/new", element: <NewIdea /> },
      { path: "ideas/:id", element: <IdeaDetail /> },
      { path: "ideas/:id/edit", element: <IdeaEdit /> },
      { path: "ideas/:id/export", element: <IdeaExport /> },
    ],
  },
  {
    path: "/panel/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "ideas", element: <AdminIdeas /> },
      // … other admin routes
    ],
  },],}
]);
