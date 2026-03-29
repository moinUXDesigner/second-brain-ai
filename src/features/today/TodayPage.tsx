import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { TodayTable } from './components/TodayTable';
import { useTodayTasks, useGenerateTodayView } from '@/hooks/useTasks';
import { Button } from '@/components/ui/Button';
import { taskService } from '@/services/endpoints/taskService';
import { dailyStateService } from '@/services/endpoints/dailyStateService';
import { QUERY_KEYS } from '@/constants';
import { today } from '@/utils/date';
import type { TaskStatus, Task } from '@/types';
import toast from 'react-hot-toast';

const TIME_PRESETS = [
  { label: '30m', mins: 30 },
  { label: '1h', mins: 60 },
  { label: '2h', mins: 120 },
  { label: '3h', mins: 180 },
  { label: '4h', mins: 240 },
  { label: '6h', mins: 360 },
  { label: '8h', mins: 480 },
];

function formatTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function TodayPage() {
  const { data: tasks, isLoading, isError } = useTodayTasks();
  const generateView = useGenerateTodayView();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Lifted status overrides for TodayTable
  const [localStatus, setLocalStatus] = useState<Record<string, TaskStatus>>({});
  const [syncing, setSyncing] = useState(false);

  // Reset local overrides when tasks data changes from a fresh generate
  useEffect(() => {
    setLocalStatus({});
  }, [tasks]);

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setLocalStatus((prev) => ({ ...prev, [id]: status }));
  };

  // Count how many tasks actually changed
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
      // Update all in parallel
      await Promise.all(
        dirtyEntries.map(([id, status]) => taskService.updateTaskStatus(id, status)),
      );
      // Patch the query cache so refetch doesn't revert the UI
      queryClient.setQueryData<Task[]>(QUERY_KEYS.todayTasks, (old) => {
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
      // Background refetch for consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    } catch {
      toast.error('Failed to update tasks');
    } finally {
      setSyncing(false);
    }
  };

  // Daily state form
  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState(5);
  const [focus, setFocus] = useState(5);
  const [availableTime, setAvailableTime] = useState(120);

  // Load existing daily state when modal opens
  useEffect(() => {
    if (!showModal) return;
    dailyStateService.get(today()).then((res) => {
      if (res.data) {
        setEnergy(res.data.energy || 5);
        setMood(res.data.mood || 5);
        setFocus(res.data.focus || 5);
        setAvailableTime(res.data.availableTime || 120);
      }
    }).catch(() => {});
  }, [showModal]);

  const handleSmartGenerate = async () => {
    setGenerating(true);
    try {
      // 1. Save daily state
      await dailyStateService.save({
        date: today(),
        energy,
        mood,
        focus,
        availableTime,
      });
      setShowModal(false);

      // 2. Generate today view
      await generateView.mutateAsync(undefined);
      toast.success('Today view refreshed!');
    } catch {
      toast.error('Failed to generate today view.');
    } finally {
      setGenerating(false);
    }
  };

  const isGenerating = generating || generateView.isPending;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Today</h1>
          <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>{today()}</p>
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
          <Button onClick={() => setShowModal(true)} isLoading={isGenerating} variant="primary">
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Smart View
          </Button>
        </div>
      </div>

      {/* Content / Loading */}
      {isLoading || isGenerating ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="card p-4 space-y-2 animate-pulse"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 rounded-md w-3/4" style={{ backgroundColor: 'var(--color-muted)' }} />
                  <div className="h-3 rounded-md w-1/3" style={{ backgroundColor: 'var(--color-muted)' }} />
                </div>
                <div className="h-7 w-20 rounded-md" style={{ backgroundColor: 'var(--color-muted)' }} />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }} />
                <div className="h-5 w-10 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }} />
                <div className="h-5 w-14 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card p-8 text-center">
          <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>Unable to load today's tasks.</p>
          <p className="text-caption mt-2" style={{ color: 'var(--color-muted-fg)' }}>Make sure your Google Apps Script is deployed and VITE_GAS_WEB_APP_URL is set in .env</p>
        </div>
      ) : (
        <TodayTable tasks={tasks ?? []} localStatus={localStatus} onStatusChange={handleStatusChange} />
      )}

      {/* Daily State Modal */}
      {showModal && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => !generating && setShowModal(false)}
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
              {/* Handle bar (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
              </div>

              <div className="px-5 pt-4 pb-5 space-y-5">
                {/* Header */}
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    How are you feeling?
                  </h2>
                  <p className="text-caption mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    This helps AI pick the right tasks for you today
                  </p>
                </div>

                {/* Sliders */}
                {[
                  { label: 'Energy', emoji: '⚡', value: energy, set: setEnergy },
                  { label: 'Mood', emoji: '😊', value: mood, set: setMood },
                  { label: 'Focus', emoji: '🎯', value: focus, set: setFocus },
                ].map((s) => (
                  <div key={s.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {s.emoji} {s.label}
                      </span>
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
                        style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}
                      >
                        {s.value}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={s.value}
                      onChange={(e) => s.set(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ backgroundColor: 'var(--color-muted)' }}
                    />
                  </div>
                ))}

                {/* Available Time */}
                <div className="space-y-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    🕐 Available Time
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setAvailableTime((p) => Math.max(15, p - 15))}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold"
                      style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
                    >
                      −
                    </button>
                    <span className="min-w-[80px] text-center text-xl font-bold tabular-nums" style={{ color: 'var(--primary-600)' }}>
                      {formatTime(availableTime)}
                    </span>
                    <button
                      onClick={() => setAvailableTime((p) => Math.min(720, p + 15))}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold"
                      style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {TIME_PRESETS.map((p) => (
                      <button
                        key={p.mins}
                        onClick={() => setAvailableTime(p.mins)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: availableTime === p.mins ? 'var(--primary-600)' : 'var(--color-muted)',
                          color: availableTime === p.mins ? '#fff' : 'var(--color-text)',
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={generating}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSmartGenerate}
                    disabled={generating}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--primary-600)', color: '#fff', opacity: generating ? 0.7 : 1 }}
                  >
                    {generating ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
}
