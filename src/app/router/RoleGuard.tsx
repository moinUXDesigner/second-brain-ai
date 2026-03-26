import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';
import type { Role } from '@/types';
import type { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Role[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const role = useAuthStore((s) => s.role);

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
