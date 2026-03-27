import { create } from 'zustand';

type ColorScheme = 'blue' | 'wellness';

interface UiState {
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  colorScheme: ColorScheme;
  isLoading: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  toggleColorScheme: () => void;
  setLoading: (loading: boolean) => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
}

function applyColorScheme(scheme: ColorScheme) {
  document.documentElement.classList.toggle('theme-wellness', scheme === 'wellness');
}

export const useUiStore = create<UiState>()((set) => ({
  isSidebarOpen: typeof window !== 'undefined' && window.innerWidth >= 1024,
  isDarkMode: localStorage.getItem('theme') === 'dark',
  colorScheme: (localStorage.getItem('colorScheme') as ColorScheme) || 'blue',
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
  toggleColorScheme: () =>
    set((s) => {
      const next: ColorScheme = s.colorScheme === 'blue' ? 'wellness' : 'blue';
      localStorage.setItem('colorScheme', next);
      applyColorScheme(next);
      return { colorScheme: next };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),
}));
