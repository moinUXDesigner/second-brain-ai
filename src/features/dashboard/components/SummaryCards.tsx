import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useTodayTasks } from '@/hooks/useTasks';
import { isTaskOverdue } from '@/features/tasks/utils/taskStatus';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export function SummaryCards() {
  const navigate = useNavigate();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: todayTasksRes, isLoading: loadingToday } = useTodayTasks();

  const todayTasks = todayTasksRes ?? [];
  const doneTasks = tasks.filter((t) => t.status === 'Done').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;

  // Calculate overdue tasks (pending tasks with due date in the past)
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t)).length;

  const cards = [
    { 
      label: 'Total Tasks', 
      value: tasks.length, 
      color: 'var(--primary-600)'
    },
    { 
      label: 'Completed', 
      value: doneTasks, 
      color: 'var(--success-600, #16a34a)'
    },
    { 
      label: 'Pending', 
      value: pendingTasks, 
      color: 'var(--warning-600, #d97706)'
    },
    {
      label: 'Overdue',
      value: overdueTasks,
      color: 'var(--color-danger, #ef4444)',
      to: '/tasks/overdue',
    },
  ];

  if (loadingTasks || loadingToday) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg p-2.5 md:p-3 animate-pulse" style={{ backgroundColor: 'var(--color-muted)' }}>
            <div className="space-y-2">
              <div className="h-6 w-12 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
              <div className="h-3 w-16 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
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
          <button
            type="button"
            onClick={() => c.to && navigate(c.to)}
            className="w-full rounded-lg p-2.5 text-center md:p-3 transition-colors"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <div className="text-lg md:text-2xl font-bold" style={{ color: c.color }}>
              {c.value}
            </div>
            <div className="text-[10px] md:text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {c.label}
            </div>
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
}
