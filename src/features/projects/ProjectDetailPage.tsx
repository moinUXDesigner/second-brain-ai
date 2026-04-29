import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useProject, useDeleteProject, useUpdateProject } from '@/hooks/useProjects';
import { useUpdateTaskStatus, useUpdateTask, useDeleteTask, useCreateTask, useScheduleToday } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TaskTimer } from '@/components/task/TaskTimer';
import { TaskViewModal } from '@/components/task/TaskViewModal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatDate, formatDateRelative } from '@/utils/dateFormat';
import type { ProjectMilestone, ProjectPhase, Task } from '@/types';
import { EditTaskModal } from '@/features/tasks/components/EditTaskModal';

type ProjectTaskSort = 'priority' | 'dueDate' | 'newest' | 'oldest' | 'phase' | 'milestone' | 'maslow';
type ProjectTaskStatusFilter = 'all' | 'pending' | 'done';

function createStructureId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const MASLOW_LEVELS = [
  'Physiological',
  'Safety',
  'Love',
  'Esteem',
  'Self-Actualization',
] as const;

const MASLOW_PHASE_DETAILS: Record<string, { title: string; description: string }> = {
  Physiological: {
    title: 'Maslow 1 - Physiological',
    description: 'Stabilize essential work that keeps the project functioning.',
  },
  Safety: {
    title: 'Maslow 2 - Safety',
    description: 'Handle reliability, access, data protection, error handling, and risk reduction.',
  },
  Love: {
    title: 'Maslow 3 - Connection',
    description: 'Improve collaboration, integration, communication, and user relationships.',
  },
  Esteem: {
    title: 'Maslow 4 - Esteem',
    description: 'Polish quality, usability, confidence, reporting, and stakeholder-visible value.',
  },
  'Self-Actualization': {
    title: 'Maslow 5 - Self-Actualization',
    description: 'Advance growth features, intelligence, optimization, and strategic refinement.',
  },
};

const MILESTONE_BUCKETS = [
  { key: 'critical', title: 'Critical First', description: 'High priority and urgent work' },
  { key: 'core', title: 'Core Delivery', description: 'Important foundation work' },
  { key: 'enhancement', title: 'Enhancement', description: 'Polish, optimization, and nice-to-have work' },
] as const;

function normalizeText(value?: string | null) {
  return (value || '').trim().toLowerCase();
}

function escapeHtml(value?: string | number | null) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function inferMaslowLevel(task: Task) {
  const explicit = MASLOW_LEVELS.find((level) => normalizeText(task.maslow) === normalizeText(level));
  if (explicit) return explicit;

  const text = normalizeText(`${task.title} ${task.notes || ''} ${task.category || ''} ${task.area || ''}`);
  if (/\b(error|bug|fix|security|login|signin|backup|permission|risk|safe|delete|validation|handling|zakat|finance|asset|loan|receivable)\b/.test(text)) {
    return 'Safety';
  }
  if (/\b(mail|email|google|share|collab|comment|note|notification|user|profile|team)\b/.test(text)) {
    return 'Love';
  }
  if (/\b(ui|ux|enhance|dashboard|analytics|report|print|export|sort|filter|pagination|display|view|refine)\b/.test(text)) {
    return 'Esteem';
  }
  if (/\b(ai|automate|intelligence|optimize|sequence|analyz|suggest|strategy)\b/.test(text)) {
    return 'Self-Actualization';
  }

  return 'Physiological';
}

function urgencyScore(task: Task) {
  const urgency = normalizeText(task.urgency);
  if (urgency === 'high') return 30;
  if (urgency === 'medium') return 15;
  return 0;
}

function dueDateScore(task: Task) {
  const dateValue = task.dueDate || task.deadlineDate;
  if (!dateValue) return 0;

  const due = new Date(dateValue).getTime();
  if (Number.isNaN(due)) return 0;

  const days = Math.ceil((due - Date.now()) / 86400000);
  if (days < 0) return 25;
  if (days <= 3) return 20;
  if (days <= 7) return 12;
  return 4;
}

