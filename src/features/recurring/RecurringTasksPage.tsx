import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks';
import { TaskList } from '../tasks/components/TaskList';
import { TableSkeleton } from '@/components/ui/Skeleton';

type RecurrenceType = 'All' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

const recurrenceOptions: RecurrenceType[] = ['All', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

export function RecurringTasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const completeTask = useUpdateTaskStatus();
  const [recurrence, setRecurrence] = useState<RecurrenceType>('All');

  const recurringTasks = useMemo(() => {
    if (!tasks) return [];

    const deriveRecurrence = (taskRecurrence: string | undefined) => {
      if (!taskRecurrence) return null;
      const normalized = taskRecurrence.toLowerCase();
      if (normalized.includes('daily')) return 'Daily';
      if (normalized.includes('weekly')) return 'Weekly';
      if (normalized.includes('monthly')) return 'Monthly';
      if (normalized.includes('yearly') || normalized.includes('annual')) return 'Yearly';
      return null;
    };

    return tasks
      .map((task) => ({
        ...task,
        recurrence: task.recurrence || deriveRecurrence(task.recurrence || task.tags?.join(' ') || ''),
      }))
      .filter((task) => task.recurrence)
      .filter((task) => recurrence === 'All' || task.recurrence === recurrence);
  }, [tasks, recurrence]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Recurring Tasks</h1>
          <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            View scheduled repeat tasks by cycle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {recurrenceOptions.map((option) => (
            <button
              key={option}
              onClick={() => setRecurrence(option)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${recurrence === option ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="card overflow-hidden">
          {recurringTasks.length === 0 ? (
            <div className="p-6 text-center text-neutral-500">
              No recurring tasks found for {recurrence.toLowerCase()} recurrence.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-semantic-border bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Task</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Recurrence</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Area</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-semantic-border">
                  {recurringTasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-4 py-3 text-body font-medium text-neutral-900 dark:text-neutral-50">{task.title}</td>
                      <td className="px-4 py-3 text-caption text-neutral-600">{task.recurrence}</td>
                      <td className="px-4 py-3 text-caption text-neutral-600">{task.area || '—'}</td>
                      <td className="px-4 py-3 text-caption text-neutral-600">{task.status}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => completeTask.mutate({ id: task.id, status: 'Done' })}
                          className="btn btn-xs btn-primary"
                        >
                          Mark Done
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
