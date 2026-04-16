import { create } from 'zustand';

type ColorScheme = 'blue' | 'wellness';

interface UiState {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isDarkMode: boolean;
  colorScheme: ColorScheme;
  aiEnabled: boolean;
  auditVersion: number;
  isLoading: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  toggleDarkMode: () => void;
  toggleColorScheme: () => void;
  toggleAI: () => void;
  setLoading: (loading: boolean) => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  incrementAuditVersion: () => void;
}

function applyColorScheme(scheme: ColorScheme) {
  document.documentElement.classList.toggle('theme-wellness', scheme === 'wellness');
}

export const useUiStore = create<UiState>()((set) => ({
  isSidebarOpen: typeof window !== 'undefined' && window.innerWidth >= 1024,
  isSidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  isDarkMode: localStorage.getItem('theme') === 'dark',
  colorScheme: (localStorage.getItem('colorScheme') as ColorScheme) || 'blue',
  aiEnabled: localStorage.getItem('aiEnabled') !== 'false',
  auditVersion: 0,
  isLoading: false,
  activeModal: null,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  toggleSidebarCollapse: () =>
    set((s) => {
      const next = !s.isSidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(next));
      return { isSidebarCollapsed: next };
    }),
  incrementAuditVersion: () => set((s) => ({ auditVersion: s.auditVersion + 1 })),
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
  toggleAI: () =>
    set((s) => {
      const next = !s.aiEnabled;
      localStorage.setItem('aiEnabled', String(next));
      return { aiEnabled: next };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),
}));
