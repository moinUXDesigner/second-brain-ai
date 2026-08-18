import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { LoginPage } from '@/features/auth/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { TodayPage } from '@/features/today/TodayPage';
import { SmartViewPage } from '@/features/today/SmartViewPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { ProjectsDashboardPage } from '@/features/projects/ProjectsDashboardPage';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { DailyStatePage } from '@/features/daily-state/DailyStatePage';
import { AdminPage } from '@/features/admin/AdminPage';
import { CreateFlowPage } from '@/features/create/CreateFlowPage';
import { CompletedTasksPage } from '@/features/tasks/CompletedTasksPage';
import { NotesIdeasPage } from '@/features/tasks/NotesIdeasPage';
import { ProfileModulesPage } from '@/features/profile/ProfileModulesPage';
import { HealthPage } from '@/features/health/HealthPage';
import { FinancePage } from '@/features/finance/FinancePage';
import { ActivityPage } from '@/features/activity/ActivityPage';
import { RecurringTasksPage } from '@/features/recurring/RecurringTasksPage';
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage';
import { DeletedProjectsPage } from '@/features/projects/DeletedProjectsPage';
import { BulkUploadPage } from '@/features/bulk-upload/BulkUploadPage';

const basename = import.meta.env.BASE_URL.replace(/\/+$/, '');

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
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
      { index: true, element: <DashboardPage /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'today/smart', element: <SmartViewPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'tasks/overdue', element: <TasksPage /> },
      { path: 'completed', element: <CompletedTasksPage /> },
      { path: 'projects-dashboard', element: <ProjectsDashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/deleted', element: <DeletedProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'daily-state', element: <DailyStatePage /> },
      { path: 'health', element: <HealthPage /> },
      { path: 'finance', element: <FinancePage /> },
      { path: 'profile', element: <Navigate to="/profile/basic" replace /> },
      { path: 'profile/:section', element: <ProfileModulesPage /> },
      { path: 'activity', element: <ActivityPage /> },
      { path: 'bulk-upload', element: <BulkUploadPage /> },
      { path: 'notes-ideas', element: <NotesIdeasPage /> },
      { path: 'recurring', element: <RecurringTasksPage /> },
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
