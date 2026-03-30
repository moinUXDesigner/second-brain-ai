import { useMemo, useState } from 'react';
import { useUiStore } from '@/app/store/uiStore';
import { AuditLogViewer } from '@/features/admin/components/AuditLogViewer';
import { auditService } from '@/services/endpoints/auditService';
import { motion } from 'framer-motion';

const STAT_CARDS: { key: 'total' | 'today' | 'thisWeek'; label: string; icon: string; color: string; bg: string }[] = [
  { key: 'total', label: 'Total Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'var(--primary-600)', bg: 'var(--primary-50)' },
  { key: 'today', label: 'Today', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'var(--success-600, #16a34a)', bg: 'var(--success-50, #f0fdf4)' },
  { key: 'thisWeek', label: 'This Week', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'var(--warning-600, #d97706)', bg: 'var(--warning-50, #fffbeb)' },
];

export function ActivityPage() {
  const auditVersion = useUiStore((s) => s.auditVersion);
  const stats = useMemo(() => auditService.getStats(), [auditVersion]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Activity</h1>
        <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Your recent actions and audit trail
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {STAT_CARDS.map((s) => (
          <div key={s.key} className="card p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: s.bg }}>
              <svg className="h-5 w-5" style={{ color: s.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
              </svg>
            </div>
            <div>
              <p className="text-h2 leading-none" style={{ color: 'var(--color-text)' }}>{stats[s.key]}</p>
              <p className="text-caption mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <AuditLogViewer />
    </motion.div>
  );
}
