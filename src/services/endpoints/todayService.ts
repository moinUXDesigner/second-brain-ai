import apiClient from '../apiClient';
import type { Task, ApiResponse } from '@/types';

export const todayService = {
  async getTodayTasks(date?: string): Promise<ApiResponse<Task[]>> {
    const { data } = await apiClient.get('/tasks/today', {
      params: date ? { date } : undefined,
    });
    return data;
  },

  async generateTodayView(date?: string): Promise<ApiResponse<Task[]>> {
    const { data } = await apiClient.post('/pipeline/today', date ? { date } : undefined);
    return data;
  },
};
