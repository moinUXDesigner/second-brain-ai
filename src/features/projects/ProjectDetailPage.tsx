import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProject } from '@/hooks/useProjects';
import { useUpdateTaskStatus, useDeleteTask } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import type { Task } from '@/types';

function SmartSummary({ pending, inProgress, completed, overdue, highPriority, suggestedNext }: {
  pending: Task[];
  inProgress: Task[];
  completed: Task[];
  overdue: Task[];
  highPriority: Task[];
  suggestedNext: Task | null;
}) {
  const navigate = useNavigate();
  return (
    <div className="card p-5 space-y-3">
      <h2 className="text-body font-bold" style={{ color: 'var(--color-text)' }}>Smart Summary</h2>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-base">✅</span>
          <span className="text-caption" style={{ color: 'var(--color-text)' }}>
            <strong>{completed.length}</strong> tasks <span style={{ color: 'var(--color-success, #22c55e)' }}>completed</span>
          </span>
        </div>
        {overdue.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-base">🟠</span>
            <span className="text-caption" style={{ color: 'var(--color-text)' }}>
              <strong>{overdue.length}</strong> tasks <span style={{ color: 'var(--color-warning, #f59e0b)' }}>overdue</span>
            </span>
          </div>
        )}
        {highPriority.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-base">🔥</span>
            <span className="text-caption" style={{ color: 'var(--color-text)' }}>
              <strong>{highPriority.length}</strong> <span style={{ color: 'var(--color-danger, #ef4444)' }}>high priority</span>
            </span>
          </div>
        )}
        {suggestedNext && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-base">💡</span>
            <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              Suggested next step: {suggestedNext.title}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskGroup({ title, tasks, onToggle, onDelete, deletingId, toggleLabel, toggleIcon, emptyText }: {
  title: string;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
  toggleLabel: string;
  toggleIcon: string;
  emptyText: string;
}) {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-body font-bold" style={{ color: 'var(--color-text)' }}>{title}</h3>
        <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{tasks.length}</span>
      </div>
      <div className="space-y-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="card flex items-center gap-3 px-4 py-3"
          >
            {/* Toggle button */}
            <button
              onClick={() => onToggle(task.id)}
              className="shrink-0 h-5 w-5 rounded border flex items-center justify-center transition-colors"
              style={{
                borderColor: title === 'Completed' ? 'var(--color-success, #22c55e)' : 'var(--color-border)',
                backgroundColor: title === 'Completed' ? 'var(--color-success, #22c55e)' : 'transparent',
                color: title === 'Completed' ? '#fff' : 'var(--color-text-secondary)',
              }}
              title={toggleLabel}
            >
              {title === 'Completed' && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Task info */}
            <div className="flex-1 min-w-0">
              <p
                className="text-body font-medium truncate"
                style={{
                  color: 'var(--color-text)',
                  textDecoration: title === 'Completed' ? 'line-through' : undefined,
                  opacity: title === 'Completed' ? 0.6 : 1,
                }}
              >
                {task.title}
              </p>
              {title === 'In Progress' && (
                <p className="text-caption" style={{ color: 'var(--primary-600)' }}>In Progress</p>
              )}
            </div>

            {/* Meta: due date, urgency badge */}
            <div className="shrink-0 flex items-center gap-2">
              {task.dueDate && (
                <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              {task.urgency === 'High' && <Badge variant="danger">HIGH</Badge>}
              {title === 'Completed' && (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-success, #22c55e)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {/* Delete button for pending/in-progress */}
            {onDelete && title !== 'Completed' && (
              <button
                onClick={() => onDelete(task.id)}
                disabled={deletingId === task.id}
                className="shrink-0 p-1 rounded transition-colors hover:opacity-80 disabled:opacity-40"
                style={{ color: 'var(--color-danger, #ef4444)' }}
                title="Delete task"
              >
                {deletingId === task.id ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id!);
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const { pending, inProgress, completed, overdue, highPriority, suggestedNext } = useMemo(() => {
    if (!project?.subtasks) return { pending: [], inProgress: [], completed: [], overdue: [], highPriority: [], suggestedNext: null };

    const now = new Date();
    const p: Task[] = [];
    const ip: Task[] = [];
    const c: Task[] = [];
    const od: Task[] = [];
    const hp: Task[] = [];

    project.subtasks.forEach((t) => {
      if (t.status === 'Done') {
        c.push(t);
      } else if (t.status === 'Deleted') {
        // skip deleted
      } else {
        p.push(t);
        if (t.dueDate && new Date(t.dueDate) < now) od.push(t);
        if (t.urgency === 'High' || (t.priority && t.priority >= 8)) hp.push(t);
      }
    });

    // Sort pending by priority desc
    p.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    // Suggested next: highest priority pending task
    const suggested = p.length > 0 ? p[0] : null;

    return { pending: p, inProgress: ip, completed: c, overdue: od, highPriority: hp, suggestedNext: suggested };
  }, [project]);

  const totalTasks = pending.length + completed.length;
  const progress = totalTasks > 0 ? Math.round((completed.length / totalTasks) * 100) : 0;

  const handleMarkDone = (taskId: string) => {
    updateStatus.mutate({ id: taskId, status: 'Done' });
  };

  const handleReopen = (taskId: string) => {
    updateStatus.mutate({ id: taskId, status: 'Pending' });
  };

  const handleDelete = (taskId: string) => {
    deleteTask.mutate(taskId);
  };

  const priorityLabel = project?.priority
    ? project.priority >= 8 ? 'High' : project.priority >= 5 ? 'Medium' : 'Low'
    : null;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <TableSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card p-12 text-center">
        <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>Project not found.</p>
        <button onClick={() => navigate('/projects')} className="mt-4 text-caption font-medium" style={{ color: 'var(--primary-600)' }}>
          ← Back to Projects
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Back button */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1 text-caption font-medium transition-colors hover:opacity-80"
        style={{ color: 'var(--primary-600)' }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Projects
      </button>

      {/* Header: title + progress */}
      <div className="space-y-3">
        <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>{project.title}</h1>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: 'var(--primary-600)' }}
            />
          </div>
        </div>

        {/* Meta row: tasks count, due, priority */}
        <div className="flex flex-wrap items-center gap-4 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
          <span style={{ color: 'var(--color-text)' }}>
            <strong>{completed.length}/{totalTasks}</strong> Tasks Completed
          </span>
          {project.dueDate && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Due: {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {priorityLabel && (
            <span className="flex items-center gap-1">
              <span style={{ color: priorityLabel === 'High' ? 'var(--color-danger, #ef4444)' : priorityLabel === 'Medium' ? 'var(--color-warning, #f59e0b)' : 'var(--color-success, #22c55e)' }}>♥</span>
              <span style={{ color: priorityLabel === 'High' ? 'var(--color-danger, #ef4444)' : undefined }}>
                {priorityLabel} Priority
              </span>
            </span>
          )}
          <Badge variant={project.status === 'Active' ? 'primary' : project.status === 'Completed' ? 'success' : 'default'}>
            {project.status}
          </Badge>
        </div>

        {project.description && (
          <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{project.description}</p>
        )}
      </div>

      {/* Smart Summary */}
      <SmartSummary
        pending={pending}
        inProgress={inProgress}
        completed={completed}
        overdue={overdue}
        highPriority={highPriority}
        suggestedNext={suggestedNext}
      />

      {/* Task Groups */}
      <div className="space-y-6">
        <TaskGroup
          title="Pending"
          tasks={pending}
          onToggle={handleMarkDone}
          onDelete={handleDelete}
          deletingId={deleteTask.isPending ? (deleteTask.variables ?? null) : null}
          toggleLabel="Mark as done"
          toggleIcon="□"
          emptyText="No pending tasks"
        />

        <TaskGroup
          title="Completed"
          tasks={completed}
          onToggle={handleReopen}
          toggleLabel="Reopen task"
          toggleIcon="☑"
          emptyText="No completed tasks"
        />
      </div>

      {/* Timeline / Stats footer */}
      {project.createdAt && (
        <div className="card p-5 space-y-3">
          <h3 className="text-body font-bold" style={{ color: 'var(--color-text)' }}>Timeline</h3>
          <div className="space-y-2 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Started {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>+{completed.length} Tasks completed</span>
            </div>
            {overdue.length > 0 && (
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{overdue.length} Tasks overdue</span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
