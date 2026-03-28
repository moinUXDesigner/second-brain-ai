import { useState } from 'react';
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

  const handleDelete = (id: string) => {
    setConfirmId(id);
  };

  const handleConfirmDelete = () => {
    if (confirmId) {
      deleteProject.mutate(confirmId);
      setConfirmId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-neutral-900 dark:text-neutral-50">Projects</h1>
          <p className="text-body text-neutral-500 mt-1">Track multi-step goals</p>
        </div>
        <Link
          to="/projects/deleted"
          className="flex items-center gap-1.5 text-caption font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Deleted
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="card p-8 text-center">
          <p className="text-body text-neutral-500">Unable to load projects.</p>
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-body text-neutral-500">No projects yet. Create one from the Tasks page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
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
              This will permanently delete the project and remove it from the list. Subtasks will remain in your tasks.
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
