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
    { 
      label: 'Total Tasks', 
      value: tasks.length, 
      color: 'var(--primary-600)', 
      bgColor: 'var(--primary-50, #f0f4ff)',
      icon: '📋'
    },
    { 
      label: 'Completed', 
      value: doneTasks, 
      color: 'var(--success-600, #16a34a)', 
      bgColor: 'var(--success-50, #f0fdf4)',
      icon: '✅'
    },
    { 
      label: 'Pending', 
      value: pendingTasks, 
      color: 'var(--warning-600, #d97706)', 
      bgColor: 'var(--warning-50, #fffbeb)',
      icon: '⏳'
    },
    { 
      label: 'Overdue', 
      value: overdueTasks, 
      color: 'var(--color-danger, #ef4444)', 
      bgColor: 'var(--danger-50, #fef2f2)',
      icon: '🔴'
    },
  ];

  if (loadingTasks || loadingToday) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg p-3 md:p-4 animate-pulse" style={{ backgroundColor: 'var(--color-muted)' }}>
            <div className="space-y-2">
              <div className="h-4 w-16 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
              <div className="h-6 w-12 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
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
          <div className="rounded-lg p-3 md:p-4 text-center" style={{ backgroundColor: c.bgColor }}>
            <div className="text-2xl md:text-3xl mb-2">{c.icon}</div>
            <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: c.color }}>
              {c.value}
            </div>
            <div className="text-xs md:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {c.label}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
