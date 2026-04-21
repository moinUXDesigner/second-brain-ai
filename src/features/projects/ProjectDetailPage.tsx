import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProject, useDeleteProject, useUpdateProject } from '@/hooks/useProjects';
import { useUpdateTaskStatus, useDeleteTask, useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TaskTimer } from '@/components/task/TaskTimer';
import { TableSkeleton } from '@/components/ui/Skeleton';
import type { Task } from '@/types';

// ── Task Row ──

function TaskRow({ task, variant, onToggle, onDelete, onEdit, deletingId }: {
  task: Task;
  variant: 'pending' | 'done';
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (task: Task) => void;
  deletingId?: string | null;
}) {
  const isDone = variant === 'done';
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-black/[.015] dark:hover:bg-white/[.015]">
      <button
        onClick={() => onToggle(task.id)}
        className="shrink-0 flex items-center justify-center h-[20px] w-[20px] rounded-full border-[1.5px] transition-all"
        style={{
          borderColor: isDone ? 'var(--success-500, #22c55e)' : 'var(--color-border)',
          backgroundColor: isDone ? 'var(--success-500, #22c55e)' : 'transparent',
        }}
      >
        {isDone && (
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm truncate"
          style={{
            color: isDone ? 'var(--color-muted-fg)' : 'var(--color-text)',
            textDecoration: isDone ? 'line-through' : undefined,
          }}
        >
          {task.title}
        </p>
        {!isDone && (
          <div className="mt-1">
            <TaskTimer task={task} compact />
          </div>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {task.urgency === 'High' && !isDone && (
          <Badge variant="danger" className="!text-[9px] !px-1.5 !py-0">HIGH</Badge>
        )}
        {task.dueDate && (
          <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--color-muted-fg)' }}>
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {onEdit && !isDone && (
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded-md transition-colors opacity-60 hover:opacity-100"
            style={{ color: 'var(--primary-600)' }}
            title="Edit task"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {onDelete && !isDone && (
          <button
            onClick={() => onDelete(task.id)}
            disabled={deletingId === task.id}
            className="p-1 rounded-md transition-colors opacity-60 hover:opacity-100 disabled:opacity-30"
            style={{ color: 'var(--color-danger, #ef4444)' }}
          >
            {deletingId === task.id ? (
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
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
    </div>
  );
}

// ── Main Page ──

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id!);
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showEditTask, setShowEditTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [editTaskTitle, setEditTaskTitle] = useState('');

  const { pending, completed, overdue, highPriority, suggestedNext } = useMemo(() => {
    if (!project?.subtasks) return { pending: [], completed: [], overdue: [], highPriority: [], suggestedNext: null };

    const now = new Date();
    const p: Task[] = [];
    const c: Task[] = [];
    const od: Task[] = [];
    const hp: Task[] = [];

    project.subtasks.forEach((t) => {
      if (t.status === 'Done') {
        c.push(t);
      } else if (t.status !== 'Deleted') {
        p.push(t);
        if (t.dueDate && new Date(t.dueDate) < now) od.push(t);
        if (t.urgency === 'High' || (t.priority && t.priority >= 8)) hp.push(t);
      }
    });

    p.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    return { pending: p, completed: c, overdue: od, highPriority: hp, suggestedNext: p[0] ?? null };
  }, [project]);

  const totalTasks = pending.length + completed.length;
  const progress = totalTasks > 0 ? Math.round((completed.length / totalTasks) * 100) : 0;

  const handleDeleteProject = () => {
    deleteProject.mutate(id!, { onSuccess: () => navigate('/projects') });
    setShowDeleteConfirm(false);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await createTask.mutateAsync({
      title: newTaskTitle.trim(),
      status: 'Pending',
      projectId: id,
    });
    setNewTaskTitle('');
    setShowAddTask(false);
  };

  const handleAddNote = async () => {
    if (!newNoteTitle.trim()) return;
    await createTask.mutateAsync({
      title: newNoteTitle.trim(),
      status: 'Note',
      notes: newNoteContent.trim() || undefined,
      projectId: id,
    });
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowAddNote(false);
  };

  const handleEditProject = async () => {
    if (!editProjectTitle.trim()) return;
    await updateProject.mutateAsync({
      id: id!,
      updates: {
        title: editProjectTitle.trim(),
        description: editProjectDescription.trim() || undefined,
      },
    });
    setShowEditProject(false);
  };

  const handleEditTask = async () => {
    if (!showEditTask || !editTaskTitle.trim()) return;
    await updateTask.mutateAsync({
      id: showEditTask.id,
      updates: { title: editTaskTitle.trim() },
    });
    setShowEditTask(null);
    setEditTaskTitle('');
  };

  if (isLoading) {
    return <div className="space-y-6 p-4"><TableSkeleton /></div>;
  }

  if (!project) {
    return (
      <div className="card p-12 text-center space-y-3">
        <p className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Project not found</p>
        <button onClick={() => navigate('/projects')} className="text-caption font-medium" style={{ color: 'var(--primary-600)' }}>
          ← Back to Projects
        </button>
      </div>
    );
  }

  const priorityLabel = project.priority
    ? project.priority >= 8 ? 'High' : project.priority >= 5 ? 'Medium' : 'Low'
    : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
        style={{ color: 'var(--primary-600)' }}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Projects
      </button>

      {/* Header card */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1 min-w-0 flex items-start gap-2">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold leading-tight" style={{ color: 'var(--color-text)' }}>
                {project.title}
              </h1>
              {project.description && (
                <p className="text-caption mt-1" style={{ color: 'var(--color-text-secondary)' }}>{project.description}</p>
              )}
            </div>
            <button
              onClick={() => {
                setEditProjectTitle(project.title);
                setEditProjectDescription(project.description || '');
                setShowEditProject(true);
              }}
              className="p-1.5 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--primary-600)' }}
              title="Edit project"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {project.domain && (
              <Badge variant="default">{project.domain}</Badge>
            )}
            <Badge variant={project.status === 'Active' ? 'primary' : project.status === 'Completed' ? 'success' : 'default'}>
              {project.status}
            </Badge>
            {priorityLabel && (
              <Badge variant={priorityLabel === 'High' ? 'danger' : priorityLabel === 'Medium' ? 'warning' : 'success'}>
                {priorityLabel}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowAddTask(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowAddNote(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Note
          </Button>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            <span>
              <strong style={{ color: 'var(--color-text)' }}>{completed.length}/{totalTasks}</strong> Tasks Completed
            </span>
            <span className="font-bold" style={{ color: progress === 100 ? 'var(--success-600, #16a34a)' : 'var(--primary-600)' }}>
              {progress}%
            </span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: progress === 100 ? 'var(--success-500, #22c55e)' : 'var(--primary-500)',
              }}
            />
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap items-center gap-2">
          {project.createdAt && (
            <span
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md"
              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
          {project.dueDate && (
            <span
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md"
              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Due {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Two-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Task lists */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pending */}
          {pending.length > 0 && (
            <div className="card overflow-hidden">
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Pending</h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}>
                  {pending.length}
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {pending.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    variant="pending"
                    onToggle={(tid) => updateStatus.mutate({ id: tid, status: 'Done' })}
                    onEdit={(task) => {
                      setShowEditTask(task);
                      setEditTaskTitle(task.title);
                    }}
                    onDelete={(tid) => deleteTask.mutate(tid)}
                    deletingId={deleteTask.isPending ? (deleteTask.variables ?? null) : null}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div className="card overflow-hidden">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full px-4 py-3 flex items-center justify-between transition-colors hover:bg-black/[.01] dark:hover:bg-white/[.01]"
                style={{ borderBottom: showCompleted ? '1px solid var(--color-border)' : undefined }}
              >
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Completed</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--success-50, #f0fdf4)', color: 'var(--success-700, #15803d)' }}>
                    {completed.length}
                  </span>
                  <svg
                    className="h-3.5 w-3.5 transition-transform"
                    style={{ color: 'var(--color-muted-fg)', transform: showCompleted ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {showCompleted && (
                <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  {completed.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      variant="done"
                      onToggle={(tid) => updateStatus.mutate({ id: tid, status: 'Pending' })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {totalTasks === 0 && (
            <div className="card p-10 text-center">
              <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>No subtasks in this project</p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Smart Summary */}
          <div className="card p-4 space-y-2.5">
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Summary</h3>
            <div className="space-y-1.5">
              <SummaryRow icon="✅" text={`${completed.length} completed`} color="var(--success-600, #16a34a)" />
              {overdue.length > 0 && <SummaryRow icon="🟠" text={`${overdue.length} overdue`} color="var(--warning-600, #d97706)" />}
              {highPriority.length > 0 && <SummaryRow icon="🔥" text={`${highPriority.length} high priority`} color="var(--color-danger, #ef4444)" />}
              {suggestedNext && (
                <div className="pt-1 flex items-start gap-2">
                  <span className="text-sm leading-none">💡</span>
                  <span className="text-[12px] leading-tight" style={{ color: 'var(--color-text-secondary)' }}>
                    Next: <strong style={{ color: 'var(--color-text)' }}>{suggestedNext.title}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="card p-4">
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text)' }}>Stats</h3>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat value={pending.length} label="Pending" color="var(--primary-600)" />
              <MiniStat value={completed.length} label="Done" color="var(--success-600, #16a34a)" />
              {highPriority.length > 0 && <MiniStat value={highPriority.length} label="High Priority" color="var(--color-danger, #ef4444)" />}
              {overdue.length > 0 && <MiniStat value={overdue.length} label="Overdue" color="var(--warning-600, #d97706)" />}
            </div>
          </div>

          {/* Timeline */}
          {project.createdAt && (
            <div className="card p-4 space-y-2.5">
              <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Timeline</h3>
              <div className="space-y-2">
                <TimelineItem color="var(--primary-600)" text={`Started ${new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`} />
                {completed.length > 0 && <TimelineItem color="var(--success-500, #22c55e)" text={`${completed.length} task${completed.length !== 1 ? 's' : ''} completed`} />}
                {overdue.length > 0 && <TimelineItem color="var(--warning-500, #f59e0b)" text={`${overdue.length} task${overdue.length !== 1 ? 's' : ''} overdue`} />}
                {pending.length > 0 && <TimelineItem color="var(--color-border)" text={`${pending.length} task${pending.length !== 1 ? 's' : ''} remaining`} />}
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div className="card p-4 space-y-3" style={{ borderColor: 'var(--color-danger, #ef4444)', borderWidth: '1px' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-danger, #ef4444)' }}>Danger Zone</h3>
            <p className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
              Deleting this project moves it to deleted list. Subtasks will remain.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteProject.isPending}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors !text-white disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-danger, #ef4444)' }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Project
            </button>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-sm w-full space-y-4">
            <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Delete Project?</h3>
            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              This will delete "{project.title}" and move it to Deleted Projects. Subtasks will remain in your tasks.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-md text-caption font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
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

      {/* Add Task modal */}
      {showAddTask && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-md w-full space-y-4">
            <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Add Task to {project.title}</h3>
            <Input
              id="taskTitle"
              label="Task Title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title..."
              required
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShowAddTask(false); setNewTaskTitle(''); }}>
                Cancel
              </Button>
              <Button onClick={handleAddTask} isLoading={createTask.isPending} disabled={!newTaskTitle.trim()}>
                Add Task
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Note modal */}
      {showAddNote && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-md w-full space-y-4">
            <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Add Note to {project.title}</h3>
            <Input
              id="noteTitle"
              label="Note Title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Enter note title..."
              required
            />
            <div>
              <label htmlFor="noteContent" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Content (optional)
              </label>
              <textarea
                id="noteContent"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Add note details..."
                rows={4}
                className="input-base w-full resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShowAddNote(false); setNewNoteTitle(''); setNewNoteContent(''); }}>
                Cancel
              </Button>
              <Button onClick={handleAddNote} isLoading={createTask.isPending} disabled={!newNoteTitle.trim()}>
                Add Note
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Project modal */}
      {showEditProject && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-md w-full space-y-4">
            <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Edit Project</h3>
            <Input
              id="projectTitle"
              label="Project Title"
              value={editProjectTitle}
              onChange={(e) => setEditProjectTitle(e.target.value)}
              placeholder="Enter project title..."
              required
            />
            <div>
              <label htmlFor="projectDescription" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Description (optional)
              </label>
              <textarea
                id="projectDescription"
                value={editProjectDescription}
                onChange={(e) => setEditProjectDescription(e.target.value)}
                placeholder="Add project description..."
                rows={3}
                className="input-base w-full resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditProject(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditProject} isLoading={updateProject.isPending} disabled={!editProjectTitle.trim()}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Task modal */}
      {showEditTask && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-md w-full space-y-4">
            <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Edit Task</h3>
            <Input
              id="editTaskTitle"
              label="Task Title"
              value={editTaskTitle}
              onChange={(e) => setEditTaskTitle(e.target.value)}
              placeholder="Enter task title..."
              required
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShowEditTask(null); setEditTaskTitle(''); }}>
                Cancel
              </Button>
              <Button onClick={handleEditTask} isLoading={updateTask.isPending} disabled={!editTaskTitle.trim()}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  );
}

// ── Sub-components ──

function SummaryRow({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm leading-none">{icon}</span>
      <span className="text-[12px]" style={{ color }}>{text}</span>
    </div>
  );
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: 'var(--color-muted)' }}>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{label}</div>
    </div>
  );
}

function TimelineItem({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>{text}</span>
    </div>
  );
}
