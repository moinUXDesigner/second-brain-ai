import type { Role } from '@/types';
import { PERMISSION_MATRIX } from '@/constants';

export function hasPermission(role: Role, permission: string): boolean {
  const perms = PERMISSION_MATRIX[role];
  if (!perms) return false;
  if (perms.includes('*')) return true;
  return perms.includes(permission);
}
