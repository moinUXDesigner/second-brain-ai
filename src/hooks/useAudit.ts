import { useCallback } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { auditService } from '@/services/endpoints/auditService';
import { isFeatureEnabled } from '@/utils/featureFlags';
import type { AuditAction } from '@/types';

export function useAudit() {
  const user = useAuthStore((s) => s.user);

  const log = useCallback(
    (
      action: AuditAction,
      entityType: string,
      entityId?: string,
      metadata?: Record<string, unknown>,
    ) => {
      if (!isFeatureEnabled('AUDIT_LOGGING')) return;

      try {
        auditService.createLog({
          userId: user?.id ?? 'anonymous',
          userName: user?.name ?? undefined,
          action,
          entityType,
          entityId,
          metadata,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Silent fail — audit should never break the app
      }
    },
    [user],
  );

  return { log };
}
