import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
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
  onDeleteTask?: (id: string) => void;
  deletingId?: string | null;
}

export function TodayTable({ tasks, localStatus, onStatusChange, onEditTask, onDeleteTask, deletingId }: TodayTableProps) {
  const navigate = useNavigate();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const getStatus = useCallback(
    (task: Task): TaskStatus => localStatus[task.id] ?? task.status,
    [localStatus],
  );

  const handleDeleteClick = (id: string) => setConfirmId(id);
  const handleConfirm = () => {
    if (confirmId && onDeleteTask) {
      onDeleteTask(confirmId);
      setConfirmId(null);
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
                <button
                  onClick={() => onStatusChange(task.id, status === 'Done' ? 'Pending' : 'Done')}
                  className="shrink-0 mt-1 flex items-center justify-center h-[22px] w-[22px] rounded-full border-[1.5px] transition-all duration-200"
                  style={{
                    borderColor: status === 'Done' ? 'var(--primary-500)' : 'var(--color-border)',
                    backgroundColor: status === 'Done' ? 'var(--primary-500)' : 'transparent',
                  }}
                >
                  {status === 'Done' && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-body font-medium text-neutral-900 dark:text-neutral-50 truncate', status === 'Done' && 'line-through')}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {task.area && <p className="text-caption text-neutral-400">{task.area}</p>}
                    {task.area && task.projectName && <span className="text-caption text-neutral-300">·</span>}
                    {task.projectName && <p className="text-caption" style={{ color: 'var(--primary-600)' }}>{task.projectName}</p>}
                  </div>
                </div>
                <StatusSelect task={task} />
              </div>
              <div className="flex items-center justify-between">
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
                <div className="flex gap-1">
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
                  <button
                    onClick={() => navigate('/create', { state: { skipStep1: true, text: task.title, area: task.area, type: 'project' } })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: 'var(--color-text-secondary)' }}
                    title="Convert to project"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                    </svg>
                  </button>
                  {onDeleteTask && (
                    <button
                      onClick={() => handleDeleteClick(task.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--color-danger, #ef4444)' }}
                      title="Delete task"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
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
                <th className="w-10 px-3 py-3"></th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Task</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Fit Score</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Project</th>
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
                    <td className="px-3 py-3">
                      <button
                        onClick={() => onStatusChange(task.id, status === 'Done' ? 'Pending' : 'Done')}
                        className="flex items-center justify-center h-5 w-5 rounded-full border-[1.5px] transition-all duration-200"
                        style={{
                          borderColor: status === 'Done' ? 'var(--primary-500)' : 'var(--color-border)',
                          backgroundColor: status === 'Done' ? 'var(--primary-500)' : 'transparent',
                        }}
                      >
                        {status === 'Done' && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
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
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-caption" style={{ color: task.projectName ? 'var(--primary-600)' : 'var(--color-text-secondary)' }}>
                        {task.projectName || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelect task={task} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
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
                        <button
                          onClick={() => navigate('/create', { state: { skipStep1: true, text: task.title, area: task.area, type: 'project' } })}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ color: 'var(--color-text-secondary)' }}
                          title="Convert to project"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                          </svg>
                        </button>
                        {onDeleteTask && (
                          <button
                            onClick={() => handleDeleteClick(task.id)}
                            disabled={deletingId === task.id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
                            style={{ color: 'var(--color-danger, #ef4444)' }}
                            title="Delete task"
                          >
                            {deletingId === task.id ? (
                              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmId && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-sm w-full space-y-4">
            <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Delete Task?</h3>
            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              This task will be moved to the deleted list.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 rounded-md text-caption font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-md text-caption font-medium transition-colors !text-white"
                style={{ backgroundColor: 'var(--color-danger, #ef4444)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
