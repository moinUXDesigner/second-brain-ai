import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import type { Task } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatDateRelative } from '@/utils/dateFormat';

interface TaskViewModalProps {
  task: Task;
  onClose: () => void;
}

function display(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Not set';
  return String(value);
}

function formatDuration(totalSeconds?: number) {
  if (!totalSeconds) return '0:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDateDetail(value?: string) {
  if (!value) return 'Not set';

  const relative = formatDateRelative(value);
  const date = formatDate(value);

  if (relative === date) return date;
  return `${relative} (${date})`;
}

function statusVariant(status: Task['status']) {
  if (status === 'Done') return 'success';
  if (status === 'Deleted') return 'danger';
  if (status === 'Idea' || status === 'Note') return 'primary';
  return 'default';
}

function urgencyVariant(urgency?: string) {
  if (urgency === 'High') return 'danger';
  if (urgency === 'Medium') return 'warning';
  return 'default';
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md px-3 py-2" style={{ backgroundColor: 'var(--color-muted)' }}>
      <dt className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </dt>
      <dd className="mt-1 text-sm break-words" style={{ color: 'var(--color-text)' }}>
        {value}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function TaskViewModal({ task, onClose }: TaskViewModalProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-view-title"
      onClick={onClose}
    >
      <div
        className="card max-h-[90vh] w-full max-w-3xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-4 px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="task-view-title" className="text-xl font-bold leading-tight" style={{ color: 'var(--color-text)' }}>
                View Task
              </h2>
              <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
              {task.urgency && <Badge variant={urgencyVariant(task.urgency)}>{task.urgency}</Badge>}
            </div>
            <p className="text-base font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
              {task.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Close task details"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-5 space-y-5">
          <Section title="Overview">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="Type" value={display(task.type)} />
              <DetailRow label="Area" value={display(task.area)} />
              <DetailRow label="Project" value={display(task.projectName)} />
              <DetailRow label="Phase" value={display(task.phaseName || task.phaseId)} />
              <DetailRow label="Milestone" value={display(task.milestoneName || task.milestoneId)} />
              <DetailRow label="Status" value={<Badge variant={statusVariant(task.status)}>{task.status}</Badge>} />
              <DetailRow label="Priority" value={display(task.priority)} />
              <DetailRow label="Urgency" value={task.urgency ? <Badge variant={urgencyVariant(task.urgency)}>{task.urgency}</Badge> : 'Not set'} />
            </dl>
          </Section>

          <Section title="Scoring">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="Impact" value={display(task.impact)} />
              <DetailRow label="Effort" value={display(task.effort)} />
              <DetailRow label="Fit Score" value={display(task.fitScore)} />
              <DetailRow label="Confidence" value={display(task.confidence)} />
              <DetailRow label="Category" value={display(task.category)} />
              <DetailRow label="Maslow" value={display(task.maslow)} />
            </dl>
          </Section>

          <Section title="Schedule">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="Due Date" value={formatDateDetail(task.dueDate)} />
              <DetailRow label="Deadline Date" value={formatDateDetail(task.deadlineDate)} />
              <DetailRow label="Completed At" value={formatDateDetail(task.completedAt)} />
              <DetailRow label="Created At" value={formatDateDetail(task.createdAt)} />
              <DetailRow label="Updated At" value={formatDateDetail(task.updatedAt)} />
              <DetailRow label="Recurrence" value={display(task.recurrence)} />
            </dl>
          </Section>

          <Section title="Time">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="AI Time" value={display(task.timeEstimate)} />
              <DetailRow label="Actual Time" value={formatDuration(task.timeSpent)} />
              <DetailRow label="Timer" value={task.timerRunning ? 'Running' : 'Stopped'} />
              <DetailRow label="Timer Started" value={formatDateDetail(task.timerStartedAt)} />
            </dl>
          </Section>

          <Section title="Notes">
            <div className="rounded-md p-3" style={{ backgroundColor: 'var(--color-muted)' }}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                {task.notes?.trim() || 'No notes added.'}
              </p>
            </div>
          </Section>

          <Section title="Metadata">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <DetailRow label="Source" value={display(task.source)} />
              <DetailRow label="Tags" value={task.tags?.length ? task.tags.join(', ') : 'Not set'} />
              <DetailRow label="Task ID" value={task.id} />
              <DetailRow label="Project ID" value={display(task.projectId)} />
              <DetailRow label="User ID" value={display(task.userId)} />
            </dl>
          </Section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
