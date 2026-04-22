import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTasks, useUpdateTaskStatus, useResetRecurringTask } from '@/hooks/useTasks';
import { TableSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import type { Task } from '@/types';

type RecurrenceType = 'All' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

const recurrenceOptions: RecurrenceType[] = ['All', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

const CYCLE_DAYS: Record<string, number> = {
  Daily: 1,
  Weekly: 7,
  Monthly: 30,
  Yearly: 365,
};

function getNextDue(task: Task): string {
  const base = task.dueDate ? new Date(task.dueDate) : new Date();
  const days = CYCLE_DAYS[task.recurrence ?? ''] ?? 0;
  if (!days) return '—';
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  const diff = Math.ceil((next.getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff}d`;
}

function getNextDueBadgeStyle(label: string): React.CSSProperties {
  if (label === 'Overdue') return { backgroundColor: 'var(--color-error, #fee2e2)', color: '#dc2626' };
  if (label === 'Today') return { backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' };
  return { backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)' };
}

export function RecurringTasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const completeTask = useUpdateTaskStatus();
  const resetTask = useResetRecurringTask();
  const [recurrence, setRecurrence] = useState<RecurrenceType>('All');
  const [showCompleted, setShowCompleted] = useState(false);

  const { active, completed, counts } = useMemo(() => {
    if (!tasks) return { active: [], completed: [], counts: {} as Record<string, number> };

    const recurring = tasks.filter((t) => t.recurrence && t.status !== 'Deleted');

    const counts: Record<string, number> = { All: 0, Daily: 0, Weekly: 0, Monthly: 0, Yearly: 0 };
    recurring.forEach((t) => {
      counts['All']++;
      if (t.recurrence && counts[t.recurrence] !== undefined) counts[t.recurrence]++;
    });

    const filtered = recurring.filter((t) => recurrence === 'All' || t.recurrence === recurrence);
    const active: Task[] = [];
    const completed: Task[] = [];
    
    for (const t of filtered) {
      if (t.status === 'Done') {
        completed.push(t);
      } else {
        active.push(t);
      }
    }
    
    return { active, completed, counts };
  }, [tasks, recurrence]);

  const handleComplete = async (task: Task) => {
    await completeTask.mutateAsync({ id: task.id, status: 'Done' });
    toast.success(`"${task.title}" done! Resetting for next cycle…`, { duration: 2000 });
    setTimeout(() => {
      resetTask.mutate(task.id, {
        onError: () => toast.error('Failed to reset recurring task'),
      });
    }, 1500);
  };

  const displayed = showCompleted ? completed : active;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Recurring Tasks</h1>
          <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            {active.length} active · {completed.length} completed this cycle
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {recurrenceOptions.map((option) => (
            <button
              key={option}
              onClick={() => setRecurrence(option)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5"
              style={recurrence === option
                ? { backgroundColor: 'var(--primary-600)', color: '#fff' }
                : { backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
            >
              {option}
              {counts[option] > 0 && (
                <span
                  className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                  style={recurrence === option
                    ? { backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }
                    : { backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  {counts[option]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active / Completed toggle */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: 'var(--color-muted)' }}>
        {(['Active', 'Completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setShowCompleted(tab === 'Completed')}
            className="px-4 py-1.5 rounded-md text-xs font-semibold transition"
            style={(tab === 'Completed') === showCompleted
              ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { color: 'var(--color-text-secondary)' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="card overflow-hidden">
          {displayed.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
              {showCompleted
                ? 'No completed recurring tasks this cycle.'
                : `No active recurring tasks${recurrence !== 'All' ? ` for ${recurrence.toLowerCase()} recurrence` : ''}.`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-muted)' }}>
                    {['Task', 'Recurrence', 'Next Due', 'Area', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((task) => {
                    const nextDue = getNextDue(task);
                    const isPending = completeTask.isPending && (completeTask.variables as { id: string })?.id === task.id;
                    const isResetting = resetTask.isPending && (resetTask.variables as string) === task.id;

                    return (
                      <tr key={task.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td className="px-4 py-3 text-body font-medium" style={{ color: 'var(--color-text)' }}>
                          {task.title}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                            {task.recurrence}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={getNextDueBadgeStyle(nextDue)}>
                            {nextDue}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                          {task.area || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {showCompleted ? (
                            <button
                              onClick={() => resetTask.mutate(task.id)}
                              disabled={isResetting}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
                            >
                              {isResetting ? 'Resetting…' : 'Reset'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleComplete(task)}
                              disabled={isPending || isResetting}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                              style={{ backgroundColor: 'var(--primary-600)', color: '#fff', opacity: isPending || isResetting ? 0.6 : 1 }}
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              {isPending ? 'Saving…' : isResetting ? 'Resetting…' : 'Complete'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
