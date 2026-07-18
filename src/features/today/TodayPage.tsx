import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { TodayTable } from './components/TodayTable';
import { EditTaskModal } from '@/features/tasks/components/EditTaskModal';
import { useTodayTasks, useDeleteTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/Button';
import { taskService } from '@/services/endpoints/taskService';
import { QUERY_KEYS } from '@/constants';
import { today } from '@/utils/date';
import type { TaskStatus, Task } from '@/types';
import toast from 'react-hot-toast';

export function TodayPage() {
  const navigate = useNavigate();
  const { data: tasks, isLoading, isError, dataUpdatedAt } = useTodayTasks();
  const queryClient = useQueryClient();
  const currentDate = today();

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
      queryClient.setQueryData<Task[]>([...QUERY_KEYS.todayTasks, currentDate], (old) => {
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

      queryClient.setQueryData<Task[]>([...QUERY_KEYS.todayTasks, currentDate], (old) => {
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Today</h1>
          <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Scheduled tasks for {currentDate}
            {dataUpdatedAt > 0 && (
              <span className="ml-3 text-caption" style={{ color: 'var(--color-muted-fg)' }}>
                {' '}· Updated {new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          <Button onClick={() => navigate('/today/smart')} variant="primary">
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Smart View
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
              placeholder="Search scheduled tasks..."
              className="input-base h-10 pl-9 pr-9 text-sm"
              aria-label="Search scheduled tasks"
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
          <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>Unable to load today's scheduled tasks.</p>
          <p className="text-caption mt-2" style={{ color: 'var(--color-muted-fg)' }}>Make sure your API is reachable and try again.</p>
        </div>
      ) : (
        <TodayTable
          tasks={searchedTasks}
          localStatus={localStatus}
          onStatusChange={handleStatusChange}
          onEditTask={setEditingTask}
          onDeleteTask={(id) => deleteTask.mutate(id)}
          deletingId={deleteTask.isPending ? (deleteTask.variables as string) : null}
          emptyTitle={searchQuery.trim() ? 'No matching scheduled tasks' : 'No tasks scheduled for today'}
          emptyDescription={searchQuery.trim() ? 'Try a different search term or clear search.' : 'Use due dates, recurring tasks, or Schedule for today to build this list.'}
        />
      )}

      {editingTask && <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />}
    </motion.div>
  );
}
