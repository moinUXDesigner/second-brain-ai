import { useState, useCallback } from 'react';
import type { Task, TaskStatus } from '@/types';
import { useUpdateTaskStatus } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/Badge';
import { TASK_CATEGORIES, PRIORITY_COLORS } from '@/constants';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

function getPriorityVariant(priority?: number) {
  if (!priority) return PRIORITY_COLORS.normal;
  if (priority >= 8) return PRIORITY_COLORS.critical;
  if (priority >= 5) return PRIORITY_COLORS.important;
  return PRIORITY_COLORS.normal;
}

function getCategoryStyle(category?: string) {
  return TASK_CATEGORIES.find((c) => c.value === category)?.color ?? 'bg-neutral-100 text-neutral-600';
}

export function TodayTable({ tasks }: { tasks: Task[] }) {
  const updateStatus = useUpdateTaskStatus();

  // Optimistic local overrides: taskId → newStatus
  const [localStatus, setLocalStatus] = useState<Record<string, TaskStatus>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  const getStatus = useCallback(
    (task: Task): TaskStatus => localStatus[task.id] ?? task.status,
    [localStatus],
  );

  const isDirty = useCallback(
    (task: Task) => task.id in localStatus && localStatus[task.id] !== task.status,
    [localStatus],
  );

  const handleLocalChange = (id: string, status: TaskStatus) => {
    setLocalStatus((prev) => ({ ...prev, [id]: status }));
  };

  const handleSync = async (task: Task) => {
    const newStatus = localStatus[task.id];
    if (!newStatus || newStatus === task.status) return;
    setSyncing((prev) => ({ ...prev, [task.id]: true }));
    try {
      await updateStatus.mutateAsync({ id: task.id, status: newStatus });
      setLocalStatus((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update');
    } finally {
      setSyncing((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
    }
  };

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
    const dirty = isDirty(task);
    const isSyncing = syncing[task.id];
    return (
      <div className="flex items-center gap-1.5">
        <select
          value={status}
          onChange={(e) => handleLocalChange(task.id, e.target.value as TaskStatus)}
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
        {dirty && (
          <button
            onClick={() => handleSync(task)}
            disabled={isSyncing}
            className="px-2 py-1 rounded-md text-[11px] font-semibold transition-all"
            style={{
              backgroundColor: 'var(--primary-600)',
              color: '#fff',
              opacity: isSyncing ? 0.6 : 1,
            }}
          >
            {isSyncing ? '…' : 'Update'}
          </button>
        )}
      </div>
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
                <div className="min-w-0">
                  <p className={cn('text-body font-medium text-neutral-900 dark:text-neutral-50 truncate', status === 'Done' && 'line-through')}>
                    {task.title}
                  </p>
                  {task.area && <p className="text-caption text-neutral-400">{task.area}</p>}
                </div>
                <StatusSelect task={task} />
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
