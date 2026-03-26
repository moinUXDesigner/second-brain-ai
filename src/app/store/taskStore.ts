import { create } from 'zustand';
import type { Task } from '@/types';

interface TaskState {
  tasks: Task[];
  todayTasks: Task[];
  setTasks: (tasks: Task[]) => void;
  setTodayTasks: (tasks: Task[]) => void;
  updateTaskInStore: (id: string, updates: Partial<Task>) => void;
  addTask: (task: Task) => void;
}

export const useTaskStore = create<TaskState>()((set) => ({
  tasks: [],
  todayTasks: [],
  setTasks: (tasks) => set({ tasks }),
  setTodayTasks: (todayTasks) => set({ todayTasks }),
  updateTaskInStore: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      todayTasks: state.todayTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
      todayTasks: [task, ...state.todayTasks],
    })),
}));
