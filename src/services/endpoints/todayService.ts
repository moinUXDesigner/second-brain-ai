import apiClient from '../apiClient';
import type { Task, ApiResponse } from '@/types';

export interface SmartViewMetadata {
  mode: 'ai' | 'rules';
  availableMinutes: number;
  selectedMinutes: number;
  scheduledOverflowMinutes: number;
}

export const todayService = {
  async getTodayTasks(date?: string): Promise<ApiResponse<Task[]>> {
    const { data } = await apiClient.get('/tasks/today', {
      params: date ? { date } : undefined,
    });
    return data;
  },

  async getSmartTodayTasks(date?: string): Promise<ApiResponse<Task[]>> {
    const { data } = await apiClient.get('/tasks/today/smart', {
      params: date ? { date } : undefined,
    });
    return data;
  },

  async generateTodayView(date?: string): Promise<ApiResponse<Task[]> & { meta: SmartViewMetadata }> {
    const { data } = await apiClient.post('/pipeline/today', date ? { date } : undefined, { timeout: 60000 });
    return data;
  },
};
