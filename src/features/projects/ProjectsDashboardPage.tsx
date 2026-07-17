import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjects } from '@/hooks/useProjects';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { splitDomains } from '@/utils/domains';
import type { Project, Task } from '@/types';

type EffectiveStatus = 'Active' | 'Completed' | 'Archived' | 'Deleted';

function getEffectiveStatus(project: Project): EffectiveStatus {
  if (project.status !== 'Active') return project.status;

  const countableTasks = (project.subtasks ?? []).filter((task) => task.status !== 'Deleted' && task.status !== 'Note');
  if (countableTasks.length > 0 && countableTasks.every((task) => task.status === 'Done')) return 'Completed';

  return 'Active';
}

function getTimestamp(value?: string) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getOpenTasks(tasks?: Task[]) {
  return (tasks ?? []).filter((task) => task.status !== 'Done' && task.status !== 'Deleted' && task.status !== 'Note');
}

export function ProjectsDashboardPage() {
  const { data: projects, isLoading, isError } = useProjects();

  const dashboard = useMemo(() => {
    const allProjects = projects ?? [];
    const activeProjects = allProjects.filter((project) => getEffectiveStatus(project) === 'Active');
    const completedProjects = allProjects.filter((project) => getEffectiveStatus(project) === 'Completed');
    const archivedProjects = allProjects.filter((project) => getEffectiveStatus(project) === 'Archived');
    const totalTasks = allProjects.reduce((sum, project) => sum + (project.subtasks ?? []).filter((task) => task.status !== 'Deleted').length, 0);
    const doneTasks = allProjects.reduce((sum, project) => sum + (project.subtasks ?? []).filter((task) => task.status === 'Done').length, 0);
    const averageProgress = allProjects.length
      ? Math.round(allProjects.reduce((sum, project) => sum + project.progress, 0) / allProjects.length)
      : 0;

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const dueSoon = activeProjects
      .filter((project) => {
        const due = getTimestamp(project.dueDate);
        return due > 0 && due >= now && due <= now + thirtyDays;
      })
      .sort((a, b) => getTimestamp(a.dueDate) - getTimestamp(b.dueDate))
      .slice(0, 5);

    const needsAttention = activeProjects
      .filter((project) => project.progress < 50 || getOpenTasks(project.subtasks).length >= 5)
      .sort((a, b) => getOpenTasks(b.subtasks).length - getOpenTasks(a.subtasks).length || a.progress - b.progress)
      .slice(0, 5);

    const recent = [...allProjects]
      .sort((a, b) => getTimestamp(b.updatedAt || b.createdAt) - getTimestamp(a.updatedAt || a.createdAt))
      .slice(0, 5);

    const domainCounts = allProjects.reduce<Record<string, number>>((counts, project) => {
      const domains = splitDomains(project.domain);
      const projectDomains = domains.length > 0 ? domains : ['Unassigned'];
      projectDomains.forEach((domain) => {
        counts[domain] = (counts[domain] ?? 0) + 1;
      });
      return counts;
    }, {});

    const topDomains = Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    return {
      total: allProjects.length,
      active: activeProjects.length,
      completed: completedProjects.length,
      archived: archivedProjects.length,
      totalTasks,
      doneTasks,
      averageProgress,
      dueSoon,
      needsAttention,
      recent,
      topDomains,
    };
  }, [projects]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Projects Dashboard</h1>
          <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Portfolio health, timelines, and focus areas.
          </p>
        </div>
        <Link
          to="/projects"
          className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
          style={{ backgroundColor: 'var(--primary-600)', color: '#fff' }}
        >
          View All Projects
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => <CardSkeleton key={index} />)}
        </div>
      ) : isError ? (
        <div className="card p-10 text-center">
          <p className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Unable to load project dashboard</p>
          <p className="text-caption mt-1" style={{ color: 'var(--color-text-secondary)' }}>Check your connection and try again.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Projects" value={dashboard.total} />
            <MetricCard label="Active" value={dashboard.active} tone="primary" />
            <MetricCard label="Completed" value={dashboard.completed} tone="success" />
            <MetricCard label="Avg Progress" value={`${dashboard.averageProgress}%`} tone="warning" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <section className="card p-5 xl:col-span-2">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Needs Attention</h2>
                <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                  {dashboard.doneTasks}/{dashboard.totalTasks} tasks done
                </span>
              </div>
              <ProjectList projects={dashboard.needsAttention} empty="No active projects need attention." />
            </section>

            <section className="card p-5">
              <h2 className="text-body font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Status Mix</h2>
              <div className="space-y-3">
                <StatusBar label="Active" value={dashboard.active} total={dashboard.total} color="var(--primary-600)" />
                <StatusBar label="Completed" value={dashboard.completed} total={dashboard.total} color="var(--success-600, #16a34a)" />
                <StatusBar label="Archived" value={dashboard.archived} total={dashboard.total} color="var(--color-text-secondary)" />
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="card p-5">
              <h2 className="text-body font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Due Soon</h2>
              <ProjectList projects={dashboard.dueSoon} empty="No project deadlines in the next 30 days." showDueDate />
            </section>

            <section className="card p-5">
              <h2 className="text-body font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Recently Updated</h2>
              <ProjectList projects={dashboard.recent} empty="No recent project updates." />
            </section>

            <section className="card p-5">
              <h2 className="text-body font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Domains</h2>
              {dashboard.topDomains.length === 0 ? (
                <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>No domains assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {dashboard.topDomains.map(([domain, count]) => (
                    <StatusBar key={domain} label={domain} value={count} total={dashboard.total} color="var(--primary-500)" />
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </motion.div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: number | string; tone?: 'primary' | 'success' | 'warning' }) {
  const color = tone === 'primary'
    ? 'var(--primary-600)'
    : tone === 'success'
      ? 'var(--success-600, #16a34a)'
      : tone === 'warning'
        ? 'var(--warning-600, #d97706)'
        : 'var(--color-text)';

  return (
    <div className="card p-4">
      <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      <p className="text-2xl font-semibold mt-2" style={{ color }}>{value}</p>
    </div>
  );
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-caption mb-1">
        <span className="truncate" style={{ color: 'var(--color-text)' }}>{label}</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-muted)' }}>
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ProjectList({ projects, empty, showDueDate }: { projects: Project[]; empty: string; showDueDate?: boolean }) {
  if (projects.length === 0) {
    return <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{empty}</p>;
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => {
        const openTasks = getOpenTasks(project.subtasks).length;

        return (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="block rounded-md border p-3 transition-colors hover:opacity-85"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{project.title}</p>
                <p className="text-caption mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {(splitDomains(project.domain)[0] || 'Unassigned')} - {openTasks} open task{openTasks === 1 ? '' : 's'}
                </p>
              </div>
              <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--primary-600)' }}>{project.progress}%</span>
            </div>
            {showDueDate && project.dueDate && (
              <p className="text-caption mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                Due {new Date(project.dueDate).toLocaleDateString()}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
