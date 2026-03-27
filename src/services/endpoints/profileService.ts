import gasClient from '../gasClient';
import type { Profile, ApiResponse } from '@/types';

export const profileService = {
  async getProfile(): Promise<ApiResponse<Profile>> {
    const data = await gasClient.get<Profile>('getProfile');
    return { data, success: true };
  },

  async saveProfile(payload: Profile): Promise<ApiResponse<Profile>> {
    const data = await gasClient.post<Profile>('saveProfile', payload as unknown as Record<string, unknown>);
    return { data, success: true };
  },
};
