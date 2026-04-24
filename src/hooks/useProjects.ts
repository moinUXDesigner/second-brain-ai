import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/endpoints/projectService';
import { useAudit } from './useAudit';
import { QUERY_KEYS } from '@/constants';
import type { Project } from '@/types';

export function useProjects() {
  return useQuery({
    queryKey: QUERY_KEYS.projects,
    queryFn: async () => {
      const res = await projectService.getProjects();
      return res.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.project(id),
    queryFn: async () => {
      const res = await projectService.getProject(id);
      return res.data;
    },
    enabled: !!id,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { log } = useAudit();

  return useMutation({
    mutationFn: (payload: { title: string; description?: string }) =>
      projectService.createProject(payload),
    onSuccess: (res) => {
      log('CREATE_PROJECT', 'project', res.data.id, { title: res.data.title });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
    },
  });
}

export function useDeletedProjects() {
  return useQuery({
    queryKey: QUERY_KEYS.deletedProjects,
    queryFn: async () => {
      const res = await projectService.getDeletedProjects();
      return res.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { log } = useAudit();

  return useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: (_, id) => {
      log('DELETE_PROJECT', 'project', id);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.deletedProjects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { log } = useAudit();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
      projectService.updateProject(id, updates),
    onSuccess: (res, { id }) => {
      log('UPDATE_PROJECT', 'project', id, { title: res.data.title });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
    },
  });
}
