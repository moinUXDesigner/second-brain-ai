import { useNavigate } from 'react-router-dom';
import type { Project } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function ProjectCard({ project, onDelete, deleting }: { project: Project; onDelete?: (id: string) => void; deleting?: boolean }) {
  const navigate = useNavigate();
  const statusVariant = project.status === 'Completed' ? 'success' : project.status === 'Active' ? 'primary' : 'default';

  return (
    <Card className="flex flex-col gap-4 cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/projects/${project.id}`)}>
      <div className="flex items-start justify-between">
        <h3 className="text-body font-semibold text-neutral-900 dark:text-neutral-50 flex-1 min-w-0 mr-2">{project.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={statusVariant}>{project.status}</Badge>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
              disabled={deleting}
              className="p-1.5 rounded-md transition-colors hover:opacity-80 disabled:opacity-40"
              style={{ color: 'var(--color-danger, #ef4444)' }}
              title="Delete project"
            >
              {deleting ? (
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
      </div>

      {project.description && (
        <p className="text-caption text-neutral-500 line-clamp-2">{project.description}</p>
      )}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-caption text-neutral-500">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div
            className="h-full rounded-full bg-primary-500 transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Subtask count */}
      <p className="text-caption text-neutral-400">
        {project.subtasks?.filter((s) => s.status === 'Done').length ?? 0}/{project.subtasks?.length ?? 0} subtasks done
      </p>
    </Card>
  );
}
