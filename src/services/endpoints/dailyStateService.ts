import apiClient from '../apiClient';
import type { DailyState, ApiResponse } from '@/types';

export const dailyStateService = {
  async get(date: string): Promise<ApiResponse<DailyState>> {
    const { data } = await apiClient.get('/daily-state', { params: { date } });
    return data;
  },

  async save(payload: Omit<DailyState, 'id'>): Promise<ApiResponse<DailyState>> {
    const { data } = await apiClient.post('/daily-state', payload);
    return data;
  },
};
