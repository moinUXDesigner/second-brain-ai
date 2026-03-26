import apiClient from '../apiClient';
import type { User, ApiResponse } from '@/types';

export const authService = {
  async login(payload: { idToken: string }): Promise<ApiResponse<{ user: User; token: string }>> {
    const { data } = await apiClient.post('/auth/login', payload);
    return data;
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const { data } = await apiClient.get('/auth/profile');
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
