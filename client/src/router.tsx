import { createBrowserRouter } from 'react-router-dom';
import DefaultLayout from './pages/DefaultLayout';
import AdminLayout from './pages/admin/AdminLayout';
import Landing from './pages/landing/LandingPage';
import LandingEnhanced from './pages/landing/LandingEnhanced';
import TracksPage from './pages/tracks/TracksPage';
import TrackDetail from './pages/tracks/TrackDetail';
import CommitteePage from './pages/committee/CommitteePage';
import SubmitIdea from './pages/ideas/SubmitIdeaPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/RegisterPage';
import AccountPage from './pages/auth/ProfilePage';
import NewIdea from './pages/ideas/NewIdea';
import IdeaDetail from './pages/ideas/IdeaDetail';
import IdeaEdit from './pages/ideas/IdeaEdit';
import IdeaExport from './pages/ideas/IdeaExport';
import AdminDashboard from './pages/admin/AdminDashboardPage';
import AdminIdeas from './pages/admin/IdeasListPage';
import AdminUsers from './pages/admin/UsersListPage';
import RequireAdmin from './components/routes/RequireAdmin';
import AppProvidersShell from './components/layouts/AppProvidersShell';

export const router = createBrowserRouter([
  {
    element: <AppProvidersShell />,
    children: [
      {
        path: '/',
        element: <DefaultLayout />,
        children: [
          { index: true, element: <LandingEnhanced /> },
          { path: 'landing-old', element: <Landing /> },
          { path: 'login', element: <LoginPage /> },
          { path: 'signup', element: <SignupPage /> },
          { path: 'committee', element: <CommitteePage /> },
          { path: 'tracks', element: <TracksPage /> },
          { path: 'tracks/:slug', element: <TrackDetail /> },
          { path: 'submit', element: <SubmitIdea /> },
          { path: 'account', element: <AccountPage /> },
          { path: 'ideas/new', element: <NewIdea /> },
          { path: 'ideas/:id', element: <IdeaDetail /> },
          { path: 'ideas/:id/edit', element: <IdeaEdit /> },
          { path: 'ideas/:id/export', element: <IdeaExport /> },
        ],
      },
      {
        path: '/panel/admin',
        element: (
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'ideas', element: <AdminIdeas /> },
          { path: 'users', element: <AdminUsers /> },
        ],
      },
    ],
  },
]);

