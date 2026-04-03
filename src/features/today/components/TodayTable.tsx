import { useCallback } from 'react';
import type { Task, TaskStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { TASK_CATEGORIES, PRIORITY_COLORS } from '@/constants';
import { cn } from '@/utils/cn';

function getPriorityVariant(priority?: number) {
  if (!priority) return PRIORITY_COLORS.normal;
  if (priority >= 8) return PRIORITY_COLORS.critical;
  if (priority >= 5) return PRIORITY_COLORS.important;
  return PRIORITY_COLORS.normal;
}

function getCategoryStyle(category?: string) {
  return TASK_CATEGORIES.find((c) => c.value === category)?.color ?? 'bg-neutral-100 text-neutral-600';
}

interface TodayTableProps {
  tasks: Task[];
  localStatus: Record<string, TaskStatus>;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
}

export function TodayTable({ tasks, localStatus, onStatusChange, onEditTask }: TodayTableProps) {
  const getStatus = useCallback(
    (task: Task): TaskStatus => localStatus[task.id] ?? task.status,
    [localStatus],
  );

  if (tasks.length === 0) {
    return (
      <div className="card p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-body text-neutral-500 mt-4">No tasks for today</p>
        <p className="text-caption text-neutral-400">Use the input module to create tasks</p>
      </div>
    );
  }

  const StatusSelect = ({ task }: { task: Task }) => {
    const status = getStatus(task);
    return (
      <select
        value={status}
        onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
        className={cn(
          'rounded-md border px-2 py-1 text-caption font-medium transition-colors cursor-pointer',
          status === 'Done'
            ? 'bg-success-50 text-success-700 border-success-200'
            : 'bg-warning-50 text-warning-700 border-warning-200',
        )}
      >
        <option value="Pending">Pending</option>
        <option value="Done">Done</option>
      </select>
    );
  };

  return (
    <>
      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {tasks.map((task) => {
          const status = getStatus(task);
          const priorityStyle = getPriorityVariant(task.priority);
          return (
            <div key={task.id} className={cn('card p-4 space-y-2', status === 'Done' && 'opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className={cn('text-body font-medium text-neutral-900 dark:text-neutral-50 truncate', status === 'Done' && 'line-through')}>
                    {task.title}
                  </p>
                  {task.area && <p className="text-caption text-neutral-400">{task.area}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusSelect task={task} />
                  {onEditTask && (
                    <button
                      onClick={() => onEditTask(task)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--color-text-secondary)' }}
                      title="Edit task"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-caption">
                {task.category && (
                  <Badge className={getCategoryStyle(task.category)}>{task.category}</Badge>
                )}
                {task.priority != null && (
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 font-medium', priorityStyle.bg, priorityStyle.text)}>
                    P: {task.priority}
                  </span>
                )}
                {task.fitScore != null && (
                  <span className="text-neutral-500">Fit: {task.fitScore}%</span>
                )}
                <span className="text-neutral-400">{task.timeEstimate ?? '—'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table layout */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-semantic-border bg-neutral-50 dark:bg-neutral-800/50">
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Task</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Fit Score</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-caption font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-semantic-border">
              {tasks.map((task) => {
                const status = getStatus(task);
                const priorityStyle = getPriorityVariant(task.priority);
                return (
                  <tr key={task.id} className={cn('transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/30', status === 'Done' && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <p className={cn('text-body font-medium text-neutral-900 dark:text-neutral-50', status === 'Done' && 'line-through')}>{task.title}</p>
                      {task.area && <p className="text-caption text-neutral-400">{task.area}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {task.category && (
                        <Badge className={getCategoryStyle(task.category)}>{task.category}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {task.priority != null && (
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium', priorityStyle.bg, priorityStyle.text)}>
                          {task.priority}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {task.fitScore != null && (
                        <span className="text-body text-neutral-700 dark:text-neutral-300">{task.fitScore}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-caption text-neutral-500">{task.timeEstimate ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelect task={task} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {onEditTask && (
                        <button
                          onClick={() => onEditTask(task)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ color: 'var(--color-text-secondary)' }}
                          title="Edit task"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
