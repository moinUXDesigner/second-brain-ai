import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { LinkToProjectModal } from '@/components/task/LinkToProjectModal';
import { TaskViewModal } from '@/components/task/TaskViewModal';
import { Badge } from '@/components/ui/Badge';
import { PRIORITY_COLORS } from '@/constants';
import type { Task, TaskStatus } from '@/types';
import { cn } from '@/utils/cn';
import { formatDate, parseLocalDate } from '@/utils/dateFormat';
import toast from 'react-hot-toast';

function getPriorityVariant(priority?: number) {
  if (!priority) return PRIORITY_COLORS.normal;
  if (priority >= 8) return PRIORITY_COLORS.critical;
  if (priority >= 5) return PRIORITY_COLORS.important;
  return PRIORITY_COLORS.normal;
}

function getUrgencyVariant(urgency?: string) {
  if (urgency === 'High') return 'danger';
  if (urgency === 'Medium') return 'warning';
  return 'default';
}

function getLocalDueDate(task: Task) {
  return task.dueDate ? parseLocalDate(task.dueDate) : null;
}

function isTaskOverdue(task: Task, status: TaskStatus) {
  const dueDate = getLocalDueDate(task);
  if (!dueDate || status === 'Done') return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return dueDate < today;
}

interface TodayTableProps {
  tasks: Task[];
  localStatus: Record<string, TaskStatus>;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
  deletingId?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function TodayTable({
  tasks,
  localStatus,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  deletingId,
  emptyTitle = 'No tasks for today',
  emptyDescription = 'Use the input module to create tasks',
}: TodayTableProps) {
  const navigate = useNavigate();
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [linkTask, setLinkTask] = useState<Task | null>(null);

  const getStatus = useCallback(
    (task: Task): TaskStatus => localStatus[task.id] ?? task.status,
    [localStatus],
  );

  const handleDeleteClick = (id: string) => setConfirmId(id);

  const showUndoToast = (task: Task, previousStatus: TaskStatus, nextStatus: TaskStatus) => {
    const label = nextStatus === 'Done' ? 'marked done' : 'restored to pending';
    const undoLabel = nextStatus === 'Done' ? 'Undo' : 'Undo';

    toast.custom(
      (t) => (
        <div
          className="flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Task {label}
            </p>
            <p className="truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {task.title}
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              toast.dismiss(t.id);
              await onStatusChange(task.id, previousStatus);
            }}
            className="text-sm font-medium"
            style={{ color: 'var(--primary-600)' }}
          >
            {undoLabel}
          </button>
        </div>
      ),
      { duration: 4000 },
    );
  };

  const toggleTaskStatus = async (task: Task) => {
    const currentStatus = getStatus(task);
    const nextStatus: TaskStatus = currentStatus === 'Done' ? 'Pending' : 'Done';
    await onStatusChange(task.id, nextStatus);
    showUndoToast(task, currentStatus, nextStatus);
  };

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
        <p className="mt-4 text-body text-neutral-500">{emptyTitle}</p>
        <p className="text-caption text-neutral-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {tasks.map((task) => {
          const status = getStatus(task);
          const priorityStyle = getPriorityVariant(task.priority);

          return (
            <div
              key={task.id}
              onClick={() => setViewTask(task)}
              className={cn('card cursor-pointer p-4 transition-colors hover:bg-black/[.015] dark:hover:bg-white/[.015]', status === 'Done' && 'opacity-60')}
            >
              <p className={cn('truncate text-body font-medium text-neutral-900 dark:text-neutral-50', status === 'Done' && 'line-through')} title={task.title}>
                {task.title}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {task.priority != null ? (
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium', priorityStyle.bg, priorityStyle.text)}>
                    {task.priority}
                  </span>
                ) : (
                  <span className="text-caption text-neutral-400">No priority</span>
                )}

                {task.urgency ? (
                  <Badge variant={getUrgencyVariant(task.urgency)} className="font-medium">
                    {task.urgency}
                  </Badge>
                ) : (
                  <span className="text-caption text-neutral-400">No urgency</span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-neutral-400">
                <span className={cn(isTaskOverdue(task, status) && 'font-medium text-danger-500')}>
                  Due {task.dueDate ? formatDate(task.dueDate) : '-'}
                </span>
                <span>Deadline {task.deadlineDate ? formatDate(task.deadlineDate) : '-'}</span>
              </div>

              {task.projectName && (
                <button
                  type="button"
                  className="mt-1 text-caption hover:underline"
                  style={{ color: 'var(--primary-600)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (task.projectId) navigate(`/projects/${task.projectId}`);
                  }}
                >
                  {task.projectName}
                </button>
              )}

              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void toggleTaskStatus(task);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: status === 'Done' ? 'var(--primary-600)' : 'var(--color-text-secondary)' }}
                  title={status === 'Done' ? 'Mark as pending' : 'Mark as done'}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>

                <div className="flex items-center gap-1">
                  {onEditTask && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setLinkTask(task);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: 'var(--color-text-secondary)' }}
                    title="Link to project"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/create', { state: { skipStep1: true, text: task.title, area: task.area, type: 'project' } });
                    }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(task.id);
                      }}
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

      <div className="card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="sticky top-0 z-20">
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-muted)' }}>
                <th className="w-[42%] px-4 py-3 text-left text-caption font-medium uppercase tracking-wider text-neutral-500">Title</th>
                <th className="w-[10%] px-4 py-3 text-left text-caption font-medium uppercase tracking-wider text-neutral-500">Priority</th>
                <th className="w-[12%] px-4 py-3 text-left text-caption font-medium uppercase tracking-wider text-neutral-500">Urgency</th>
                <th className="w-[12%] px-4 py-3 text-left text-caption font-medium uppercase tracking-wider text-neutral-500">Due Date</th>
                <th className="w-[12%] px-4 py-3 text-left text-caption font-medium uppercase tracking-wider text-neutral-500">Deadline</th>
                <th className="w-[12%] px-4 py-3 text-right text-caption font-medium uppercase tracking-wider text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-semantic-border">
              {tasks.map((task) => {
                const status = getStatus(task);
                const priorityStyle = getPriorityVariant(task.priority);

                return (
                  <tr
                    key={task.id}
                    onClick={() => setViewTask(task)}
                    className={cn('cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/30', status === 'Done' && 'opacity-60')}
                  >
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className={cn('truncate text-body font-medium text-neutral-900 dark:text-neutral-50', status === 'Done' && 'line-through')} title={task.title}>
                          {task.title}
                        </p>
                        {task.projectName && (
                          <p className="truncate text-caption text-neutral-400" title={task.projectName}>
                            {task.projectName}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {task.priority != null ? (
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium', priorityStyle.bg, priorityStyle.text)}>
                          {task.priority}
                        </span>
                      ) : (
                        <span className="text-caption text-neutral-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {task.urgency ? (
                        <Badge variant={getUrgencyVariant(task.urgency)} className="font-medium">
                          {task.urgency}
                        </Badge>
                      ) : (
                        <span className="text-caption text-neutral-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={cn('text-caption', isTaskOverdue(task, status) ? 'font-medium text-danger-500' : 'text-neutral-500')}>
                        {task.dueDate ? formatDate(task.dueDate) : '-'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-caption text-neutral-500">
                        {task.deadlineDate ? formatDate(task.deadlineDate) : '-'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void toggleTaskStatus(task);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ color: status === 'Done' ? 'var(--primary-600)' : 'var(--color-text-secondary)' }}
                          title={status === 'Done' ? 'Mark as pending' : 'Mark as done'}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>

                        {onEditTask && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(task);
                            }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setLinkTask(task);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ color: 'var(--color-text-secondary)' }}
                          title="Link to project"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/create', { state: { skipStep1: true, text: task.title, area: task.area, type: 'project' } });
                          }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(task.id);
                            }}
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

      {viewTask && <TaskViewModal task={viewTask} onClose={() => setViewTask(null)} />}
      {linkTask && <LinkToProjectModal task={linkTask} onClose={() => setLinkTask(null)} />}
      {confirmId && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card max-w-sm w-full space-y-4 p-6">
            <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>
              Delete Task?
            </h3>
            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              This task will be moved to the deleted list.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className="rounded-md px-4 py-2 text-caption font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="rounded-md px-4 py-2 text-caption font-medium transition-colors !text-white"
                style={{ backgroundColor: 'var(--color-danger, #ef4444)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
