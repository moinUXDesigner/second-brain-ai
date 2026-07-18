import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { TodayTable } from './components/TodayTable';
import { EditTaskModal } from '@/features/tasks/components/EditTaskModal';
import { useSmartTodayTasks, useDeleteTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAudit } from '@/hooks/useAudit';
import { Button } from '@/components/ui/Button';
import { taskService } from '@/services/endpoints/taskService';
import { todayService } from '@/services/endpoints/todayService';
import { dailyStateService } from '@/services/endpoints/dailyStateService';
import { QUERY_KEYS } from '@/constants';
import { today } from '@/utils/date';
import type { TaskStatus, Task } from '@/types';
import toast from 'react-hot-toast';

type LoaderPhase = 'saving' | 'generating' | 'loading' | 'done' | null;
type ActivityPreference = 'Any' | 'Indoor' | 'Outdoor';

const PHASE_CONFIG: Record<Exclude<LoaderPhase, null>, { progress: number; label: string }> = {
  saving: { progress: 15, label: 'Saving your daily state...' },
  generating: { progress: 55, label: 'AI is picking your tasks...' },
  loading: { progress: 85, label: 'Loading your tasks...' },
  done: { progress: 100, label: 'Smart View refreshed!' },
};

const TIME_PRESETS = [
  { label: '30m', mins: 30 },
  { label: '1h', mins: 60 },
  { label: '2h', mins: 120 },
  { label: '3h', mins: 180 },
  { label: '4h', mins: 240 },
  { label: '6h', mins: 360 },
  { label: '8h', mins: 480 },
];

const ACTIVITY_OPTIONS: Array<{ value: ActivityPreference; label: string; description: string }> = [
  { value: 'Any', label: 'Any', description: 'Balanced' },
  { value: 'Indoor', label: 'Indoor', description: 'Desk or home' },
  { value: 'Outdoor', label: 'Outdoor', description: 'Outside tasks' },
];

function formatTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function SmartViewPage() {
  const { data: tasks, isLoading, isError, dataUpdatedAt } = useSmartTodayTasks();
  const queryClient = useQueryClient();
  const { log } = useAudit();
  const currentDate = today();
  const [showModal, setShowModal] = useState(false);
  const [loaderPhase, setLoaderPhase] = useState<LoaderPhase>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const deleteTask = useDeleteTask();
  const [localStatus, setLocalStatus] = useState<Record<string, TaskStatus>>({});
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setLocalStatus({});
  }, [tasks]);

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    setLocalStatus((prev) => ({ ...prev, [id]: status }));

    try {
      await taskService.updateTaskStatus(id, status);
      queryClient.setQueryData<Task[]>([...QUERY_KEYS.smartTodayTasks, currentDate], (old) => {
        if (!old) return old;
        return old.map((t) =>
          t.id === id ? { ...t, status, completedAt: status === 'Done' ? new Date().toISOString() : undefined } : t,
        );
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    } catch {
      setLocalStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.error('Failed to update task');
    }
  };

  const { data: projects } = useProjects();

  const visibleTasks = useMemo(() => {
    if (!tasks) return [];

    const projectTitleById = new Map<string, string>((projects ?? []).map((p) => [p.id, p.title]));

    return tasks.reduce<Task[]>((result, task) => {
      const overrideStatus = localStatus[task.id];
      const statusToCheck = overrideStatus || task.status;

      if (statusToCheck === 'Done' || statusToCheck === 'Deleted' || statusToCheck === 'Note' || statusToCheck === 'Idea') {
        return result;
      }

      if (task.projectName) {
        result.push(task);
      } else if (task.projectId && projectTitleById.has(task.projectId)) {
        result.push({ ...task, projectName: projectTitleById.get(task.projectId) });
      } else {
        result.push(task);
      }

      return result;
    }, []);
  }, [tasks, localStatus, projects]);

  const searchedTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return visibleTasks;

    return visibleTasks.filter((task) => {
      const searchableText = [
        task.title,
        task.area,
        task.projectName,
        task.category,
        task.urgency,
        task.notes,
        task.timeEstimate,
        task.dueDate,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [visibleTasks, searchQuery]);

  const dirtyCount = useMemo(() => {
    if (!tasks) return 0;
    return Object.entries(localStatus).filter(([id, status]) => {
      const task = tasks.find((t) => t.id === id);
      return task && task.status !== status;
    }).length;
  }, [localStatus, tasks]);

  const handleBatchUpdate = async () => {
    if (!tasks || dirtyCount === 0) return;
    setSyncing(true);
    try {
      const dirtyEntries = Object.entries(localStatus).filter(([id, status]) => {
        const task = tasks.find((t) => t.id === id);
        return task && task.status !== status;
      });

      await Promise.all(dirtyEntries.map(([id, status]) => taskService.updateTaskStatus(id, status)));

      queryClient.setQueryData<Task[]>([...QUERY_KEYS.smartTodayTasks, currentDate], (old) => {
        if (!old) return old;
        return old.map((t) => {
          const newStatus = localStatus[t.id];
          if (newStatus && newStatus !== t.status) {
            return { ...t, status: newStatus, completedAt: newStatus === 'Done' ? new Date().toISOString() : undefined };
          }
          return t;
        });
      });

      setLocalStatus({});
      toast.success(`${dirtyEntries.length} task${dirtyEntries.length > 1 ? 's' : ''} updated`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    } catch {
      toast.error('Failed to update tasks');
    } finally {
      setSyncing(false);
    }
  };

  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState(5);
  const [focus, setFocus] = useState(5);
  const [availableTime, setAvailableTime] = useState(120);
  const [activityPreference, setActivityPreference] = useState<ActivityPreference>('Any');

  const handleSmartGenerate = useCallback(async () => {
    setShowModal(false);

    try {
      setLoaderPhase('saving');
      await dailyStateService.save({
        date: today(),
        energy,
        mood,
        focus,
        availableTime,
        activityPreference,
      });

      setLoaderPhase('generating');
      const result = await todayService.generateTodayView(currentDate);
      log('RUN_PIPELINE', 'system');

      setLoaderPhase('loading');
      queryClient.setQueryData([...QUERY_KEYS.smartTodayTasks, currentDate], result.data);
      await new Promise((resolve) => setTimeout(resolve, 400));

      setLoaderPhase('done');
      await new Promise((resolve) => setTimeout(resolve, 1400));

      setLoaderPhase(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
    } catch {
      setLoaderPhase(null);
      toast.error('Failed to generate Smart View.');
    }
  }, [energy, mood, focus, availableTime, activityPreference, queryClient, log, currentDate]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Smart View</h1>
          <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            AI-recommended tasks for {currentDate}
            {dataUpdatedAt > 0 && (
              <span className="ml-3 text-caption" style={{ color: 'var(--color-muted-fg)' }}>
                · Updated {new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirtyCount > 0 && (
            <Button onClick={handleBatchUpdate} isLoading={syncing} variant="secondary">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Update ({dirtyCount})
            </Button>
          )}
          <Button onClick={() => setShowModal(true)} disabled={!!loaderPhase} variant="primary">
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Generate Smart View
          </Button>
        </div>
      </div>

      {!isLoading && !isError && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              style={{ color: 'var(--color-muted-fg)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search Smart View tasks..."
              className="input-base h-10 pl-9 pr-9 text-sm"
              aria-label="Search Smart View tasks"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--color-text-secondary)' }}
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            {searchQuery.trim()
              ? `${searchedTasks.length} of ${visibleTasks.length} shown`
              : `${visibleTasks.length} task${visibleTasks.length === 1 ? '' : 's'}`}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-2 animate-pulse">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 rounded-md w-3/4" style={{ backgroundColor: 'var(--color-muted)' }} />
                  <div className="h-3 rounded-md w-1/3" style={{ backgroundColor: 'var(--color-muted)' }} />
                </div>
                <div className="h-7 w-20 rounded-md" style={{ backgroundColor: 'var(--color-muted)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card p-8 text-center">
          <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>Unable to load Smart View tasks.</p>
          <p className="text-caption mt-2" style={{ color: 'var(--color-muted-fg)' }}>Try generating Smart View again.</p>
        </div>
      ) : (
        <TodayTable
          tasks={searchedTasks}
          localStatus={localStatus}
          onStatusChange={handleStatusChange}
          onEditTask={setEditingTask}
          onDeleteTask={(id) => deleteTask.mutate(id)}
          deletingId={deleteTask.isPending ? (deleteTask.variables as string) : null}
          emptyTitle={searchQuery.trim() ? 'No matching Smart View tasks' : 'No Smart View tasks yet'}
          emptyDescription={searchQuery.trim() ? 'Try a different search term or clear search.' : 'Generate Smart View to get AI-recommended tasks for today.'}
        />
      )}

      {loaderPhase && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="w-full max-w-sm px-6 space-y-6 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--primary-50)' }}
              >
                {loaderPhase === 'done' ? (
                  <svg className="h-8 w-8" style={{ color: 'var(--primary-600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-8 w-8" style={{ color: 'var(--primary-600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
              </motion.div>

              <motion.p
                key={loaderPhase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-body font-semibold"
                style={{ color: loaderPhase === 'done' ? 'var(--primary-600)' : 'var(--color-text)' }}
              >
                {PHASE_CONFIG[loaderPhase].label}
              </motion.p>

              <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-muted)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: 'var(--primary-600)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${PHASE_CONFIG[loaderPhase].progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>

              <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                {PHASE_CONFIG[loaderPhase].progress}%
              </p>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}

      {showModal && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
              </div>

              <div className="px-5 pt-4 pb-5 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    How are you feeling?
                  </h2>
                  <p className="text-caption mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    This helps AI pick the right tasks for you today
                  </p>
                </div>

                {[
                  { label: 'Energy', emoji: '⚡', value: energy, set: setEnergy },
                  { label: 'Mood', emoji: '😊', value: mood, set: setMood },
                  { label: 'Focus', emoji: '🎯', value: focus, set: setFocus },
                ].map((slider) => (
                  <div key={slider.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {slider.emoji} {slider.label}
                      </span>
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
                        style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}
                      >
                        {slider.value}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={slider.value}
                      onChange={(e) => slider.set(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ backgroundColor: 'var(--color-muted)' }}
                    />
                  </div>
                ))}

                <div className="space-y-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    🕐 Available Time
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setAvailableTime((prev) => Math.max(15, prev - 15))}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold"
                      style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
                    >
                      -
                    </button>
                    <span className="min-w-[80px] text-center text-xl font-bold tabular-nums" style={{ color: 'var(--primary-600)' }}>
                      {formatTime(availableTime)}
                    </span>
                    <button
                      onClick={() => setAvailableTime((prev) => Math.min(720, prev + 15))}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold"
                      style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {TIME_PRESETS.map((preset) => (
                      <button
                        key={preset.mins}
                        onClick={() => setAvailableTime(preset.mins)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: availableTime === preset.mins ? 'var(--primary-600)' : 'var(--color-muted)',
                          color: availableTime === preset.mins ? '#fff' : 'var(--color-text)',
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    Activity Preference
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ACTIVITY_OPTIONS.map((option) => {
                      const selected = activityPreference === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setActivityPreference(option.value)}
                          className="rounded-lg border px-2 py-2 text-left transition-colors"
                          style={{
                            borderColor: selected ? 'var(--primary-500)' : 'var(--color-border)',
                            backgroundColor: selected ? 'var(--primary-50)' : 'var(--color-surface)',
                            color: selected ? 'var(--primary-700)' : 'var(--color-text)',
                          }}
                        >
                          <span className="block text-xs font-semibold">{option.label}</span>
                          <span
                            className="block text-[10px]"
                            style={{ color: selected ? 'var(--primary-700)' : 'var(--color-text-secondary)' }}
                          >
                            {option.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSmartGenerate}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--primary-600)', color: '#fff' }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Generate
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}

      {editingTask && <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />}
    </motion.div>
  );
}
