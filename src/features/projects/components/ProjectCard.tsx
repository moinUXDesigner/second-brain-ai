import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '@/types';
import { Badge } from '@/components/ui/Badge';

export function ProjectCard({ project, onDelete, deleting }: { project: Project; onDelete?: (id: string) => void; deleting?: boolean }) {
  const navigate = useNavigate();

  const { doneCount, totalCount, progress, pendingTasks } = useMemo(() => {
    const subs = project.subtasks ?? [];
    const done = subs.filter((s) => s.status === 'Done').length;
    const total = subs.filter((s) => s.status !== 'Deleted').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : project.progress ?? 0;
    const pending = subs.filter((s) => s.status === 'Pending').slice(0, 3);
    return { doneCount: done, totalCount: total, progress: pct, pendingTasks: pending };
  }, [project]);

  const statusVariant = project.status === 'Completed' ? 'success' : project.status === 'Active' ? 'primary' : 'default';

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="card group cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col"
    >
      {/* Header */}
      <div className="p-4 pb-0 flex items-start gap-2">
        {/* Color dot */}
        <div
          className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
          style={{
            backgroundColor: project.status === 'Active'
              ? 'var(--primary-500)'
              : project.status === 'Completed'
                ? 'var(--success-500, #22c55e)'
                : 'var(--color-border)',
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {project.title}
          </h3>
          {project.description && (
            <p className="text-[12px] mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
              {project.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={statusVariant} className="!text-[10px] !px-1.5 !py-0">
            {project.status}
          </Badge>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
              disabled={deleting}
              className="p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
              style={{ color: 'var(--color-danger, #ef4444)' }}
              title="Delete project"
            >
              {deleting ? (
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

      {/* Progress bar */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {doneCount}/{totalCount} done
          </span>
          <span className="text-[11px] font-bold" style={{ color: progress === 100 ? 'var(--success-600, #16a34a)' : 'var(--primary-600)' }}>
            {progress}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-muted)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: progress === 100 ? 'var(--success-500, #22c55e)' : 'var(--primary-500)',
            }}
          />
        </div>
      </div>

      {/* Subtask preview */}
      {totalCount > 0 && (
        <div className="px-4 pt-2.5 pb-1 space-y-0.5">
          {pendingTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 py-0.5">
              <div
                className="h-3 w-3 rounded-[3px] border shrink-0"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <span className="text-[12px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {task.title}
              </span>
            </div>
          ))}
          {totalCount - doneCount > 3 && (
            <p className="text-[11px] pl-5" style={{ color: 'var(--color-muted-fg)' }}>
              +{totalCount - doneCount - pendingTasks.length} more
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto px-4 py-3 flex items-center justify-between" style={{ borderTop: totalCount > 0 ? '1px solid var(--color-border)' : undefined }}>
        <div className="flex items-center gap-3">
          {project.createdAt && (
            <span className="text-[11px]" style={{ color: 'var(--color-muted-fg)' }}>
              {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {totalCount > 0 && (
            <div className="flex -space-x-0.5">
              {Array.from({ length: Math.min(totalCount, 5) }).map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: i < doneCount ? 'var(--success-500, #22c55e)' : 'var(--color-border)',
                  }}
                />
              ))}
            </div>
          )}
          <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--color-muted-fg)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
