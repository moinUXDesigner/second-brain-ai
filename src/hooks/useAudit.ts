import { useCallback } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { auditService } from '@/services/endpoints/auditService';
import { isFeatureEnabled } from '@/utils/featureFlags';
import type { AuditAction } from '@/types';

export function useAudit() {
  const user = useAuthStore((s) => s.user);

  const log = useCallback(
    async (
      action: AuditAction,
      entityType: string,
      entityId?: string,
      metadata?: Record<string, unknown>,
    ) => {
      if (!isFeatureEnabled('AUDIT_LOGGING')) return;
      const entry = {
        userId: user?.id ?? 'anonymous',
        action,
        entityType,
        entityId,
        metadata,
        timestamp: new Date().toISOString(),
      };

      try {
        await auditService.createLog(entry);
      } catch {
        // Store locally if API is unavailable
        const local = JSON.parse(localStorage.getItem('pending_audit_logs') || '[]');
        local.push(entry);
        localStorage.setItem('pending_audit_logs', JSON.stringify(local));
      }
    },
    [user],
  );

  return { log };
}
