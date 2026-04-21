export type Role = 'super_admin' | 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Profile {
  userId: string;
  name: string;
  workType: string;
  routineType: string;
  commuteTime: string;
  usePersonalData: boolean;
  age: string;
  dob: string;
  financialStatus: string;
  healthStatus: string;
  customNotes: string;
  updatedAt?: string;
}

export type TaskStatus = 'Pending' | 'Done' | 'Deleted' | 'Idea' | 'Note';
export type TaskCategory =
  | 'Deep Work'
  | 'Light Work'
  | 'Admin'
  | 'Recovery'
  | 'Critical'
  | 'Critical (Reschedule or Delegate)'
  | 'Must Do'
  | 'Can Do Now'
  | 'Optional';

export type MaslowLevel =
  | 'Physiological'
  | 'Safety'
  | 'Love'
  | 'Esteem'
  | 'Self-Actualization';

export interface Task {
  id: string;
  title: string;
  type: string;
  area: string;
  notes: string;
  projectId?: string;
  maslow?: MaslowLevel | string;
  impact?: number;
  effort?: number;
  timeEstimate?: string;
  urgency?: string;
  priority?: number;
  fitScore?: number;
  confidence?: number;
  source?: string;
  status: TaskStatus;
  recurrence?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  completedAt?: string;
  category?: TaskCategory | string;
  dueDate?: string;
  deadlineDate?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  projectName?: string;
  userId?: string;
  timeSpent?: number;
  timerRunning?: boolean;
  timerStartedAt?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  domain?: string;
  status: 'Active' | 'Completed' | 'Archived' | 'Deleted';
  priority?: number;
  dueDate?: string;
  progress: number;
  subtasks: Task[];
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface DailyState {
  id: string;
  date: string;
  energy: number;
  mood: number;
  focus: number;
  availableTime?: number;
  notes?: string;
  userId?: string;
}

export type AuditAction =
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'COMPLETE_TASK'
  | 'SCHEDULE_TODAY'
  | 'CREATE_PROJECT'
  | 'UPDATE_PROJECT'
  | 'DELETE_PROJECT'
  | 'RESTORE_PROJECT'
  | 'RUN_PIPELINE'
  | 'GENERATE_TODAY'
  | 'UPDATE_STATUS'
  | 'UPDATE_PROFILE'
  | 'SAVE_DAILY_STATE'
  | 'TOGGLE_AI'
  | 'CHANGE_THEME'
  | 'LOGIN'
  | 'LOGOUT';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  severity: AuditSeverity;
  timestamp: string;
  sessionId: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface CreateInput {
  text: string;
  type: 'task' | 'project';
  area?: string;
  category?: string;
  priority?: string;
  estimatedTime?: string;
  recurrence?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  subtasks?: string[];
}

export interface AnalyzeResult {
  type: 'task' | 'project';
  title: string;
  area: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  estimatedTime: string;
  recurrence?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  subtasks: string[];
  confidence: number;
  source: 'AI' | 'RULE';
}
