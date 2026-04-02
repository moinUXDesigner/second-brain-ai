import gasClient from '../gasClient';
import type { Task, ApiResponse, PaginatedResponse } from '@/types';

export const taskService = {
  async getTasks(_params?: Record<string, string>): Promise<PaginatedResponse<Task>> {
    const data = await gasClient.get<Task[]>('getTasks');
    return { data, total: data.length, page: 1, perPage: data.length };
  },

  async getTodayTasks(): Promise<ApiResponse<Task[]>> {
    const data = await gasClient.get<Task[]>('getTodayTasks');
    return { data, success: true };
  },

  async getTask(id: string): Promise<ApiResponse<Task>> {
    const tasks = await gasClient.get<Task[]>('getTasks');
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found');
    return { data: task, success: true };
  },

  async createTask(payload: Partial<Task>): Promise<ApiResponse<Task>> {
    const data = await gasClient.post<Task>('createTask', payload as Record<string, unknown>);
    return { data, success: true };
  },

  async updateTask(id: string, payload: Partial<Task>): Promise<ApiResponse<Task>> {
    const data = await gasClient.post<Task>('updateTask', { taskId: id, ...payload });
    return { data, success: true };
  },

  async updateTaskStatus(id: string, status: Task['status']): Promise<ApiResponse<Task>> {
    await gasClient.post<unknown>('updateTaskStatus', { taskId: id, status });
    return { data: { id, status } as Task, success: true };
  },

  async linkTaskToProject(taskId: string, projectId: string): Promise<ApiResponse<{ taskId: string; projectId: string; linked: boolean }>> {
    const data = await gasClient.post<{ taskId: string; projectId: string; linked: boolean }>('linkTaskToProject', { taskId, projectId });
    return { data, success: true };
  },

  async deleteTask(id: string): Promise<void> {
    await gasClient.post<unknown>('deleteTask', { taskId: id });
  },
};
