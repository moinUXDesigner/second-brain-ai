import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { fromNow, formatDateTime } from '@/utils/date';
import { auditService, getActionLabel, type AuditFilter } from '@/services/endpoints/auditService';
import type { AuditLog, AuditAction, AuditSeverity } from '@/types';

// ── Action config ──

const ACTION_BADGE: Record<string, { variant: 'success' | 'primary' | 'danger' | 'warning' | 'default'; icon: string }> = {
  CREATE_TASK: { variant: 'success', icon: 'M12 4v16m8-8H4' },
  CREATE_PROJECT: { variant: 'success', icon: 'M12 4v16m8-8H4' },
  UPDATE_TASK: { variant: 'primary', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  UPDATE_PROJECT: { variant: 'primary', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  UPDATE_STATUS: { variant: 'primary', icon: 'M9 12l2 2 4-4' },
  COMPLETE_TASK: { variant: 'success', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  DELETE_TASK: { variant: 'danger', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  DELETE_PROJECT: { variant: 'danger', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  RESTORE_PROJECT: { variant: 'success', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  RUN_PIPELINE: { variant: 'warning', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  GENERATE_TODAY: { variant: 'warning', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  UPDATE_PROFILE: { variant: 'default', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  SAVE_DAILY_STATE: { variant: 'default', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  TOGGLE_AI: { variant: 'default', icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5' },
  CHANGE_THEME: { variant: 'default', icon: 'M20.354 15.354A9 9 0 018.646 3.646' },
  LOGIN: { variant: 'primary', icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1' },
  LOGOUT: { variant: 'danger', icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' },
};

const SEVERITY_DOT: Record<AuditSeverity, string> = {
  info: 'bg-blue-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-500',
};

const ACTION_OPTIONS: AuditAction[] = [
  'LOGIN', 'LOGOUT', 'CREATE_TASK', 'UPDATE_TASK', 'COMPLETE_TASK', 'DELETE_TASK',
  'CREATE_PROJECT', 'UPDATE_PROJECT', 'DELETE_PROJECT', 'RESTORE_PROJECT',
  'RUN_PIPELINE', 'GENERATE_TODAY', 'UPDATE_STATUS', 'UPDATE_PROFILE',
  'SAVE_DAILY_STATE', 'TOGGLE_AI', 'CHANGE_THEME',
];

const PER_PAGE = 30;

// ── Component ──

export function AuditLogViewer() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | ''>('');
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | ''>('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Force re-render key after clear
  const [version, setVersion] = useState(0);

  const filter = useMemo<AuditFilter>(() => ({
    search: search || undefined,
    actions: actionFilter ? [actionFilter] : undefined,
    severity: severityFilter ? [severityFilter] : undefined,
    page,
    perPage: PER_PAGE,
  }), [search, actionFilter, severityFilter, page]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const result = useMemo(() => auditService.getLogs(filter), [filter, version]);
  const { data: logs, total } = result;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const hasFilters = !!(search || actionFilter || severityFilter);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setActionFilter('');
    setSeverityFilter('');
    setPage(1);
  }, []);

  const handleClearLogs = useCallback(() => {
    if (!confirm('Clear all audit logs? This cannot be undone.')) return;
    auditService.clearLogs();
    setVersion((v) => v + 1);
    setPage(1);
  }, []);

  const getBadge = (action: AuditAction) => ACTION_BADGE[action] ?? { variant: 'default' as const, icon: '' };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: 'var(--color-muted-fg)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search logs…"
            className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none transition-colors"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          />
        </div>

        {/* Action filter */}
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value as AuditAction | ''); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
        >
          <option value="">All Actions</option>
          {ACTION_OPTIONS.map((a) => (
            <option key={a} value={a}>{getActionLabel(a)}</option>
          ))}
        </select>

        {/* Severity filter */}
        <select
          value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value as AuditSeverity | ''); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
        >
          <option value="">All Severity</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>

        {hasFilters && (
          <button onClick={handleClearFilters} className="rounded-lg px-3 py-2 text-sm font-medium transition-colors" style={{ color: 'var(--primary-600)' }}>
            Clear
          </button>
        )}
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between text-caption" style={{ color: 'var(--color-text-secondary)' }}>
        <span>{total} log{total !== 1 ? 's' : ''}{hasFilters ? ' (filtered)' : ''}</span>
        {total > 0 && (
          <button onClick={handleClearLogs} className="text-caption hover:underline" style={{ color: 'var(--color-muted-fg)' }}>
            Clear all
          </button>
        )}
      </div>

      {/* Log list */}
      {logs.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <svg className="mx-auto h-12 w-12" style={{ color: 'var(--color-muted-fg)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-body font-medium" style={{ color: 'var(--color-text)' }}>
            {hasFilters ? 'No logs match your filters' : 'No activity recorded yet'}
          </p>
          <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            {hasFilters ? 'Try adjusting your search or filters' : 'Your actions will appear here as you use the app'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y" style={{ borderColor: 'var(--color-border)' }}>
          <AnimatePresence initial={false}>
            {logs.map((log) => {
              const badge = getBadge(log.action);
              const isExpanded = expandedId === log.id;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="divide-y"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="flex items-start gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.02]"
                  >
                    {/* Icon */}
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: badge.variant === 'success' ? 'var(--success-50, #f0fdf4)' :
                          badge.variant === 'danger' ? 'var(--danger-50, #fef2f2)' :
                          badge.variant === 'warning' ? 'var(--warning-50, #fffbeb)' :
                          badge.variant === 'primary' ? 'var(--primary-50)' : 'var(--color-muted)',
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        style={{
                          color: badge.variant === 'success' ? 'var(--success-600, #16a34a)' :
                            badge.variant === 'danger' ? 'var(--danger-600, #dc2626)' :
                            badge.variant === 'warning' ? 'var(--warning-600, #d97706)' :
                            badge.variant === 'primary' ? 'var(--primary-600)' : 'var(--color-text-secondary)',
                        }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={badge.icon} />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                          {log.description || getActionLabel(log.action)}
                        </span>
                        <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${SEVERITY_DOT[log.severity ?? 'info']}`} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px]" style={{ color: 'var(--color-muted-fg)' }}>
                        <Badge variant={badge.variant}>{log.action.replace(/_/g, ' ')}</Badge>
                        <span>·</span>
                        <span>{log.entityType}</span>
                        <span>·</span>
                        <span title={formatDateTime(log.timestamp)}>{fromNow(log.timestamp)}</span>
                      </div>
                    </div>

                    {/* Chevron */}
                    <svg
                      className="h-4 w-4 mt-1 shrink-0 transition-transform"
                      style={{ color: 'var(--color-muted-fg)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 py-3 text-caption space-y-2" style={{ backgroundColor: 'var(--color-muted)' }}>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <Detail label="Action" value={getActionLabel(log.action)} />
                            <Detail label="Severity" value={log.severity ?? 'info'} />
                            <Detail label="Entity Type" value={log.entityType} />
                            <Detail label="Entity ID" value={log.entityId ?? '—'} />
                            <Detail label="User" value={log.userName ?? log.userId} />
                            <Detail label="Session" value={log.sessionId?.slice(0, 12) ?? '—'} />
                            <Detail label="Timestamp" value={formatDateTime(log.timestamp)} />
                          </div>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted-fg)' }}>
                                Metadata
                              </p>
                              <pre
                                className="text-[11px] rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all"
                                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
                              >
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Previous
          </button>
          <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-fg)' }}>
        {label}
      </span>
      <p className="text-sm truncate" style={{ color: 'var(--color-text)' }}>{value}</p>
    </div>
  );
}
