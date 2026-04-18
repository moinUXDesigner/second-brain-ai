import apiClient from '../apiClient';
import type { Task, ApiResponse, PaginatedResponse } from '@/types';

export const taskService = {
  async getTasks(_params?: Record<string, string>): Promise<PaginatedResponse<Task>> {
    const { data } = await apiClient.get('/tasks');
    return data;
  },

  async getTodayTasks(): Promise<ApiResponse<Task[]>> {
    const { data } = await apiClient.get('/tasks/today');
    return data;
  },

  async getTask(id: string): Promise<ApiResponse<Task>> {
    const { data } = await apiClient.get(`/tasks/${id}`);
    return data;
  },

  async createTask(payload: Partial<Task>): Promise<ApiResponse<Task>> {
    const { data } = await apiClient.post('/tasks', payload);
    return data;
  },

  async updateTask(id: string, payload: Partial<Task>): Promise<ApiResponse<Task>> {
    const { data } = await apiClient.put(`/tasks/${id}`, payload);
    return data;
  },

  async updateTaskStatus(id: string, status: Task['status']): Promise<ApiResponse<Task>> {
    const { data } = await apiClient.patch(`/tasks/${id}/status`, { status });
    return data;
  },

  async linkTaskToProject(taskId: string, projectId: string): Promise<ApiResponse<{ taskId: string; projectId: string; linked: boolean }>> {
    const { data } = await apiClient.patch(`/tasks/${taskId}/link`, { project_id: projectId });
    return data;
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  async resetRecurringTask(id: string): Promise<ApiResponse<Task>> {
    const { data } = await apiClient.post(`/tasks/${id}/reset`);
    return data;
  },
};
