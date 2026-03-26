import type { Role } from '@/types';

export const APP_NAME = 'Second Brain AI';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL || '';

export const ROLES: Record<Role, Role> = {
  super_admin: 'super_admin',
  admin: 'admin',
  user: 'user',
} as const;

export const PERMISSION_MATRIX: Record<Role, string[]> = {
  super_admin: ['*'],
  admin: [
    'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
    'projects:read', 'projects:create', 'projects:update', 'projects:delete',
    'analytics:read', 'daily-state:read', 'daily-state:create',
  ],
  user: [
    'tasks:read', 'tasks:create', 'tasks:update',
    'projects:read',
    'daily-state:read', 'daily-state:create',
  ],
};

export const TASK_CATEGORIES = [
  { value: 'Deep Work', label: 'Deep Work', color: 'bg-primary-100 text-primary-700' },
  { value: 'Light Work', label: 'Light Work', color: 'bg-success-100 text-success-700' },
  { value: 'Admin', label: 'Admin', color: 'bg-warning-100 text-warning-700' },
  { value: 'Recovery', label: 'Recovery', color: 'bg-neutral-100 text-neutral-700' },
  { value: 'Critical', label: 'Critical', color: 'bg-danger-100 text-danger-700' },
  { value: 'Critical (Reschedule or Delegate)', label: 'Reschedule/Delegate', color: 'bg-warning-100 text-warning-700' },
  { value: 'Must Do', label: 'Must Do', color: 'bg-danger-50 text-danger-600' },
  { value: 'Can Do Now', label: 'Can Do Now', color: 'bg-success-100 text-success-700' },
  { value: 'Optional', label: 'Optional', color: 'bg-neutral-100 text-neutral-600' },
] as const;

export const PRIORITY_COLORS = {
  critical: { bg: 'bg-danger-50', text: 'text-danger-600', border: 'border-danger-200' },
  important: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-200' },
  normal: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-200' },
} as const;

export const QUERY_KEYS = {
  tasks: ['tasks'] as const,
  todayTasks: ['tasks', 'today'] as const,
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  dailyState: (date: string) => ['daily-state', date] as const,
  auditLogs: ['audit-logs'] as const,
  users: ['users'] as const,
};

export const FEATURE_FLAGS = {
  AI_SUGGESTIONS: true,
  DARK_MODE: true,
  AUDIT_LOGGING: true,
  DAILY_STATE: true,
} as const;
