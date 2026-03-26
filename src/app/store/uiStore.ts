import { create } from 'zustand';

interface UiState {
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  isLoading: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  setLoading: (loading: boolean) => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  isSidebarOpen: typeof window !== 'undefined' && window.innerWidth >= 1024,
  isDarkMode: localStorage.getItem('theme') === 'dark',
  isLoading: false,
  activeModal: null,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.isDarkMode;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return { isDarkMode: next };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),
}));
