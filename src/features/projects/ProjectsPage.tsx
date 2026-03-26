import { motion } from 'framer-motion';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCard } from './components/ProjectCard';
import { CardSkeleton } from '@/components/ui/Skeleton';

export function ProjectsPage() {
  const { data: projects, isLoading, isError } = useProjects();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-h1 text-neutral-900 dark:text-neutral-50">Projects</h1>
        <p className="text-body text-neutral-500 mt-1">Track multi-step goals</p>
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
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
