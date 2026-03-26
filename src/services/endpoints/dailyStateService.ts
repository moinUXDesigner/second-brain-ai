import gasClient from '../gasClient';
import type { DailyState, ApiResponse } from '@/types';

export const dailyStateService = {
  async get(date: string): Promise<ApiResponse<DailyState>> {
    const data = await gasClient.get<DailyState>('getDailyState', { date });
    return { data, success: true };
  },

  async save(payload: Omit<DailyState, 'id'>): Promise<ApiResponse<DailyState>> {
    const data = await gasClient.post<DailyState>('saveDailyState', payload as unknown as Record<string, unknown>);
    return { data, success: true };
  },
};
