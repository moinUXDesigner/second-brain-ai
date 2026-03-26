import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { useTaskStore } from '@/app/store/taskStore';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export function SummaryCards() {
  const { tasks, todayTasks } = useTaskStore();
  const doneTasks = tasks.filter((t) => t.status === 'Done').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
  const todayDone = todayTasks.filter((t) => t.status === 'Done').length;

  const cards = [
    { label: 'Total Tasks', value: tasks.length, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Completed', value: doneTasks, color: 'text-success-600', bg: 'bg-success-50 dark:bg-success-900/20' },
    { label: 'Pending', value: pendingTasks, color: 'text-warning-600', bg: 'bg-warning-50 dark:bg-warning-900/20' },
    { label: "Today's Done", value: todayDone, color: 'text-danger-600', bg: 'bg-danger-50 dark:bg-danger-900/20' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <motion.div key={c.label} variants={item}>
          <Card className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${c.bg}`}>
              <span className={`text-h3 font-bold ${c.color}`}>{c.value}</span>
            </div>
            <div>
              <p className="text-caption text-neutral-500">{c.label}</p>
              <p className={`text-h2 font-bold ${c.color}`}>{c.value}</p>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