function getTaskPriorityScore(task: Task) {
  const priority = task.priority ?? 0;
  const impact = task.impact ?? 0;
  const effort = task.effort ?? 0;
  return priority * 10 + impact * 2 - effort + urgencyScore(task) + dueDateScore(task);
}

function getMilestoneBucket(task: Task) {
  const score = getTaskPriorityScore(task);
  if (score >= 95 || task.urgency === 'High') return 'critical';
  if (score >= 45 || (task.priority ?? 0) >= 5) return 'core';
  return 'enhancement';
}

function resolveTaskStructure(task: Task, phases: ProjectPhase[], milestones: ProjectMilestone[]) {
  const phase = phases.find((p) => p.id === task.phaseId);
  const milestone = milestones.find((m) => m.id === task.milestoneId);
  return {
    ...task,
    phaseName: phase?.title || task.phaseName,
    milestoneName: milestone?.title || task.milestoneName,
  };
}

// ── Task Row ──

function TaskRow({ task, variant, phases, milestones, onToggle, onDelete, onEdit, onView, onPhaseChange, onMilestoneChange, onScheduleToday, deletingId, schedulingId, updatingStructureId }: {
  task: Task;
  variant: 'pending' | 'done';
  phases: ProjectPhase[];
  milestones: ProjectMilestone[];
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (task: Task) => void;
  onView: (task: Task) => void;
  onPhaseChange: (task: Task, phaseId: string) => void;
  onMilestoneChange: (task: Task, milestoneId: string) => void;
  onScheduleToday?: (id: string) => void;
  deletingId?: string | null;
  schedulingId?: string | null;
  updatingStructureId?: string | null;
}) {
  const isDone = variant === 'done';
  const phaseMilestones = milestones.filter((m) => !m.phaseId || m.phaseId === task.phaseId);
  const isUpdatingStructure = updatingStructureId === task.id;
  return (
    <div
      onClick={() => onView(task)}
      className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-black/[.015] dark:hover:bg-white/[.015]"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
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
        {phases.length > 0 && (
          <div className="mt-2 flex gap-1 md:hidden">
            <select
              value={task.phaseId || ''}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onPhaseChange(task, e.target.value)}
              disabled={isUpdatingStructure}
              className="min-w-0 flex-1 rounded-md border px-2 py-1 text-[11px] outline-none disabled:opacity-50"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: task.phaseId ? 'var(--primary-700)' : 'var(--color-text-secondary)',
              }}
              title="Assign phase"
            >
              <option value="">No phase</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>{phase.title}</option>
              ))}
            </select>
            {phaseMilestones.length > 0 && (
              <select
                value={task.milestoneId || ''}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onMilestoneChange(task, e.target.value)}
                disabled={isUpdatingStructure}
                className="min-w-0 flex-1 rounded-md border px-2 py-1 text-[11px] outline-none disabled:opacity-50"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: task.milestoneId ? 'var(--primary-700)' : 'var(--color-text-secondary)',
                }}
                title="Assign milestone"
              >
                <option value="">No milestone</option>
                {phaseMilestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {phases.length > 0 && (
          <select
            value={task.phaseId || ''}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onPhaseChange(task, e.target.value)}
            disabled={isUpdatingStructure}
            className="hidden md:block rounded-md border px-2 py-1 text-[11px] outline-none disabled:opacity-50"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: task.phaseId ? 'var(--primary-700)' : 'var(--color-text-secondary)',
            }}
            title="Assign phase"
          >
            <option value="">No phase</option>
            {phases.map((phase) => (
              <option key={phase.id} value={phase.id}>{phase.title}</option>
            ))}
          </select>
        )}
        {phaseMilestones.length > 0 && (
          <select
            value={task.milestoneId || ''}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onMilestoneChange(task, e.target.value)}
            disabled={isUpdatingStructure}
            className="hidden lg:block rounded-md border px-2 py-1 text-[11px] outline-none disabled:opacity-50"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: task.milestoneId ? 'var(--primary-700)' : 'var(--color-text-secondary)',
            }}
            title="Assign milestone"
          >
            <option value="">No milestone</option>
            {phaseMilestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
            ))}
          </select>
        )}
        {task.urgency === 'High' && !isDone && (
          <Badge variant="danger" className="!text-[9px] !px-1.5 !py-0">HIGH</Badge>
        )}
        {task.dueDate && (
          <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--color-muted-fg)' }}>
            {formatDateRelative(task.dueDate)}
          </span>
        )}
        {onScheduleToday && !isDone && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onScheduleToday(task.id);
            }}
            disabled={schedulingId === task.id}
            className="p-1 rounded-md transition-colors opacity-60 hover:opacity-100 disabled:opacity-30"
            style={{ color: 'var(--primary-600)' }}
            title="Schedule for today"
          >
            {schedulingId === task.id ? (
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
        {onEdit && !isDone && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
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
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const scheduleToday = useScheduleToday();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showViewTask, setShowViewTask] = useState<Task | null>(null);
  const [showEditTask, setShowEditTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newPhaseTitle, setNewPhaseTitle] = useState('');
  const [newPhaseDescription, setNewPhaseDescription] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestonePhaseId, setNewMilestonePhaseId] = useState('');
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('');
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [isSequencing, setIsSequencing] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<ProjectTaskStatusFilter>('all');
  const [taskPhaseFilter, setTaskPhaseFilter] = useState('');
  const [taskMilestoneFilter, setTaskMilestoneFilter] = useState('');
  const [taskUrgencyFilter, setTaskUrgencyFilter] = useState('');
  const [taskSortBy, setTaskSortBy] = useState<ProjectTaskSort>('priority');

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
  const phases = project?.phases ?? [];
  const milestones = project?.milestones ?? [];
  const updatingStructureId = updateTask.isPending ? (updateTask.variables?.id ?? null) : null;
  const projectTasks = useMemo(() => (
    project?.subtasks?.filter((task) => task.status !== 'Deleted' && task.status !== 'Note') ?? []
  ), [project?.subtasks]);
  const urgencyOptions = useMemo(() => {
    const options = new Set<string>();
    projectTasks.forEach((task) => {
      if (task.urgency) options.add(task.urgency);
    });
    return Array.from(options).sort();
  }, [projectTasks]);
  const filteredProjectTasks = useMemo(() => {
    let list = projectTasks.map((task) => resolveTaskStructure(task, phases, milestones));

    if (taskSearchQuery.trim()) {
      const query = normalizeText(taskSearchQuery);
      list = list.filter((task) => (
        normalizeText(task.title).includes(query)
        || normalizeText(task.notes).includes(query)
        || normalizeText(task.area).includes(query)
        || normalizeText(task.category).includes(query)
        || normalizeText(task.phaseName).includes(query)
        || normalizeText(task.milestoneName).includes(query)
      ));
    }

    if (taskStatusFilter === 'pending') list = list.filter((task) => task.status !== 'Done');
    if (taskStatusFilter === 'done') list = list.filter((task) => task.status === 'Done');
    if (taskPhaseFilter) {
      list = list.filter((task) => taskPhaseFilter === 'unassigned' ? !task.phaseId : task.phaseId === taskPhaseFilter);
    }
    if (taskMilestoneFilter) {
      list = list.filter((task) => taskMilestoneFilter === 'unassigned' ? !task.milestoneId : task.milestoneId === taskMilestoneFilter);
    }
    if (taskUrgencyFilter) list = list.filter((task) => task.urgency === taskUrgencyFilter);

    list.sort((a, b) => {
      switch (taskSortBy) {
        case 'dueDate':
          return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
        case 'newest':
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        case 'oldest':
          return (a.createdAt || '').localeCompare(b.createdAt || '');
        case 'phase':
          return (a.phaseName || 'Unassigned').localeCompare(b.phaseName || 'Unassigned');
        case 'milestone':
          return (a.milestoneName || 'Unassigned').localeCompare(b.milestoneName || 'Unassigned');
        case 'maslow':
          return MASLOW_LEVELS.indexOf(inferMaslowLevel(a)) - MASLOW_LEVELS.indexOf(inferMaslowLevel(b))
            || getTaskPriorityScore(b) - getTaskPriorityScore(a);
        case 'priority':
        default:
          return getTaskPriorityScore(b) - getTaskPriorityScore(a);
      }
    });

    return list;
  }, [milestones, phases, projectTasks, taskMilestoneFilter, taskPhaseFilter, taskSearchQuery, taskSortBy, taskStatusFilter, taskUrgencyFilter]);
  const visiblePending = filteredProjectTasks.filter((task) => task.status !== 'Done');
  const visibleCompleted = filteredProjectTasks.filter((task) => task.status === 'Done');
  const hasTaskFilters = Boolean(taskSearchQuery || taskStatusFilter !== 'all' || taskPhaseFilter || taskMilestoneFilter || taskUrgencyFilter || taskSortBy !== 'priority');
  const taskCountsByPhase = useMemo(() => {
    const counts = new Map<string, { total: number; done: number }>();

    project?.subtasks?.forEach((task) => {
      const phaseId = task.phaseId || '';
      const existing = counts.get(phaseId) ?? { total: 0, done: 0 };
      existing.total += task.status !== 'Deleted' ? 1 : 0;
      existing.done += task.status === 'Done' ? 1 : 0;
      counts.set(phaseId, existing);
    });

    return counts;
  }, [project?.subtasks]);

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

  const handleAddPhase = async () => {
    if (!newPhaseTitle.trim()) return;

    const nextPhase: ProjectPhase = {
      id: createStructureId('phase'),
      title: newPhaseTitle.trim(),
      description: newPhaseDescription.trim() || undefined,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    await updateProject.mutateAsync({
      id: id!,
      updates: { phases: [...phases, nextPhase] },
    });
    setNewPhaseTitle('');
    setNewPhaseDescription('');
    setShowAddPhase(false);
  };

  const handleAddMilestone = async () => {
    if (!newMilestoneTitle.trim()) return;

    const nextMilestone: ProjectMilestone = {
      id: createStructureId('milestone'),
      title: newMilestoneTitle.trim(),
      phaseId: newMilestonePhaseId || undefined,
      dueDate: newMilestoneDueDate || undefined,
      status: 'Planned',
      createdAt: new Date().toISOString(),
    };

    await updateProject.mutateAsync({
      id: id!,
      updates: { milestones: [...milestones, nextMilestone] },
    });
    setNewMilestoneTitle('');
    setNewMilestonePhaseId('');
    setNewMilestoneDueDate('');
    setShowAddMilestone(false);
  };

  const handlePhaseChange = (task: Task, phaseId: string) => {
    const currentMilestone = milestones.find((m) => m.id === task.milestoneId);
    const shouldClearMilestone = currentMilestone && currentMilestone.phaseId && currentMilestone.phaseId !== phaseId;

    updateTask.mutate({
      id: task.id,
      updates: {
        phaseId: phaseId || null,
        milestoneId: shouldClearMilestone ? null : task.milestoneId,
      },
    });
  };

  const handleMilestoneChange = (task: Task, milestoneId: string) => {
    const milestone = milestones.find((m) => m.id === milestoneId);

    updateTask.mutate({
      id: task.id,
      updates: {
        milestoneId: milestoneId || null,
        phaseId: milestone?.phaseId || task.phaseId || null,
      },
    });
  };

  const handleSequencing = async () => {
    if (!project) return;

    const unarrangedTasks = (project.subtasks || []).filter((task) => (
      task.status !== 'Deleted'
      && task.status !== 'Note'
      && (!task.phaseId || !task.milestoneId)
    ));

    if (unarrangedTasks.length === 0) {
      toast.success('All project tasks are already sequenced');
      return;
    }

    setIsSequencing(true);
    const toastId = toast.loading('AI is sequencing phases and milestones...');

    try {
      const nextPhases = [...phases];
      const nextMilestones = [...milestones];
      const phaseByMaslow = new Map<string, ProjectPhase>();
      const milestoneByPhaseAndBucket = new Map<string, ProjectMilestone>();
      const groupedTasks = [...unarrangedTasks].sort((a, b) => {
        const maslowDiff = MASLOW_LEVELS.indexOf(inferMaslowLevel(a)) - MASLOW_LEVELS.indexOf(inferMaslowLevel(b));
        if (maslowDiff !== 0) return maslowDiff;
        return getTaskPriorityScore(b) - getTaskPriorityScore(a);
      });

      MASLOW_LEVELS.forEach((level) => {
        const details = MASLOW_PHASE_DETAILS[level];
        const existing = nextPhases.find((phase) => normalizeText(phase.title) === normalizeText(details.title));
        if (existing) phaseByMaslow.set(level, existing);
      });

      groupedTasks.forEach((task) => {
        const maslowLevel = inferMaslowLevel(task);
        const phaseDetails = MASLOW_PHASE_DETAILS[maslowLevel];
        let phase = phaseByMaslow.get(maslowLevel);

        if (!phase) {
          phase = {
            id: createStructureId('phase'),
            title: phaseDetails.title,
            description: phaseDetails.description,
            status: nextPhases.length === phases.length ? 'Active' : 'Planned',
            createdAt: new Date().toISOString(),
          };
          nextPhases.push(phase);
          phaseByMaslow.set(maslowLevel, phase);
        }

        MILESTONE_BUCKETS.forEach((bucket) => {
          const existing = nextMilestones.find((milestone) => (
            milestone.phaseId === phase?.id
            && normalizeText(milestone.title) === normalizeText(bucket.title)
          ));
          if (existing) milestoneByPhaseAndBucket.set(`${phase?.id}:${bucket.key}`, existing);
        });
      });

      const taskAssignments = groupedTasks.map((task) => {
        const maslowLevel = inferMaslowLevel(task);
        const phase = phaseByMaslow.get(maslowLevel)!;
        const bucketKey = getMilestoneBucket(task);
        const bucket = MILESTONE_BUCKETS.find((item) => item.key === bucketKey)!;
        const milestoneKey = `${phase.id}:${bucket.key}`;
        let milestone = milestoneByPhaseAndBucket.get(milestoneKey);

        if (!milestone) {
          milestone = {
            id: createStructureId('milestone'),
            title: bucket.title,
            phaseId: phase.id,
            status: 'Planned',
            createdAt: new Date().toISOString(),
          };
          nextMilestones.push(milestone);
          milestoneByPhaseAndBucket.set(milestoneKey, milestone);
        }

        return { task, phase, milestone };
      });

      await updateProject.mutateAsync({
        id: id!,
        updates: {
          phases: nextPhases,
          milestones: nextMilestones,
        },
      });

      for (const assignment of taskAssignments) {
        await updateTask.mutateAsync({
          id: assignment.task.id,
          updates: {
            phaseId: assignment.task.phaseId || assignment.phase.id,
            milestoneId: assignment.task.milestoneId || assignment.milestone.id,
          },
        });
      }

      toast.success(`Sequenced ${taskAssignments.length} task${taskAssignments.length !== 1 ? 's' : ''}`, { id: toastId });
    } catch {
      toast.error('Could not sequence this project', { id: toastId });
    } finally {
      setIsSequencing(false);
    }
  };

  const resetTaskFilters = () => {
    setTaskSearchQuery('');
    setTaskStatusFilter('all');
    setTaskPhaseFilter('');
    setTaskMilestoneFilter('');
    setTaskUrgencyFilter('');
    setTaskSortBy('priority');
  };

  const handlePrintTasks = () => {
    if (!project || projectTasks.length === 0) {
      toast.error('No project tasks to print');
      return;
    }

    const printableTasks = projectTasks
      .map((task) => resolveTaskStructure(task, phases, milestones))
      .sort((a, b) => getTaskPriorityScore(b) - getTaskPriorityScore(a));
    const printWindow = window.open('', '_blank', 'width=1100,height=800');

    if (!printWindow) {
      toast.error('Allow popups to print or save the task list');
      return;
    }

    const rows = printableTasks.map((task, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(task.title)}</td>
        <td>${escapeHtml(task.status)}</td>
        <td>${escapeHtml(task.phaseName || 'Unassigned')}</td>
        <td>${escapeHtml(task.milestoneName || 'Unassigned')}</td>
        <td>${escapeHtml(task.urgency || '-')}</td>
        <td>${escapeHtml(task.priority ?? '-')}</td>
        <td>${escapeHtml(task.dueDate ? formatDate(task.dueDate) : '-')}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(project.title)} - Tasks</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
            h1 { font-size: 22px; margin: 0 0 4px; }
            p { margin: 0 0 16px; color: #4b5563; font-size: 12px; }
            table { border-collapse: collapse; width: 100%; font-size: 11px; }
            th, td { border: 1px solid #d1d5db; padding: 7px 8px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; }
            @media print { button { display: none; } body { margin: 12mm; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()" style="margin-bottom:16px;padding:8px 12px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;">Print / Save PDF</button>
          <h1>${escapeHtml(project.title)}</h1>
          <p>${printableTasks.length} tasks exported on ${escapeHtml(formatDate(new Date().toISOString()))}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Task</th>
                <th>Status</th>
                <th>Phase</th>
                <th>Milestone</th>
                <th>Urgency</th>
                <th>Priority</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
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

        <div className="flex flex-wrap gap-2">
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
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSequencing}
            isLoading={isSequencing}
            disabled={totalTasks === 0}
            title="Automatically create phases and milestones, then assign unarranged tasks by Maslow priority"
          >
            {!isSequencing && (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a2 2 0 11-4 0V4zM6 12a2 2 0 114 0v1a2 2 0 11-4 0v-1zM16 12a2 2 0 114 0v1a2 2 0 11-4 0v-1zM11 20a2 2 0 114 0v1a2 2 0 11-4 0v-1z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7v3m-3 2h6m-3 3v3" />
              </svg>
            )}
            Sequencing
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handlePrintTasks}
            disabled={totalTasks === 0}
            title="Print the full project task list or save it as a PDF"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
            </svg>
            Print / Save
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
              {formatDate(project.createdAt)}
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
              Due {formatDateRelative(project.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Project structure */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Phases & Milestones</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Organize project tasks by delivery phase and milestone.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowAddPhase(true)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Phase
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowAddMilestone(true)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Milestone
            </Button>
          </div>
        </div>

        {phases.length === 0 && milestones.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-5 text-center" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>No phases yet</p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Create phases like Discovery, Build, Review, or Launch, then assign tasks from the task rows.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {phases.map((phase) => {
              const counts = taskCountsByPhase.get(phase.id) ?? { total: 0, done: 0 };
              const phaseMilestones = milestones.filter((m) => m.phaseId === phase.id);
              return (
                <div key={phase.id} className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{phase.title}</h3>
                      {phase.description && (
                        <p className="text-[12px] mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{phase.description}</p>
                      )}
                    </div>
                    <Badge variant={phase.status === 'Completed' ? 'success' : phase.status === 'Active' ? 'primary' : 'default'} className="!text-[10px] !px-1.5 !py-0">
                      {phase.status}
                    </Badge>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-muted)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0}%`,
                        backgroundColor: 'var(--primary-500)',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>{counts.done}/{counts.total} tasks done</span>
                    <span>{phaseMilestones.length} milestone{phaseMilestones.length !== 1 ? 's' : ''}</span>
                  </div>
                  {phaseMilestones.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {phaseMilestones.map((milestone) => (
                        <span
                          key={milestone.id}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
                        >
                          {milestone.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {milestones.filter((m) => !m.phaseId).length > 0 && (
              <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Unassigned Milestones</h3>
                <div className="flex flex-wrap gap-1">
                  {milestones.filter((m) => !m.phaseId).map((milestone) => (
                    <span
                      key={milestone.id}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
                    >
                      {milestone.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(taskCountsByPhase.get('')?.total ?? 0) > 0 && (
              <div className="rounded-lg border border-dashed p-3 space-y-1" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Unassigned Tasks</h3>
                <p className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                  {taskCountsByPhase.get('')?.total ?? 0} task{(taskCountsByPhase.get('')?.total ?? 0) !== 1 ? 's' : ''} waiting for a phase.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Two-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Task lists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-3 space-y-2">
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{ color: 'var(--color-muted-fg)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  placeholder="Search project tasks..."
                  className="input-base h-9 pl-9 text-sm"
                />
              </div>
              <div className="text-[12px] shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                {filteredProjectTasks.length} of {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <select
                value={taskSortBy}
                onChange={(e) => setTaskSortBy(e.target.value as ProjectTaskSort)}
                className="shrink-0 rounded-full border py-1 pl-2.5 pr-6 text-xs outline-none"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              >
                <option value="priority">Priority</option>
                <option value="dueDate">Due Date</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="phase">Phase</option>
                <option value="milestone">Milestone</option>
                <option value="maslow">Maslow</option>
              </select>
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value as ProjectTaskStatusFilter)}
                className="shrink-0 rounded-full border py-1 pl-2.5 pr-6 text-xs outline-none"
                style={{ borderColor: taskStatusFilter !== 'all' ? 'var(--primary-500)' : 'var(--color-border)', backgroundColor: taskStatusFilter !== 'all' ? 'var(--primary-50)' : 'var(--color-surface)', color: taskStatusFilter !== 'all' ? 'var(--primary-700)' : 'var(--color-text)' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="done">Completed</option>
              </select>
              <select
                value={taskPhaseFilter}
                onChange={(e) => {
                  setTaskPhaseFilter(e.target.value);
                  setTaskMilestoneFilter('');
                }}
                className="shrink-0 rounded-full border py-1 pl-2.5 pr-6 text-xs outline-none"
                style={{ borderColor: taskPhaseFilter ? 'var(--primary-500)' : 'var(--color-border)', backgroundColor: taskPhaseFilter ? 'var(--primary-50)' : 'var(--color-surface)', color: taskPhaseFilter ? 'var(--primary-700)' : 'var(--color-text)' }}
              >
                <option value="">All Phases</option>
                <option value="unassigned">No Phase</option>
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>{phase.title}</option>
                ))}
              </select>
              <select
                value={taskMilestoneFilter}
                onChange={(e) => setTaskMilestoneFilter(e.target.value)}
                className="shrink-0 rounded-full border py-1 pl-2.5 pr-6 text-xs outline-none"
                style={{ borderColor: taskMilestoneFilter ? 'var(--primary-500)' : 'var(--color-border)', backgroundColor: taskMilestoneFilter ? 'var(--primary-50)' : 'var(--color-surface)', color: taskMilestoneFilter ? 'var(--primary-700)' : 'var(--color-text)' }}
              >
                <option value="">All Milestones</option>
                <option value="unassigned">No Milestone</option>
                {milestones
                  .filter((milestone) => !taskPhaseFilter || taskPhaseFilter === 'unassigned' || !milestone.phaseId || milestone.phaseId === taskPhaseFilter)
                  .map((milestone) => (
                    <option key={milestone.id} value={milestone.id}>{milestone.title}</option>
                  ))}
              </select>
              <select
                value={taskUrgencyFilter}
                onChange={(e) => setTaskUrgencyFilter(e.target.value)}
                className="shrink-0 rounded-full border py-1 pl-2.5 pr-6 text-xs outline-none"
                style={{ borderColor: taskUrgencyFilter ? 'var(--primary-500)' : 'var(--color-border)', backgroundColor: taskUrgencyFilter ? 'var(--primary-50)' : 'var(--color-surface)', color: taskUrgencyFilter ? 'var(--primary-700)' : 'var(--color-text)' }}
              >
                <option value="">All Urgency</option>
                {urgencyOptions.map((urgency) => (
                  <option key={urgency} value={urgency}>{urgency}</option>
                ))}
              </select>
              {hasTaskFilters && (
                <button
                  onClick={resetTaskFilters}
                  className="shrink-0 rounded-full px-2 py-1 text-xs font-medium"
                  style={{ color: 'var(--primary-600)' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Pending */}
          {visiblePending.length > 0 && (
            <div className="card overflow-hidden">
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Pending</h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}>
                  {visiblePending.length}
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {visiblePending.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={{ ...t, projectName: t.projectName || project.title }}
                    variant="pending"
                    phases={phases}
                    milestones={milestones}
                    onToggle={(tid) => updateStatus.mutate({ id: tid, status: 'Done' })}
                    onView={setShowViewTask}
                    onPhaseChange={handlePhaseChange}
                    onMilestoneChange={handleMilestoneChange}
                    onEdit={setShowEditTask}
                    onDelete={(tid) => deleteTask.mutate(tid)}
                    onScheduleToday={(tid) => scheduleToday.mutate(tid)}
                    deletingId={deleteTask.isPending ? (deleteTask.variables ?? null) : null}
                    schedulingId={scheduleToday.isPending ? (scheduleToday.variables ?? null) : null}
                    updatingStructureId={updatingStructureId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {visibleCompleted.length > 0 && (
            <div className="card overflow-hidden">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full px-4 py-3 flex items-center justify-between transition-colors hover:bg-black/[.01] dark:hover:bg-white/[.01]"
                style={{ borderBottom: showCompleted ? '1px solid var(--color-border)' : undefined }}
              >
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Completed</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--success-50, #f0fdf4)', color: 'var(--success-700, #15803d)' }}>
                    {visibleCompleted.length}
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
                  {visibleCompleted.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={{ ...t, projectName: t.projectName || project.title }}
                      variant="done"
                      phases={phases}
                      milestones={milestones}
                      onToggle={(tid) => updateStatus.mutate({ id: tid, status: 'Pending' })}
                      onView={setShowViewTask}
                      onPhaseChange={handlePhaseChange}
                      onMilestoneChange={handleMilestoneChange}
                      updatingStructureId={updatingStructureId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {totalTasks === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>No subtasks in this project</p>
            </div>
          ) : filteredProjectTasks.length === 0 && (
            <div className="card p-10 text-center">
              <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>No tasks match the selected filters</p>
              <button onClick={resetTaskFilters} className="mt-2 text-xs font-medium" style={{ color: 'var(--primary-600)' }}>
                Clear filters
              </button>
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
                <TimelineItem color="var(--primary-600)" text={`Started ${formatDate(project.createdAt)}`} />
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

      {/* Add Phase modal */}
      {showAddPhase && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-md w-full space-y-4">
            <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Create Phase</h3>
            <Input
              id="phaseTitle"
              label="Phase Name"
              value={newPhaseTitle}
              onChange={(e) => setNewPhaseTitle(e.target.value)}
              placeholder="e.g., Discovery, Build, Launch"
              required
            />
            <div>
              <label htmlFor="phaseDescription" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Description (optional)
              </label>
              <textarea
                id="phaseDescription"
                value={newPhaseDescription}
                onChange={(e) => setNewPhaseDescription(e.target.value)}
                placeholder="Add what this phase should cover..."
                rows={3}
                className="input-base w-full resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShowAddPhase(false); setNewPhaseTitle(''); setNewPhaseDescription(''); }}>
                Cancel
              </Button>
              <Button onClick={handleAddPhase} isLoading={updateProject.isPending} disabled={!newPhaseTitle.trim()}>
                Create Phase
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Milestone modal */}
      {showAddMilestone && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-md w-full space-y-4">
            <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Create Milestone</h3>
            <Input
              id="milestoneTitle"
              label="Milestone Name"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="e.g., Prototype approved"
              required
            />
            <div>
              <label htmlFor="milestonePhase" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Phase (optional)
              </label>
              <select
                id="milestonePhase"
                value={newMilestonePhaseId}
                onChange={(e) => setNewMilestonePhaseId(e.target.value)}
                className="input-base w-full"
              >
                <option value="">No phase</option>
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>{phase.title}</option>
                ))}
              </select>
            </div>
            <Input
              id="milestoneDueDate"
              label="Due Date (optional)"
              type="date"
              value={newMilestoneDueDate}
              onChange={(e) => setNewMilestoneDueDate(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShowAddMilestone(false); setNewMilestoneTitle(''); setNewMilestonePhaseId(''); setNewMilestoneDueDate(''); }}>
                Cancel
              </Button>
              <Button onClick={handleAddMilestone} isLoading={updateProject.isPending} disabled={!newMilestoneTitle.trim()}>
                Create Milestone
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

      {showViewTask && <TaskViewModal task={showViewTask} onClose={() => setShowViewTask(null)} />}
      {showEditTask && <EditTaskModal task={showEditTask} onClose={() => setShowEditTask(null)} />}
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
