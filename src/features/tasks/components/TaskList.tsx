import type { Task } from '@/types';
import { Badge } from '@/components/ui/Badge';

export function TaskList({ tasks, onDelete }: { tasks: Task[]; onDelete?: (id: string) => void }) {
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
              {task.projectName && (
                <span style={{ color: 'var(--primary-600)' }}>{task.projectName}</span>
              )}
            </div>
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="shrink-0 p-1.5 rounded-md transition-colors hover:opacity-80"
                style={{ color: 'var(--color-danger, #ef4444)' }}
                title="Delete task"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
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
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider hidden xl:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Project</th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider hidden xl:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Updated</th>
                {onDelete && (
                  <th className="px-4 py-3 text-right text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}></th>
                )}
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
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-caption" style={{ color: task.projectName ? 'var(--primary-600)' : 'var(--color-text-secondary)' }}>
                      {task.projectName || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                      {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  {onDelete && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onDelete(task.id)}
                        className="p-1.5 rounded-md transition-colors hover:opacity-80"
                        style={{ color: 'var(--color-danger, #ef4444)' }}
                        title="Delete task"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
