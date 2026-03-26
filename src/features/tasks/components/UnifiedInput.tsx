import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { inputService } from '@/services/endpoints/inputService';
import { useAudit } from '@/hooks/useAudit';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import type { Task } from '@/types';

const schema = z.object({
  text: z.string().min(1, 'Please describe what you want to do'),
  type: z.enum(['task', 'project']),
});

type FormValues = z.infer<typeof schema>;

export function UnifiedInput() {
  const [inputType, setInputType] = useState<'task' | 'project'>('task');
  const [submitting, setSubmitting] = useState(false);
  const [subtaskPreview, setSubtaskPreview] = useState<Task[]>([]);
  const { log } = useAudit();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { text: '', type: 'task' },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const res = await inputService.createTaskOrProject({
        text: values.text,
        type: values.type,
      });

      if (values.type === 'task') {
        toast.success('Task Created');
        await log('CREATE_TASK', 'task', res.data.task?.id, { text: values.text });
      } else {
        toast.success('Project Created with Subtasks');
        await log('CREATE_PROJECT', 'project', res.data.project?.id, { text: values.text });
        if (res.data.project?.subtasks) {
          setSubtaskPreview(res.data.project.subtasks);
        }
      }

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      reset();
    } catch {
      toast.error('Failed to create. Backend may not be connected.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textarea
          id="unified-input"
          placeholder="What do you want to do today?"
          className="text-body min-h-[100px]"
          error={errors.text?.message}
          {...register('text')}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Type selector */}
          <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {(['task', 'project'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setInputType(t);
                  setSubtaskPreview([]);
                }}
                className={`px-4 py-2 text-button capitalize transition-colors ${
                  inputType === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <input type="hidden" value={inputType} {...register('type')} />

          <Button type="submit" isLoading={submitting} className="sm:ml-auto">
            {inputType === 'task' ? 'Create Task' : 'Create Project'}
          </Button>
        </div>

        {/* AI suggestion hints for task mode */}
        <AnimatePresence>
          {inputType === 'task' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2"
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-caption text-primary-600 dark:text-primary-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI will suggest category & priority
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success-50 dark:bg-success-900/20 px-3 py-1 text-caption text-success-600 dark:text-success-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Estimated time calculated
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Subtask preview for project mode */}
      <AnimatePresence>
        {subtaskPreview.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-semantic-border pt-4 space-y-3"
          >
            <h4 className="text-body font-medium text-neutral-700 dark:text-neutral-300">Generated Subtasks</h4>
            <div className="space-y-2">
              {subtaskPreview.map((st, i) => (
                <div key={st.id || i} className="flex items-center gap-3 rounded-md bg-neutral-50 dark:bg-neutral-800 px-3 py-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-caption font-medium">
                    {i + 1}
                  </span>
                  <span className="text-body text-neutral-700 dark:text-neutral-300">{st.title}</span>
                </div>
              ))}
            </div>
            <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div className="h-full rounded-full bg-primary-500" style={{ width: '0%' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
