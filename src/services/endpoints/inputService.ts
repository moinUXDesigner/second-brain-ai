import gasClient from '../gasClient';
import type { ApiResponse, CreateInput, Task, Project, AnalyzeResult } from '@/types';

export const inputService = {
  async createTaskOrProject(
    payload: CreateInput,
  ): Promise<ApiResponse<{ task?: Task; project?: Project }>> {
    const data = await gasClient.post<{ task?: Task; project?: Project }>(
      'createInput',
      payload as unknown as Record<string, unknown>,
    );
    return { data, success: true };
  },

  async analyzeInput(
    payload: { text: string; area: string; aiEnabled: boolean },
  ): Promise<ApiResponse<AnalyzeResult>> {
    const data = await gasClient.post<AnalyzeResult>(
      'analyzeInput',
      payload as unknown as Record<string, unknown>,
    );
    return { data, success: true };
  },
};
