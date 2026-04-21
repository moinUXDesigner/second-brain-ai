import type { AuditLog, AuditAction, AuditSeverity, ApiResponse, PaginatedResponse } from '@/types';

const STORAGE_KEY = 'audit_logs';
const PENDING_KEY = 'pending_audit_logs';
const MAX_LOGS = 2000;
const SESSION_KEY = 'audit_session_id';

// Persistent session ID — survives page refreshes, new one per login
function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function resetSessionId(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

// ── Storage helpers ──

function getLocalLogs(): AuditLog[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalLogs(logs: AuditLog[]) {
  // Keep most recent, trim from front
  const trimmed = logs.length > MAX_LOGS ? logs.slice(logs.length - MAX_LOGS) : logs;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/** Merge any legacy pending_audit_logs into audit_logs (one-time migration) */
function migratePendingLogs() {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]') as AuditLog[];
    if (pending.length === 0) return;
    const existing = getLocalLogs();
    const existingIds = new Set(existing.map((l) => l.id));
    const newLogs = pending.filter((l) => !existingIds.has(l.id));
    if (newLogs.length > 0) {
      saveLocalLogs([...existing, ...newLogs]);
    }
    localStorage.removeItem(PENDING_KEY);
  } catch {
    localStorage.removeItem(PENDING_KEY);
  }
}

// Run migration on module load
migratePendingLogs();

// ── Severity mapping ──

const SEVERITY_MAP: Record<AuditAction, AuditSeverity> = {
  CREATE_TASK: 'info',
  UPDATE_TASK: 'info',
  DELETE_TASK: 'warning',
  COMPLETE_TASK: 'info',
  SCHEDULE_TODAY: 'info',
  CREATE_PROJECT: 'info',
  UPDATE_PROJECT: 'info',
  DELETE_PROJECT: 'warning',
  RESTORE_PROJECT: 'info',
  RUN_PIPELINE: 'info',
  GENERATE_TODAY: 'info',
  UPDATE_STATUS: 'info',
  UPDATE_PROFILE: 'info',
  SAVE_DAILY_STATE: 'info',
  TOGGLE_AI: 'info',
  CHANGE_THEME: 'info',
  LOGIN: 'critical',
  LOGOUT: 'critical',
};

// ── Human-readable descriptions ──

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE_TASK: 'Created a task',
  UPDATE_TASK: 'Updated a task',
  DELETE_TASK: 'Deleted a task',
  COMPLETE_TASK: 'Completed a task',
  SCHEDULE_TODAY: 'Scheduled task for today',
  CREATE_PROJECT: 'Created a project',
  UPDATE_PROJECT: 'Updated a project',
  DELETE_PROJECT: 'Deleted a project',
  RESTORE_PROJECT: 'Restored a project',
  RUN_PIPELINE: 'Ran AI pipeline',
  GENERATE_TODAY: 'Generated today view',
  UPDATE_STATUS: 'Updated task status',
  UPDATE_PROFILE: 'Updated profile',
  SAVE_DAILY_STATE: 'Saved daily state',
  TOGGLE_AI: 'Toggled AI assistant',
  CHANGE_THEME: 'Changed theme',
  LOGIN: 'Signed in',
  LOGOUT: 'Signed out',
};

export function getActionLabel(action: AuditAction): string {
  return ACTION_LABELS[action] ?? action;
}

export function getActionSeverity(action: AuditAction): AuditSeverity {
  return SEVERITY_MAP[action] ?? 'info';
}

// ── Filter types ──

export interface AuditFilter {
  actions?: AuditAction[];
  entityTypes?: string[];
  severity?: AuditSeverity[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

// ── Service ──

export const auditService = {
  getLogs(filter?: AuditFilter): PaginatedResponse<AuditLog> {
    let logs = getLocalLogs();

    // Sort newest first
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply filters
    if (filter) {
      if (filter.actions?.length) {
        const set = new Set(filter.actions);
        logs = logs.filter((l) => set.has(l.action));
      }
      if (filter.entityTypes?.length) {
        const set = new Set(filter.entityTypes);
        logs = logs.filter((l) => set.has(l.entityType));
      }
      if (filter.severity?.length) {
        const set = new Set(filter.severity);
        logs = logs.filter((l) => set.has(l.severity));
      }
      if (filter.dateFrom) {
        const from = new Date(filter.dateFrom).getTime();
        logs = logs.filter((l) => new Date(l.timestamp).getTime() >= from);
      }
      if (filter.dateTo) {
        const to = new Date(filter.dateTo).getTime() + 86_400_000; // include full day
        logs = logs.filter((l) => new Date(l.timestamp).getTime() < to);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        logs = logs.filter(
          (l) =>
            l.description.toLowerCase().includes(q) ||
            l.action.toLowerCase().includes(q) ||
            l.entityType.toLowerCase().includes(q) ||
            (l.entityId ?? '').toLowerCase().includes(q) ||
            (l.userName ?? '').toLowerCase().includes(q),
        );
      }
    }

    const total = logs.length;
    const page = filter?.page ?? 1;
    const perPage = filter?.perPage ?? 50;
    const start = (page - 1) * perPage;
    const paginated = logs.slice(start, start + perPage);

    return { data: paginated, total, page, perPage };
  },

  createLog(log: Omit<AuditLog, 'id' | 'sessionId' | 'severity' | 'description'>
    & { description?: string; severity?: AuditSeverity }): ApiResponse<AuditLog> {
    const entry: AuditLog = {
      ...log,
      id: `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      sessionId: getSessionId(),
      severity: log.severity ?? getActionSeverity(log.action),
      description: log.description ?? buildDescription(log),
    };
    const logs = getLocalLogs();
    logs.push(entry);
    saveLocalLogs(logs);
    return { data: entry, success: true };
  },

  getStats() {
    const logs = getLocalLogs();
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * 86_400_000;

    const today = logs.filter((l) => new Date(l.timestamp).getTime() >= todayStart);
    const thisWeek = logs.filter((l) => new Date(l.timestamp).getTime() >= weekAgo);

    const actionCounts: Partial<Record<AuditAction, number>> = {};
    for (const l of logs) {
      actionCounts[l.action] = (actionCounts[l.action] ?? 0) + 1;
    }

    return {
      total: logs.length,
      today: today.length,
      thisWeek: thisWeek.length,
      actionCounts,
    };
  },

  clearLogs(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};

// ── Helpers ──

function buildDescription(log: Pick<AuditLog, 'action' | 'entityType' | 'entityId' | 'metadata'>): string {
  const label = ACTION_LABELS[log.action] ?? log.action;
  const meta = log.metadata;
  const title = meta?.title ?? meta?.text ?? meta?.name;
  if (title) return `${label}: "${title}"`;
  if (log.entityId) return `${label} (${log.entityType} ${log.entityId.slice(0, 8)}…)`;
  return label;
}
