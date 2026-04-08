import apiClient from '../apiClient';
import type { Profile, ApiResponse } from '@/types';

export const profileService = {
  async getProfile(): Promise<ApiResponse<Profile>> {
    const { data } = await apiClient.get('/profile');
    return data;
  },

  async saveProfile(payload: Profile): Promise<ApiResponse<Profile>> {
    const { data } = await apiClient.post('/profile', payload);
    return data;
  },
};
