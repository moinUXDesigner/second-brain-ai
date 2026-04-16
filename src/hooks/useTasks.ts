import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/endpoints/taskService';
import { todayService } from '@/services/endpoints/todayService';
import { useTaskStore } from '@/app/store/taskStore';
import { useAudit } from './useAudit';
import { QUERY_KEYS } from '@/constants';
import type { Task } from '@/types';

export function useTasks() {
  const { setTasks } = useTaskStore();

  return useQuery({
    queryKey: QUERY_KEYS.tasks,
    queryFn: async () => {
      const res = await taskService.getTasks();
      setTasks(res.data);
      return res.data;
    },
  });
}

export function useTodayTasks() {
  const { setTodayTasks } = useTaskStore();

  return useQuery({
    queryKey: QUERY_KEYS.todayTasks,
    queryFn: async () => {
      const res = await todayService.getTodayTasks();
      setTodayTasks(res.data);
      return res.data;
    },
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
      updateTaskInStore(id, { status, completedAt: status === 'Done' || status === 'Deleted' ? new Date().toISOString() : undefined });
    },
    onSuccess: (_, { id, status }) => {
      log('UPDATE_TASK', 'task', id, { status });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
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
      updateTaskInStore(id, { status: 'Deleted', completedAt: new Date().toISOString() });
    },
    onSuccess: (_, id) => {
      log('DELETE_TASK', 'task', id);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
    },
  });
}
