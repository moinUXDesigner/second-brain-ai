import { useCallback, useState } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { authService } from '@/services/endpoints/authService';
import { useAudit } from './useAudit';

export function useAuth() {
  const { setUser, clearAuth, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { log } = useAudit();

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const res = await authService.login({ email, password });
        const { user, token } = res.data;
        localStorage.setItem('auth_token', token);
        setUser(user, token);
        await log('LOGIN', 'auth', user.id, { method: 'email' });
      } finally {
        setLoading(false);
      }
    },
    [setUser, log],
  );

  // Google login is not supported with Sanctum — kept as stub for UI compatibility
  const loginWithGoogle = useCallback(async () => {
    throw new Error('Google login is not supported. Please use email/password.');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore if token already expired
    } finally {
      log('LOGOUT', 'auth');
      localStorage.removeItem('auth_token');
      clearAuth();
    }
  }, [clearAuth, log]);

  return { loginWithGoogle, loginWithEmail, logout, loading, isAuthenticated };
}
