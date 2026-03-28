import { motion } from 'framer-motion';
import { TodayTable } from './components/TodayTable';
import { useTodayTasks, useGenerateTodayView } from '@/hooks/useTasks';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { today } from '@/utils/date';
import toast from 'react-hot-toast';

export function TodayPage() {
  const { data: tasks, isLoading, isError } = useTodayTasks();
  const generateView = useGenerateTodayView();

  const handleGenerate = () => {
    generateView.mutate(undefined, {
      onSuccess: () => toast.success('Today view refreshed!'),
      onError: () => toast.error('Failed to generate today view.'),
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 text-neutral-900 dark:text-neutral-50">Today</h1>
          <p className="text-body text-neutral-500 mt-1">{today()}</p>
        </div>
        <Button onClick={handleGenerate} isLoading={generateView.isPending} variant="primary" style={{ color: '#fff' }}>
          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Today Smart View
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : isError ? (
        <div className="card p-8 text-center">
          <p className="text-body text-neutral-500">Unable to load today's tasks.</p>
          <p className="text-caption text-neutral-400 mt-2">Make sure your Google Apps Script is deployed and VITE_GAS_WEB_APP_URL is set in .env</p>
        </div>
      ) : (
        <TodayTable tasks={tasks ?? []} />
      )}
    </motion.div>
  );
}
