import { api } from '../api';
import type { ApiResponse, Task } from '@/types';

export const taskTimerService = {
  startTimer: (taskId: string) =>
    api.post<ApiResponse<Task>>(`/tasks/${taskId}/timer/start`),

  pauseTimer: (taskId: string) =>
    api.post<ApiResponse<Task>>(`/tasks/${taskId}/timer/pause`),

  stopTimer: (taskId: string) =>
    api.post<ApiResponse<Task>>(`/tasks/${taskId}/timer/stop`),
};
