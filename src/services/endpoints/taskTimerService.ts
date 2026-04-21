import apiClient from '../apiClient';
import type { ApiResponse, Task } from '@/types';

export const taskTimerService = {
  async startTimer(taskId: string): Promise<ApiResponse<Task>> {
    const { data } = await apiClient.post(`/tasks/${taskId}/timer/start`);
    return data;
  },

  async pauseTimer(taskId: string): Promise<ApiResponse<Task>> {
    const { data } = await apiClient.post(`/tasks/${taskId}/timer/pause`);
    return data;
  },

  async stopTimer(taskId: string): Promise<ApiResponse<Task>> {
    const { data } = await apiClient.post(`/tasks/${taskId}/timer/stop`);
    return data;
  },

  async resetTimer(taskId: string): Promise<ApiResponse<Task>> {
    const { data } = await apiClient.post(`/tasks/${taskId}/timer/reset`);
    return data;
  },
};
