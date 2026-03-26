import gasClient from '../gasClient';
import type { ApiResponse, CreateInput, Task, Project } from '@/types';

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
};
