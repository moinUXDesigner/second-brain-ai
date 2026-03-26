import type { Task } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-body text-neutral-500">No tasks yet. Use the input above to create one.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {tasks.map((task) => (
          <div key={task.id} className={cn('card p-4 space-y-2', task.status === 'Done' && 'opacity-60')}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={cn('text-body font-medium text-neutral-900 dark:text-neutral-50', task.status === 'Done' && 'line-through')}>
                  {task.title}
                </p>
                {task.area && <p className="text-caption text-neutral-400">{task.area}</p>}
              </div>
              <Badge variant={task.status === 'Done' ? 'success' : 'warning'}>
                {task.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-caption">
              <Badge>{task.type || '—'}</Badge>
              {task.priority != null && (
                <span className="text-neutral-500">P: {task.priority}</span>
              )}
              {task.impact != null && (
                <span className="text-neutral-500">Impact: {task.impact}</span>
              )}
              {task.effort != null && (
                <span className="text-neutral-500">Effort: {task.effort}</span>
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
              <tr className="border-b border-semantic-border bg-neutral-50 dark:bg-neutral-800/50">
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Maslow</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Impact</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Effort</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Urgency</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-semantic-border">
              {tasks.map((task) => (
                <tr key={task.id} className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                  <td className="px-4 py-3">
                    <p className={cn('text-body font-medium text-neutral-900 dark:text-neutral-50', task.status === 'Done' && 'line-through opacity-60')}>
                      {task.title}
                    </p>
                    {task.area && <p className="text-caption text-neutral-400">{task.area}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{task.type || '—'}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-caption text-neutral-600 dark:text-neutral-300">{task.maslow || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-body text-neutral-700 dark:text-neutral-300">{task.impact ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-body text-neutral-700 dark:text-neutral-300">{task.effort ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-body text-neutral-700 dark:text-neutral-300">{task.priority ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {task.urgency ? (
                      <Badge variant={task.urgency === 'High' ? 'danger' : task.urgency === 'Medium' ? 'warning' : 'default'}>
                        {task.urgency}
                      </Badge>
                    ) : (
                      <span className="text-caption text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={task.status === 'Done' ? 'success' : 'warning'}>
                      {task.status}
                    </Badge>
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
