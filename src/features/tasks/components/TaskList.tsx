import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import type { Task } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { TaskTimer } from '@/components/task/TaskTimer';
import { LinkToProjectModal } from '@/components/task/LinkToProjectModal';
import { EditTaskModal } from './EditTaskModal';
import { useScheduleToday } from '@/hooks/useTasks';

interface TaskListProps {
  tasks: Task[];
  onDelete?: (id: string) => void;
  onComplete?: (id: string) => void;
  deletingId?: string | null;
  completingId?: string | null;
}

const SWIPE_WIDTH = 72;

function MobileTaskRow({
  task,
  onSwipeDelete,
  onComplete,
  isDeleting,
  isCompleting,
  isRevealed,
  onReveal,
  onEdit,
  onConvert,
  onLinkProject,
  onScheduleToday,
  isScheduling,
}: {
  task: Task;
  onSwipeDelete: () => void;
  onComplete?: () => void;
  isDeleting: boolean;
  isCompleting: boolean;
  isRevealed: boolean;
  onReveal: (id: string | null) => void;
  onEdit: (task: Task) => void;
  onConvert: (task: Task) => void;
  onLinkProject: (task: Task) => void;
  onScheduleToday: (id: string) => void;
  isScheduling: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ startX: number; startY: number; locked: boolean | null } | null>(null);
  const posRef = useRef(isRevealed ? -SWIPE_WIDTH : 0);

  useEffect(() => {
    if (!isRevealed && rowRef.current) {
      rowRef.current.style.transition = 'transform 0.2s ease-out';
      rowRef.current.style.transform = 'translateX(0)';
      posRef.current = 0;
    }
  }, [isRevealed]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      locked: null,
    };
    if (rowRef.current) rowRef.current.style.transition = 'none';
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchRef.current || !rowRef.current) return;
      const dx = e.touches[0].clientX - touchRef.current.startX;
      const dy = e.touches[0].clientY - touchRef.current.startY;

      if (touchRef.current.locked === null) {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
          touchRef.current.locked = true;
        } else if (Math.abs(dy) > 8) {
          touchRef.current.locked = false;
        }
      }

      if (!touchRef.current.locked) return;

      const base = isRevealed ? -SWIPE_WIDTH : 0;
      const x = Math.max(-SWIPE_WIDTH - 10, Math.min(isRevealed ? 0 : 10, base + dx));
      rowRef.current.style.transform = `translateX(${x}px)`;
      posRef.current = x;
    },
    [isRevealed],
  );

  const handleTouchEnd = useCallback(() => {
    if (!touchRef.current || !rowRef.current) {
      touchRef.current = null;
      return;
    }
    rowRef.current.style.transition = 'transform 0.2s ease-out';

    if (posRef.current < -SWIPE_WIDTH / 3) {
      rowRef.current.style.transform = `translateX(-${SWIPE_WIDTH}px)`;
      posRef.current = -SWIPE_WIDTH;
      onReveal(task.id);
    } else {
      rowRef.current.style.transform = 'translateX(0)';
      posRef.current = 0;
      onReveal(null);
    }
    touchRef.current = null;
  }, [task.id, onReveal]);

  // Modal state for editing and converting (lifted up in TaskList)
  // ...existing code...
  return (
    <div className="relative overflow-hidden" style={{ borderBottom: '1px solid var(--color-border)' }}>
      {/* Delete action behind */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center"
        style={{ width: SWIPE_WIDTH, backgroundColor: '#ef4444' }}
      >
        <button
          onClick={onSwipeDelete}
          disabled={isDeleting}
          className="flex items-center justify-center h-full w-full"
        >
          {isDeleting ? (
            <svg className="h-5 w-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Row content */}
      <div
        ref={rowRef}
        className="relative flex items-center gap-3 px-4 py-2.5"
        style={{ backgroundColor: 'var(--color-bg)', touchAction: 'pan-y', willChange: 'transform' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete?.();
          }}
          disabled={isCompleting}
          className="shrink-0 flex items-center justify-center h-[22px] w-[22px] rounded-full border-[1.5px] transition-all duration-200"
          style={{
            borderColor: isCompleting ? 'var(--primary-500)' : 'var(--color-border)',
            backgroundColor: isCompleting ? 'var(--primary-500)' : 'transparent',
          }}
        >
          {isCompleting && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
              {task.title}
            </p>
            {(task.source === 'BULK' || task.tags?.includes('Batch Uploaded')) && (
              <Badge variant="primary" className="shrink-0 !text-[9px] !px-1.5 !py-0">Batch</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {task.area && (
              <span className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {task.area}
              </span>
            )}
            {task.area && task.projectName && (
              <span className="text-xs" style={{ color: 'var(--color-border)' }}>·</span>
            )}
            {task.projectName && (
              <span className="text-xs truncate" style={{ color: 'var(--primary-600)' }}>
                {task.projectName}
              </span>
            )}
            {task.dueDate && (() => {
              const diff = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000);
              const label = diff < 0 ? 'Overdue' : diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : new Date(task.dueDate).toLocaleDateString();
              return (
                <>
                  {(task.area || task.projectName) && <span className="text-xs" style={{ color: 'var(--color-border)' }}>·</span>}
                  <span className="text-xs font-medium" style={{ color: diff <= 0 ? '#dc2626' : 'var(--color-text-secondary)' }}>
                    {label}
                  </span>
                </>
              );
            })()}
          </div>
          <div className="flex gap-1 mt-1">
            <TaskTimer task={task} compact />
            <button
              className="btn btn-xs btn-outline p-1"
              onClick={() => onScheduleToday(task.id)}
              disabled={isScheduling}
              title="Schedule for today"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              className="btn btn-xs btn-outline p-1"
              onClick={() => onEdit(task)}
              title="Edit task"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              className="btn btn-xs btn-outline p-1"
              onClick={() => onLinkProject(task)}
              title="Link to project"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            <button
              className="btn btn-xs btn-outline p-1"
              onClick={() => onConvert(task)}
              title="Convert to project"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Urgency badge */}
        {task.urgency && (
          <Badge
            variant={task.urgency === 'High' ? 'danger' : task.urgency === 'Medium' ? 'warning' : 'default'}
            className="shrink-0 !text-[11px] !px-1.5 !py-0"
          >
            {task.urgency}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function TaskList({ tasks, onDelete, onComplete, deletingId, completingId }: TaskListProps) {
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [convertTask, setConvertTask] = useState<Task | null>(null);
  const [linkTask, setLinkTask] = useState<Task | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const scheduleToday = useScheduleToday();

  const handleDeleteClick = (id: string) => {
    setSwipedId(null);
    setConfirmId(id);
  };

  const handleConfirm = () => {
    if (confirmId && onDelete) {
      onDelete(confirmId);
      setConfirmId(null);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
          No pending tasks found. Tap + to create one.
        </p>
      </div>
    );
  }

  const editTaskModal = editTask ? (
    <EditTaskModal
      task={editTask}
      onClose={() => setEditTask(null)}
    />
  ) : null;
  const navigate = useNavigate();
  const ConvertTaskModal = convertTask ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Convert Task to Project</h2>
        <p className="mb-4">Do you want to convert this task to a project with AI-generated subtasks?</p>
        <button
          className="btn btn-primary mr-2"
          onClick={() => {
            if (convertTask) {
              navigate('/create', {
                state: {
                  skipStep1: true,
                  text: convertTask.title,
                  area: convertTask.area,
                  type: 'project',
                },
              });
            }
            setConvertTask(null);
          }}
        >
          Convert
        </button>
        <button className="btn btn-secondary" onClick={() => setConvertTask(null)}>Cancel</button>
      </div>
    </div>
  ) : null;
  return (
    <>
      {/* Mobile Gmail-like list */}
      <div className="md:hidden" style={{ borderTop: '1px solid var(--color-border)' }}>
        {tasks.map((task) => (
          <MobileTaskRow
            key={task.id}
            task={task}
            onSwipeDelete={() => handleDeleteClick(task.id)}
            onComplete={() => onComplete?.(task.id)}
            isDeleting={deletingId === task.id}
            isCompleting={completingId === task.id}
            isRevealed={swipedId === task.id}
            onReveal={setSwipedId}
            onEdit={setEditTask}
            onConvert={setConvertTask}
            onLinkProject={setLinkTask}
            onScheduleToday={(id) => scheduleToday.mutate(id)}
            isScheduling={scheduleToday.isPending && scheduleToday.variables === task.id}
          />
        ))}
      </div>

      {/* Desktop table layout */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-muted)' }}>
                {onComplete && <th className="w-10 px-3 py-3"></th>}
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Title</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Type</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Area</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Impact</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Effort</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Priority</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Urgency</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider hidden xl:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Project</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider hidden xl:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Time</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider hidden xl:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Due Date</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider hidden xl:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Updated</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider">Actions</th>
                {onDelete && (
                  <th className="px-4 py-3 text-right text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}></th>
                )}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => (
                <tr
                  key={task.id}
                  className="transition-colors"
                  style={{
                    borderBottom: i < tasks.length - 1 ? '1px solid var(--color-border)' : undefined,
                  }}
                >
                  {onComplete && (
                    <td className="px-3 py-3">
                      <button
                        onClick={() => onComplete(task.id)}
                        disabled={completingId === task.id}
                        className="flex items-center justify-center h-5 w-5 rounded-full border-[1.5px] transition-all duration-200"
                        style={{
                          borderColor: completingId === task.id ? 'var(--primary-500)' : 'var(--color-border)',
                          backgroundColor: completingId === task.id ? 'var(--primary-500)' : 'transparent',
                        }}
                      >
                        {completingId === task.id && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <p className="text-body font-medium" style={{ color: 'var(--color-text)' }}>
                        {task.title}
                      </p>
                      {(task.source === 'BULK' || task.tags?.includes('Batch Uploaded')) && (
                        <Badge variant="primary" className="shrink-0 !text-[9px] !px-1.5 !py-0">Batch Uploaded</Badge>
                      )}
                    </div>
                    {task.area && (
                      <p className="text-caption md:hidden" style={{ color: 'var(--color-text-secondary)' }}>{task.area}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="!text-[10px] !px-1.5 !py-0.5">{task.type || '—'}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{task.area || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-body" style={{ color: 'var(--color-text)' }}>{task.impact ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-body" style={{ color: 'var(--color-text)' }}>{task.effort ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {task.priority != null ? (
                      <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700">
                        {task.priority}
                      </span>
                    ) : (
                      <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {task.urgency ? (
                      <Badge
                      variant={task.urgency === 'High' ? 'danger' : task.urgency === 'Medium' ? 'warning' : 'default'}
                      className="!text-[10px] !px-1.5 !py-0.5"
                    >
                      {task.urgency}
                    </Badge>
                    ) : (
                      <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-caption" style={{ color: task.projectName ? 'var(--primary-600)' : 'var(--color-text-secondary)' }}>
                      {task.projectName || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <TaskTimer task={task} compact />
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {task.dueDate ? (() => {
                      const diff = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000);
                      const label = diff < 0 ? 'Overdue' : diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : new Date(task.dueDate).toLocaleDateString();
                      const isUrgent = diff <= 0;
                      return (
                        <span className="text-caption font-medium" style={{ color: isUrgent ? '#dc2626' : 'var(--color-text-secondary)' }}>
                          {label}
                        </span>
                      );
                    })() : (
                      <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                      {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        className="btn btn-xs btn-outline p-1"
                        onClick={() => scheduleToday.mutate(task.id)}
                        disabled={scheduleToday.isPending}
                        title="Schedule for today"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        className="btn btn-xs btn-outline p-1"
                        onClick={() => setEditTask(task)}
                        title="Edit task"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        className="btn btn-xs btn-outline p-1"
                        onClick={() => setLinkTask(task)}
                        title="Link to project"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>
                      <button
                        className="btn btn-xs btn-outline p-1"
                        onClick={() => setConvertTask(task)}
                        title="Convert to project"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  {onDelete && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteClick(task.id)}
                        disabled={deletingId === task.id}
                        className="p-1.5 rounded-md transition-colors hover:opacity-80 disabled:opacity-40"
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
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {editTaskModal}
      {ConvertTaskModal}
      {linkTask && <LinkToProjectModal task={linkTask} onClose={() => setLinkTask(null)} />}
      {confirmId && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-sm w-full space-y-4">
            <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Delete Task?</h3>
            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              This task will be moved to the deleted list.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setConfirmId(null); setSwipedId(null); }}
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
