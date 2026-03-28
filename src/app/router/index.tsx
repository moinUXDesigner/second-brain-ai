import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { LoginPage } from '@/features/auth/LoginPage';
import { TodayPage } from '@/features/today/TodayPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { DailyStatePage } from '@/features/daily-state/DailyStatePage';
import { AdminPage } from '@/features/admin/AdminPage';
import { CreateFlowPage } from '@/features/create/CreateFlowPage';
import { CompletedTasksPage } from '@/features/tasks/CompletedTasksPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage';

const basename = import.meta.env.BASE_URL.replace(/\/+$/, '');

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/create',
    element: (
      <ProtectedRoute>
        <CreateFlowPage />
      </ProtectedRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'completed', element: <CompletedTasksPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'daily-state', element: <DailyStatePage /> },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'admin',
        element: (
          <RoleGuard allowedRoles={['super_admin', 'admin']}>
            <AdminPage />
          </RoleGuard>
        ),
      },
    ],
  },
], { basename });
