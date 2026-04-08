import apiClient from '../apiClient';
import type { ApiResponse, CreateInput, Task, Project, AnalyzeResult } from '@/types';

export const inputService = {
  async createTaskOrProject(
    payload: CreateInput,
  ): Promise<ApiResponse<{ task?: Task; project?: Project }>> {
    const { data } = await apiClient.post('/input', payload);
    return data;
  },

  async analyzeInput(
    payload: { text: string; area: string; aiEnabled: boolean },
  ): Promise<ApiResponse<AnalyzeResult>> {
    const { data } = await apiClient.post('/ai/analyze', payload);
    return data;
  },
};
