import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '@/types';

interface AuthState {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  token: string | null;
  setUser: (user: User, token?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      token: null,
      setUser: (user, token) =>
        set({
          user,
          role: user.role,
          isAuthenticated: true,
          token: token ?? null,
        }),
      clearAuth: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, role: null, isAuthenticated: false, token: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    },
  ),
);
