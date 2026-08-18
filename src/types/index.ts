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
  phaseId?: string | null;
  phaseName?: string;
  milestoneId?: string | null;
  milestoneName?: string;
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
  reminderAt?: string | null;
  reminderEnabled?: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  projectName?: string;
  userId?: string;
  timeSpent?: number;
  timerRunning?: boolean;
  timerStartedAt?: string;
  images?: TaskImage[];
}

export interface TaskImage {
  id: string;
  name: string;
  url: string;
  type?: string;
  size?: number;
}

export interface TaskRevisionSuggestion {
  priority: number;
  urgency: 'Low' | 'Medium' | 'High';
  dueDate: string | null;
  timeEstimate: string;
  category?: string;
  confidence?: number;
  source: 'AI' | 'RULE';
}

export interface AppNotification {
  id: string;
  type: string;
  data: {
    kind?: string;
    title?: string;
    message?: string;
    taskId?: string;
    taskTitle?: string;
    dueDate?: string | null;
    deadlineDate?: string | null;
    reminderAt?: string | null;
  };
  readAt?: string;
  createdAt?: string;
}

export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
}

export type ProjectPhaseStatus = 'Planned' | 'Active' | 'Completed';

export interface ProjectPhase {
  id: string;
  title: string;
  description?: string;
  status: ProjectPhaseStatus;
  createdAt?: string;
}

export type ProjectMilestoneStatus = 'Planned' | 'Completed';

export interface ProjectMilestone {
  id: string;
  title: string;
  phaseId?: string;
  dueDate?: string;
  status: ProjectMilestoneStatus;
  createdAt?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  domain?: string;
  status: 'Active' | 'Completed' | 'Archived' | 'Deleted';
  priority?: number;
  priorityMode?: 'auto' | 'manual';
  manualPriority?: number | null;
  autoPriority?: number;
  maslowLevel?: MaslowLevel | string;
  dueDate?: string;
  phases?: ProjectPhase[];
  milestones?: ProjectMilestone[];
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
  activityPreference?: 'Any' | 'Indoor' | 'Outdoor';
  notes?: string;
  updatedAt?: string;
  userId?: string;
}

export type FinanceBucket = 'asset' | 'loan' | 'receivable' | 'handloan';

export interface FinanceEntry {
  id: string;
  bucket: FinanceBucket;
  title: string;
  amount: number;
  counterparty?: string;
  dueDate?: string;
  status: string;
  notes?: string;
  zakatEligible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceSummary {
  totals: Record<FinanceBucket, number>;
  counts: Record<FinanceBucket, number>;
  netPosition: number;
  zakatBase: number;
  zakatEstimate: number;
  activeEntryCount: number;
  entryCount: number;
}

export type FinanceEntryPayload = Omit<FinanceEntry, 'id' | 'createdAt' | 'updatedAt'>;

export type FinanceListResponse = ApiResponse<FinanceEntry[]> & {
  total: number;
};

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
  dueDate?: string;
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
  dueDate?: string;
  recurrence?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  subtasks: string[];
  confidence: number;
  source: 'AI' | 'RULE';
}
