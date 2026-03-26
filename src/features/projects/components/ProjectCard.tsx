import type { Project } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function ProjectCard({ project }: { project: Project }) {
  const statusVariant = project.status === 'Completed' ? 'success' : project.status === 'Active' ? 'primary' : 'default';

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <h3 className="text-body font-semibold text-neutral-900 dark:text-neutral-50">{project.title}</h3>
        <Badge variant={statusVariant}>{project.status}</Badge>
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
