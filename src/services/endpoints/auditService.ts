import type { AuditLog, ApiResponse, PaginatedResponse } from '@/types';

// Audit logs are stored locally since GAS doesn't have a dedicated audit sheet.
// They persist in localStorage and can be viewed in the Admin panel.
function getLocalLogs(): AuditLog[] {
  try {
    return JSON.parse(localStorage.getItem('audit_logs') || '[]');
  } catch {
    return [];
  }
}

function saveLocalLogs(logs: AuditLog[]) {
  localStorage.setItem('audit_logs', JSON.stringify(logs.slice(-500)));
}

export const auditService = {
  async getLogs(_params?: Record<string, string>): Promise<PaginatedResponse<AuditLog>> {
    const logs = getLocalLogs();
    return { data: logs, total: logs.length, page: 1, perPage: logs.length };
  },

  async createLog(log: Omit<AuditLog, 'id'>): Promise<ApiResponse<AuditLog>> {
    const entry: AuditLog = { ...log, id: `audit-${Date.now()}` };
    const logs = getLocalLogs();
    logs.push(entry);
    saveLocalLogs(logs);
    return { data: entry, success: true };
  },
};
