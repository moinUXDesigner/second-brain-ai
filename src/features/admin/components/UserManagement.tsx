import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { User, Role } from '@/types';

// Mock data for UI
const mockUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'super_admin' },
  { id: '2', name: 'Manager', email: 'manager@example.com', role: 'admin' },
  { id: '3', name: 'Team Member', email: 'member@example.com', role: 'user' },
];

const roleVariant: Record<Role, 'danger' | 'warning' | 'default'> = {
  super_admin: 'danger',
  admin: 'warning',
  user: 'default',
};

export function UserManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-semantic-border">
              <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-semantic-border">
            {mockUsers.map((u) => (
              <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="px-4 py-3 text-body font-medium text-neutral-900 dark:text-neutral-50">{u.name}</td>
                <td className="px-4 py-3 text-body text-neutral-600 dark:text-neutral-400">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={roleVariant[u.role]}>{u.role.replace('_', ' ')}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
