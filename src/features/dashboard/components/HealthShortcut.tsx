import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { isHealthProject, isHealthTask } from '@/features/health/healthUtils';

export function HealthShortcut() {
  const navigate = useNavigate();
  const { data: tasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();

  const pendingHealthTasks = tasks.filter((task) => task.status === 'Pending' && isHealthTask(task)).length;
  const activeHealthProjects = projects.filter((project) => project.status === 'Active' && isHealthProject(project)).length;

  return (
    <Card className="overflow-hidden !p-0">
      <button
        type="button"
        onClick={() => navigate('/health')}
        className="flex w-full flex-col gap-4 p-5 text-left transition-colors hover:bg-black/[.025] dark:hover:bg-white/[.035] md:flex-row md:items-center md:justify-between"
      >
        <div>
          <CardHeader className="mb-2">
            <CardTitle>Health Overview</CardTitle>
          </CardHeader>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Profile health, Daily State trends, Health projects, and Health-area tasks in one place.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:min-w-64">
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--color-muted)' }}>
            <p className="text-xl font-bold" style={{ color: 'var(--primary-600)' }}>{pendingHealthTasks}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Pending tasks</p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--color-muted)' }}>
            <p className="text-xl font-bold" style={{ color: 'var(--success-600, #16a34a)' }}>{activeHealthProjects}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Active projects</p>
          </div>
        </div>
      </button>
    </Card>
  );
}
