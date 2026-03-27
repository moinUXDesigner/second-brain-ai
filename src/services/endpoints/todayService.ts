import gasClient from '../gasClient';
import type { Task, ApiResponse } from '@/types';

export const todayService = {
  async getTodayTasks(): Promise<ApiResponse<Task[]>> {
    const data = await gasClient.get<Task[]>('getTodayTasks');
    return { data, success: true };
  },

  async generateTodayView(): Promise<ApiResponse<Task[]>> {
    const data = await gasClient.post<Task[]>('generateTodayView');
    return { data: data ?? [], success: true };
  },
};
