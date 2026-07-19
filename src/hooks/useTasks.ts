import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/endpoints/taskService';
import { todayService } from '@/services/endpoints/todayService';
import { useTaskStore } from '@/app/store/taskStore';
import { useAudit } from './useAudit';
import { QUERY_KEYS } from '@/constants';
import { today } from '@/utils/date';
import type { Task } from '@/types';

function updateProjectTaskStatusCache<T>(data: T, id: string, status: Task['status']) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  if (!('subtasks' in data)) return data;

  const project = data as { subtasks?: Task[] };
  if (!project.subtasks) return data;

  return {
    ...(data as Record<string, unknown>),
    subtasks: project.subtasks.map((task) =>
      task.id === id
        ? { ...task, status, completedAt: status === 'Done' || status === 'Deleted' ? new Date().toISOString() : undefined }
        : task,
    ),
  } as T;
}

export function useTasks() {
  const { setTasks } = useTaskStore();

  return useQuery({
    queryKey: QUERY_KEYS.tasks,
    queryFn: async () => {
      const res = await taskService.getTasks();
      setTasks(res.data);
      return res.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

export function useTodayTasks() {
  const { setTodayTasks } = useTaskStore();
  const currentDate = today();

  return useQuery({
    queryKey: [...QUERY_KEYS.todayTasks, currentDate],
    queryFn: async () => {
      const res = await todayService.getTodayTasks(currentDate);
      setTodayTasks(res.data);
      return res.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

export function useSmartTodayTasks() {
  const currentDate = today();

  return useQuery({
    queryKey: [...QUERY_KEYS.smartTodayTasks, currentDate],
    queryFn: async () => {
      const res = await todayService.getSmartTodayTasks(currentDate);
      return res.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const { updateTaskInStore } = useTaskStore();
  const { log } = useAudit();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      taskService.updateTaskStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.todayTasks });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.projects });
      updateTaskInStore(id, { status, completedAt: status === 'Done' || status === 'Deleted' ? new Date().toISOString() : undefined });

      queryClient.setQueryData<Task[]>(QUERY_KEYS.tasks, (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === id
            ? { ...task, status, completedAt: status === 'Done' || status === 'Deleted' ? new Date().toISOString() : undefined }
            : task,
        );
      });

      queryClient.setQueryData<Task[]>([...QUERY_KEYS.todayTasks, today()], (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === id
            ? { ...task, status, completedAt: status === 'Done' || status === 'Deleted' ? new Date().toISOString() : undefined }
            : task,
        );
      });

      queryClient.setQueryData<Task[]>([...QUERY_KEYS.smartTodayTasks, today()], (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === id
            ? { ...task, status, completedAt: status === 'Done' || status === 'Deleted' ? new Date().toISOString() : undefined }
            : task,
        );
      });

      queryClient.setQueriesData({ queryKey: QUERY_KEYS.projects }, (old) =>
        updateProjectTaskStatusCache(old, id, status),
      );
    },
    onSuccess: (_, { id, status }) => {
      log('UPDATE_TASK', 'task', id, { status });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.smartTodayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { log } = useAudit();

  return useMutation({
    mutationFn: (payload: Partial<Task>) => taskService.createTask(payload),
    onSuccess: (res) => {
      log('CREATE_TASK', 'task', res.data.id, { title: res.data.title });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.smartTodayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { updateTaskInStore } = useTaskStore();
  const { log } = useAudit();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      taskService.updateTask(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.todayTasks });
      updateTaskInStore(id, updates);
    },
    onSuccess: (_, { id }) => {
      log('UPDATE_TASK', 'task', id);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.smartTodayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { updateTaskInStore } = useTaskStore();
  const { log } = useAudit();

  return useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.todayTasks });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.smartTodayTasks });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.projects });
      updateTaskInStore(id, { status: 'Deleted', completedAt: new Date().toISOString() });

      queryClient.setQueryData<Task[]>(QUERY_KEYS.tasks, (old) => {
        if (!old) return old;
        return old.filter((task) => task.id !== id);
      });

      queryClient.setQueryData<Task[]>([...QUERY_KEYS.todayTasks, today()], (old) => {
        if (!old) return old;
        return old.filter((task) => task.id !== id);
      });

      queryClient.setQueryData<Task[]>([...QUERY_KEYS.smartTodayTasks, today()], (old) => {
        if (!old) return old;
        return old.filter((task) => task.id !== id);
      });

      queryClient.setQueriesData({ queryKey: QUERY_KEYS.projects }, (old) => {
        if (!old || typeof old !== 'object' || Array.isArray(old) || !('subtasks' in old)) return old;
        const project = old as { subtasks?: Task[] };
        if (!project.subtasks) return old;
        return {
          ...(old as Record<string, unknown>),
          subtasks: project.subtasks.filter((task) => task.id !== id),
        };
      });
    },
    onSuccess: (_, id) => {
      log('DELETE_TASK', 'task', id);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.smartTodayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });
}

export function useResetRecurringTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskService.resetRecurringTask(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
    },
  });
}

export function useGenerateTodayView() {
  const queryClient = useQueryClient();
  const { log } = useAudit();

  return useMutation({
    mutationFn: () => todayService.generateTodayView(),
    onSuccess: () => {
      log('RUN_PIPELINE', 'system');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.smartTodayTasks });
    },
  });
}

export function useScheduleToday() {
  const queryClient = useQueryClient();
  const { log } = useAudit();

  return useMutation({
    mutationFn: (id: string) => taskService.scheduleToday(id),
    onSuccess: (_, id) => {
      log('SCHEDULE_TODAY', 'task', id);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.smartTodayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });
}

export function useCategorizeUncategorizedTasks() {
  const queryClient = useQueryClient();
  const { log } = useAudit();

  return useMutation({
    mutationFn: () => taskService.categorizeUncategorized(),
    onSuccess: (res) => {
      log('RUN_PIPELINE', 'task', undefined, { action: 'categorize_uncategorized', updated: res.data.updated, source: res.data.source });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.smartTodayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });
}
