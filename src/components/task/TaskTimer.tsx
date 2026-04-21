import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskTimerService } from '@/services/endpoints/taskTimerService';
import { QUERY_KEYS } from '@/constants';
import type { Task } from '@/types';

interface TaskTimerProps {
  task: Task;
  compact?: boolean;
}

export function TaskTimer({ task, compact = false }: TaskTimerProps) {
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(0);

  const startTimer = useMutation({
    mutationFn: () => taskTimerService.startTimer(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      if (task.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(task.projectId) });
      }
    },
  });

  const pauseTimer = useMutation({
    mutationFn: () => taskTimerService.pauseTimer(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      if (task.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(task.projectId) });
      }
    },
  });

  const stopTimer = useMutation({
    mutationFn: () => taskTimerService.stopTimer(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      if (task.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(task.projectId) });
      }
    },
  });

  const resetTimer = useMutation({
    mutationFn: () => taskTimerService.resetTimer(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      if (task.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(task.projectId) });
      }
    },
  });

  useEffect(() => {
    if (task.timerRunning && task.timerStartedAt) {
      const startTime = new Date(task.timerStartedAt).getTime();
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - startTime) / 1000);
        setElapsed(diff);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [task.timerRunning, task.timerStartedAt]);

  const totalSeconds = (task.timeSpent || 0) + elapsed;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatTime = () => {
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {task.timerRunning ? (
          <>
            <span className="text-xs font-mono font-medium" style={{ color: 'var(--success-600, #16a34a)' }}>
              {formatTime()}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); pauseTimer.mutate(); }}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
              title="Pause timer"
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--warning-600, #d97706)' }}>
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); stopTimer.mutate(); }}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
              title="Stop timer"
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-danger, #ef4444)' }}>
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            </button>
          </>
        ) : (
          <>
            {totalSeconds > 0 && (
              <>
                <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                  {formatTime()}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); resetTimer.mutate(); }}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                  title="Reset timer"
                  disabled={resetTimer.isPending}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); startTimer.mutate(); }}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
              title="Start timer"
              disabled={startTimer.isPending}
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--success-600, #16a34a)' }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-mono font-medium" style={{ color: task.timerRunning ? 'var(--success-600, #16a34a)' : 'var(--color-text)' }}>
          {formatTime()}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {task.timerRunning ? (
          <>
            <button
              onClick={() => pauseTimer.mutate()}
              disabled={pauseTimer.isPending}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ backgroundColor: 'var(--warning-100)', color: 'var(--warning-700)' }}
            >
              <svg className="h-3.5 w-3.5 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              Pause
            </button>
            <button
              onClick={() => stopTimer.mutate()}
              disabled={stopTimer.isPending}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ backgroundColor: 'var(--color-danger, #ef4444)', color: '#fff' }}
            >
              <svg className="h-3.5 w-3.5 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
              Stop
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => startTimer.mutate()}
              disabled={startTimer.isPending}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ backgroundColor: 'var(--success-600, #16a34a)', color: '#fff' }}
            >
              <svg className="h-3.5 w-3.5 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Start
            </button>
            {totalSeconds > 0 && (
              <button
                onClick={() => resetTimer.mutate()}
                disabled={resetTimer.isPending}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
                title="Reset timer to 0:00"
              >
                <svg className="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
