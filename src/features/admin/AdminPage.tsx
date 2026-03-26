import { motion } from 'framer-motion';
import { UserManagement } from './components/UserManagement';
import { AuditLogViewer } from './components/AuditLogViewer';

export function AdminPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="text-h1 text-neutral-900 dark:text-neutral-50">Admin Panel</h1>
        <p className="text-body text-neutral-500 mt-1">Manage users and view system activity</p>
      </div>

      <UserManagement />
      <AuditLogViewer />
    </motion.div>
  );
}
