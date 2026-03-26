import { motion } from 'framer-motion';
import { SummaryCards } from './components/SummaryCards';
import { Charts } from './components/Charts';

export function DashboardPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-h1 text-neutral-900 dark:text-neutral-50">Dashboard</h1>
        <p className="text-body text-neutral-500 mt-1">Your productivity at a glance</p>
      </div>

      <SummaryCards />
      <Charts />
    </motion.div>
  );
}
