import apiClient from '../apiClient';
import type { Task, ApiResponse } from '@/types';

export const todayService = {
  async getTodayTasks(): Promise<ApiResponse<Task[]>> {
    const { data } = await apiClient.get('/tasks/today');
    return data;
  },

  async generateTodayView(): Promise<ApiResponse<Task[]>> {
    const { data } = await apiClient.post('/pipeline/today');
    return data;
  },
};
