import { lazy, Suspense, type JSX } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import UserLayout from '../layouts/UserLayout';
import JudgeLayout from '../layouts/JudgeLayout';
import AdminLayout from '../layouts/AdminLayout';
import { RouteGuard, RoleGuard } from '../utils/guard';
import NotFoundPage from '../pages/system/NotFoundPage';
import { RouteErrorBoundary } from '../pages/system/ErrorBoundaryPage';
import { PageLoader } from './PageLoader';

const LandingPage = lazy(() => import('../pages/landing/LandingPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ProfilePage = lazy(() => import('../pages/auth/ProfilePage'));
const SubmitIdeaPage = lazy(() => import('../pages/ideas/SubmitIdeaPage'));
const MyIdeasPage = lazy(() => import('../pages/ideas/MyIdeasPage'));
const IdeaDetailPage = lazy(() => import('../pages/ideas/IdeaDetailPage'));
const JudgeDashboardPage = lazy(() => import('../pages/judge/JudgeDashboardPage'));
const JudgeIdeaDetailPage = lazy(() => import('../pages/judge/JudgeIdeaDetailPage'));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const IdeasListPage = lazy(() => import('../pages/admin/IdeasListPage'));
const IdeaAdminDetailPage = lazy(() => import('../pages/admin/IdeaAdminDetailPage'));
const JudgesListPage = lazy(() => import('../pages/admin/JudgesListPage'));
const AssignmentsPage = lazy(() => import('../pages/admin/AssignmentsPage'));
const UsersListPage = lazy(() => import('../pages/admin/UsersListPage'));
const TracksPage = lazy(() => import('../pages/tracks/TracksPage'));
const CommitteePage = lazy(() => import('../pages/committee/CommitteePage'));



const withSuspense = (node: JSX.Element) => (
  <Suspense fallback={<PageLoader />}>{node}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(<LandingPage />) },
      { path: 'login', element: withSuspense(<LoginPage />) },
      { path: 'register', element: withSuspense(<RegisterPage />) },
      { path: 'tracks', element: withSuspense(<TracksPage />) },
      { path: 'committee', element: withSuspense(<CommitteePage />) },
    ],
  },
  {
    path: '/',
    element: (
      <RouteGuard>
        <UserLayout />
      </RouteGuard>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: 'profile', element: withSuspense(<ProfilePage />) },
      { path: 'ideas/new', element: withSuspense(<SubmitIdeaPage />) },
      { path: 'ideas/mine', element: withSuspense(<MyIdeasPage />) },
      { path: 'ideas/:id', element: withSuspense(<IdeaDetailPage />) },
    ],
  },
  {
    path: '/judge',
    element: (
      <RouteGuard>
        <RoleGuard need={['JUDGE']}>
          <JudgeLayout />
        </RoleGuard>
      </RouteGuard>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(<JudgeDashboardPage />) },
      { path: 'ideas/:id', element: withSuspense(<JudgeIdeaDetailPage />) },
    ],
  },
  {
    path: '/admin',
    element: (
      <RouteGuard>
        <RoleGuard need={['ADMIN']}>
          <AdminLayout />
        </RoleGuard>
      </RouteGuard>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(<AdminDashboardPage />) },
      { path: 'ideas', element: withSuspense(<IdeasListPage />) },
      { path: 'ideas/:id', element: withSuspense(<IdeaAdminDetailPage />) },
      { path: 'judges', element: withSuspense(<JudgesListPage />) },
      { path: 'assignments', element: withSuspense(<AssignmentsPage />) },
      { path: 'users', element: withSuspense(<UsersListPage />) },
    ],
  },
  { path: '*', element: withSuspense(<NotFoundPage />) },
]);

export default router;
