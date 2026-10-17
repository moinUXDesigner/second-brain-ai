import { create } from 'zustand';
import type { Task, ApiResponse } from '@/types';

interface CompletionRequest {
  task: Task;
  resolve: (response: ApiResponse<Task>) => void;
}

export const useTaskCompletionStore = create<{ request: CompletionRequest | null }>(() => ({ request: null }));

export function requestTaskCompletion(task: Task): Promise<ApiResponse<Task>> {
  if (useTaskCompletionStore.getState().request) {
    return Promise.resolve({ success: true, data: task });
  }
  return new Promise((resolve) => {
    useTaskCompletionStore.setState({ request: { task, resolve } });
  });
}
