import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjects, useDeleteProject } from '@/hooks/useProjects';
import { ProjectCard } from './components/ProjectCard';
import { CardSkeleton } from '@/components/ui/Skeleton';

export function ProjectsPage() {
  const { data: projects, isLoading, isError } = useProjects();
  const deleteProject = useDeleteProject();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'Active' | 'Completed' | 'Archived'>('all');

  const handleDelete = (id: string) => {
    setConfirmId(id);
  };

  const handleConfirmDelete = () => {
    if (confirmId) {
      deleteProject.mutate(confirmId);
      setConfirmId(null);
    }
  };

  const stats = useMemo(() => {
    if (!projects) return { total: 0, active: 0, completed: 0, totalTasks: 0, doneTasks: 0 };
    const active = projects.filter((p) => p.status === 'Active').length;
    const completed = projects.filter((p) => p.status === 'Completed').length;
    let totalTasks = 0;
    let doneTasks = 0;
    projects.forEach((p) => {
      const subs = p.subtasks ?? [];
      totalTasks += subs.filter((s) => s.status !== 'Deleted').length;
      doneTasks += subs.filter((s) => s.status === 'Done').length;
    });
    return { total: projects.length, active, completed, totalTasks, doneTasks };
  }, [projects]);

  const filtered = useMemo(() => {
    if (!projects) return [];
    if (filter === 'all') return projects;
    return projects.filter((p) => p.status === filter);
  }, [projects, filter]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Projects</h1>
          <p className="text-caption mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {stats.total} project{stats.total !== 1 ? 's' : ''} · {stats.totalTasks} total tasks
          </p>
        </div>
        <Link
          to="/projects/deleted"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Deleted
        </Link>
      </div>

      {/* Stats row */}
      {!isLoading && stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill label="Active" value={stats.active} color="var(--primary-600)" />
          <StatPill label="Completed" value={stats.completed} color="var(--success-600, #16a34a)" />
          <StatPill label="Tasks Done" value={stats.doneTasks} color="var(--warning-600, #d97706)" />
          <StatPill label="Total Tasks" value={stats.totalTasks} color="var(--color-text-secondary)" />
        </div>
      )}

      {/* Filter pills */}
      {!isLoading && stats.total > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['all', 'Active', 'Completed', 'Archived'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              style={{
                backgroundColor: filter === f ? 'var(--primary-600)' : 'var(--color-muted)',
                color: filter === f ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {f === 'all' ? `All (${stats.total})` : f}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="card p-10 text-center">
          <svg className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-muted-fg)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Unable to load projects</p>
          <p className="text-caption mt-1" style={{ color: 'var(--color-text-secondary)' }}>Check your connection and try again</p>
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <svg className="mx-auto h-14 w-14" style={{ color: 'var(--color-muted-fg)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="text-body font-medium" style={{ color: 'var(--color-text)' }}>No projects yet</p>
          <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            Create a project from the Create New wizard to get started
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
            No {filter.toLowerCase()} projects
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onDelete={handleDelete}
              deleting={deleteProject.isPending && deleteProject.variables === p.id}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmId && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-sm w-full space-y-4">
            <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Delete Project?</h3>
            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              This will move the project to the deleted list. Subtasks will remain in your tasks.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 rounded-md text-caption font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
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
    </motion.div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      <span className="text-lg font-bold" style={{ color }}>{value}</span>
      <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    </div>
  );
}
