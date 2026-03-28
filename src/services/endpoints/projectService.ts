import gasClient from '../gasClient';
import type { Project, ApiResponse } from '@/types';

export const projectService = {
  async getProjects(): Promise<ApiResponse<Project[]>> {
    const data = await gasClient.get<Project[]>('getProjects');
    return { data, success: true };
  },

  async getProject(id: string): Promise<ApiResponse<Project>> {
    const projects = await gasClient.get<Project[]>('getProjects');
    const project = projects.find((p) => p.id === id);
    if (!project) throw new Error('Project not found');
    return { data: project, success: true };
  },

  async createProject(payload: { title: string; description?: string }): Promise<ApiResponse<Project>> {
    const data = await gasClient.post<Project>('createProject', payload as Record<string, unknown>);
    return { data, success: true };
  },

  async updateProject(id: string, payload: Partial<Project>): Promise<ApiResponse<Project>> {
    await gasClient.post<unknown>('updateProject', { projectId: id, ...payload } as Record<string, unknown>);
    return { data: { id, ...payload } as Project, success: true };
  },

  async getDeletedProjects(): Promise<ApiResponse<Project[]>> {
    const data = await gasClient.get<Project[]>('getDeletedProjects');
    return { data, success: true };
  },

  async deleteProject(id: string): Promise<void> {
    await gasClient.post<unknown>('deleteProject', { projectId: id });
  },
};
