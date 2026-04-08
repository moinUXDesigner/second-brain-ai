import apiClient from '../apiClient';
import type { Project, ApiResponse } from '@/types';

export const projectService = {
  async getProjects(): Promise<ApiResponse<Project[]>> {
    const { data } = await apiClient.get('/projects');
    return data;
  },

  async getProject(id: string): Promise<ApiResponse<Project>> {
    const { data } = await apiClient.get(`/projects/${id}`);
    return data;
  },

  async createProject(payload: { title: string; description?: string }): Promise<ApiResponse<Project>> {
    const { data } = await apiClient.post('/projects', payload);
    return data;
  },

  async updateProject(id: string, payload: Partial<Project>): Promise<ApiResponse<Project>> {
    const { data } = await apiClient.put(`/projects/${id}`, payload);
    return data;
  },

  async getDeletedProjects(): Promise<ApiResponse<Project[]>> {
    const { data } = await apiClient.get('/projects/deleted');
    return data;
  },

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },

  async restoreProject(id: string): Promise<ApiResponse<Project>> {
    const { data } = await apiClient.patch(`/projects/${id}/restore`);
    return data;
  },
};
