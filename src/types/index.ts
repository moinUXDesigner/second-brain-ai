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
  availableTime: 'Low' | 'Medium' | 'High';
  commuteTime: string;
  usePersonalData: boolean;
  age: string;
  dob: string;
  financialStatus: string;
  healthStatus: string;
  customNotes: string;
  updatedAt?: string;
}

export type TaskStatus = 'Pending' | 'Done';
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
  completedAt?: string;
  category?: TaskCategory | string;
  dueDate?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'Active' | 'Completed' | 'Archived';
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
  notes?: string;
  userId?: string;
}

export type AuditAction =
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'CREATE_PROJECT'
  | 'UPDATE_PROJECT'
  | 'RUN_PIPELINE'
  | 'GENERATE_TODAY'
  | 'LOGIN'
  | 'LOGOUT';

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
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
}
