import type { Task } from '@/types';
import { Badge } from '@/components/ui/Badge';

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
          No pending tasks found. Tap + to create one.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {tasks.map((task) => (
          <div key={task.id} className="card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-body font-medium" style={{ color: 'var(--color-text)' }}>
                  {task.title}
                </p>
                {task.area && (
                  <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{task.area}</p>
                )}
              </div>
              <Badge variant="warning">{task.status}</Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-caption">
              <Badge>{task.type || '—'}</Badge>
              {task.priority != null && (
                <span style={{ color: 'var(--color-text-secondary)' }}>P: {task.priority}</span>
              )}
              {task.impact != null && (
                <span style={{ color: 'var(--color-text-secondary)' }}>Impact: {task.impact}</span>
              )}
              {task.effort != null && (
                <span style={{ color: 'var(--color-text-secondary)' }}>Effort: {task.effort}</span>
              )}
              {task.urgency && (
                <Badge variant={task.urgency === 'High' ? 'danger' : task.urgency === 'Medium' ? 'warning' : 'default'}>
                  {task.urgency}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table layout */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-muted)' }}>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Title</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Type</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Area</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Impact</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Effort</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Priority</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Urgency</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => (
                <tr
                  key={task.id}
                  className="transition-colors"
                  style={{
                    borderBottom: i < tasks.length - 1 ? '1px solid var(--color-border)' : undefined,
                  }}
                >
                  <td className="px-4 py-3">
                    <p className="text-body font-medium" style={{ color: 'var(--color-text)' }}>
                      {task.title}
                    </p>
                    {task.area && (
                      <p className="text-caption md:hidden" style={{ color: 'var(--color-text-secondary)' }}>{task.area}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{task.type || '—'}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{task.area || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-body" style={{ color: 'var(--color-text)' }}>{task.impact ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-body" style={{ color: 'var(--color-text)' }}>{task.effort ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-body" style={{ color: 'var(--color-text)' }}>{task.priority ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {task.urgency ? (
                      <Badge variant={task.urgency === 'High' ? 'danger' : task.urgency === 'Medium' ? 'warning' : 'default'}>
                        {task.urgency}
                      </Badge>
                    ) : (
                      <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
