import { useCallback, useState } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { useAudit } from './useAudit';

export function useAuth() {
  const { setUser, clearAuth, isAuthenticated } = useAuthStore();
  const [loading] = useState(false);
  const { log } = useAudit();

  const loginWithGoogle = useCallback(async () => {
    const mockUser = {
      id: 'google-demo-user',
      name: 'Demo User (Google)',
      email: 'demo@secondbrain.ai',
      role: 'super_admin' as const,
    };
    localStorage.setItem('auth_token', 'demo-token');
    setUser(mockUser, 'demo-token');
    await log('LOGIN', 'auth', mockUser.id, { method: 'google' });
  }, [setUser, log]);

  const loginWithEmail = useCallback(
    async (email: string, _password: string) => {
      const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const mockUser = {
        id: `user-${Date.now()}`,
        name,
        email,
        role: 'super_admin' as const,
      };
      localStorage.setItem('auth_token', 'demo-token');
      setUser(mockUser, 'demo-token');
      await log('LOGIN', 'auth', mockUser.id, { method: 'email' });
    },
    [setUser, log],
  );

  const logout = useCallback(async () => {
    await log('LOGOUT', 'auth');
    localStorage.removeItem('auth_token');
    clearAuth();
  }, [clearAuth, log]);

  return { loginWithGoogle, loginWithEmail, logout, loading, isAuthenticated };
}
