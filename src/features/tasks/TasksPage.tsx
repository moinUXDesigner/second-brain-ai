import { motion } from 'framer-motion';
import { UnifiedInput } from './components/UnifiedInput';
import { TaskList } from './components/TaskList';
import { useTasks } from '@/hooks/useTasks';
import { TableSkeleton } from '@/components/ui/Skeleton';

export function TasksPage() {
  const { data: tasks, isLoading } = useTasks();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-h1 text-neutral-900 dark:text-neutral-50">Tasks</h1>
        <p className="text-body text-neutral-500 mt-1">Capture, organize, and track everything</p>
      </div>

      <UnifiedInput />

      {isLoading ? <TableSkeleton /> : <TaskList tasks={tasks ?? []} />}
    </motion.div>
  );
}
