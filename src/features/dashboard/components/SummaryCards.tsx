import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { useTasks } from '@/hooks/useTasks';
import { useTodayTasks } from '@/hooks/useTasks';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export function SummaryCards() {
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: todayTasksRes, isLoading: loadingToday } = useTodayTasks();

  const todayTasks = todayTasksRes ?? [];
  const doneTasks = tasks.filter((t) => t.status === 'Done').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
  const todayDone = todayTasks.filter((t) => t.status === 'Done').length;

  // Calculate overdue tasks (pending tasks with due date in the past)
  const overdueTasks = tasks.filter((t) => {
    if (t.status !== 'Pending' || !t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;

  const cards = [
    { label: 'Total Tasks', value: tasks.length, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Completed', value: doneTasks, color: 'text-success-600', bg: 'bg-success-50 dark:bg-success-900/20' },
    { label: 'Pending', value: pendingTasks, color: 'text-warning-600', bg: 'bg-warning-50 dark:bg-warning-900/20' },
    { label: 'Overdue', value: overdueTasks, color: 'text-danger-600', bg: 'bg-danger-50 dark:bg-danger-900/20' },
  ];

  if (loadingTasks || loadingToday) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-3 md:p-4 animate-pulse">
            <div className="flex flex-col md:flex-row items-center md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg mb-2 md:mb-0" style={{ backgroundColor: 'var(--color-muted)' }} />
              <div className="space-y-2 flex-1 text-center md:text-left w-full">
                <div className="h-3 rounded w-2/3 mx-auto md:mx-0" style={{ backgroundColor: 'var(--color-muted)' }} />
                <div className="h-6 rounded w-1/2 mx-auto md:mx-0" style={{ backgroundColor: 'var(--color-muted)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((c) => (
        <motion.div key={c.label} variants={item}>
          <Card className="flex flex-col md:flex-row md:items-center md:gap-4 p-3 md:p-4">
            <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg flex-shrink-0 ${c.bg} mb-2 md:mb-0`}>
              <span className={`text-h3 font-bold ${c.color}`}>{c.value}</span>
            </div>
            <div className="text-center md:text-left">
              <p className="text-caption text-neutral-500 text-xs md:text-sm">{c.label}</p>
              <p className={`text-h3 md:text-h2 font-bold ${c.color}`}>{c.value}</p>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
