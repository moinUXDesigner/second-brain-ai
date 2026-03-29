import { AuditLogViewer } from '@/features/admin/components/AuditLogViewer';
import { motion } from 'framer-motion';

export function ActivityPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Activity</h1>
        <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Your recent actions and audit trail
        </p>
      </div>
      <AuditLogViewer />
    </motion.div>
  );
}
