import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { fromNow } from '@/utils/date';
import type { AuditLog } from '@/types';

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    // Load from local storage fallback
    try {
      const stored = JSON.parse(localStorage.getItem('pending_audit_logs') || '[]') as AuditLog[];
      setLogs(stored.slice(-50).reverse());
    } catch {
      setLogs([]);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
      </CardHeader>

      {logs.length === 0 ? (
        <p className="text-body text-neutral-500 pb-2">No audit logs recorded yet. Actions will be logged as you use the system.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-semantic-border">
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Entity</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-semantic-border">
              {logs.map((log, i) => (
                <tr key={log.id || i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                  <td className="px-4 py-3">
                    <Badge variant={log.action.includes('CREATE') ? 'success' : log.action.includes('DELETE') ? 'danger' : 'primary'}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-body text-neutral-600 dark:text-neutral-400">{log.entityType}</td>
                  <td className="px-4 py-3 text-caption text-neutral-500">{log.userId}</td>
                  <td className="px-4 py-3 text-caption text-neutral-400">{fromNow(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
