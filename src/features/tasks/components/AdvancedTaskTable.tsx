import { useMemo, useState } from 'react';
import type { Task } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { EditTaskModal } from './EditTaskModal';
import { LinkToProjectModal } from '@/components/task/LinkToProjectModal';
import { TaskViewModal } from '@/components/task/TaskViewModal';
import { useScheduleToday } from '@/hooks/useTasks';
import { formatDate } from '@/utils/dateFormat';

type SortDirection = 'asc' | 'desc' | null;
type SortColumn = 'title' | 'priority' | 'urgency' | 'dueDate' | 'deadlineDate' | 'updated';

interface ColumnFilter {
  urgency: string[];
}

interface AdvancedTaskTableProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  deletingId: string | null;
  completingId: string | null;
}

export function AdvancedTaskTable({ tasks, onDelete, onComplete, deletingId, completingId }: AdvancedTaskTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({ urgency: [] });
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [linkTask, setLinkTask] = useState<Task | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const scheduleToday = useScheduleToday();

  const filterOptions = useMemo(() => ({
    urgency: ['High', 'Medium', 'Low'],
  }), []);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') setSortColumn('updated');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleFilter = (column: keyof ColumnFilter, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: prev[column].includes(value)
        ? prev[column].filter(v => v !== value)
        : [...prev[column], value],
    }));
  };

  const clearColumnFilter = (column: keyof ColumnFilter) => {
    setColumnFilters(prev => ({ ...prev, [column]: [] }));
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...tasks];

    if (columnFilters.urgency.length > 0) {
      result = result.filter(t => columnFilters.urgency.includes(t.urgency || ''));
    }

    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (sortColumn) {
          case 'title':
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          case 'priority':
            aVal = a.priority ?? 0;
            bVal = b.priority ?? 0;
            break;
          case 'urgency':
            aVal = a.urgency || '';
            bVal = b.urgency || '';
            break;
          case 'dueDate':
            aVal = a.dueDate || '';
            bVal = b.dueDate || '';
            break;
          case 'deadlineDate':
            aVal = a.deadlineDate || '';
            bVal = b.deadlineDate || '';
            break;
          case 'updated':
            aVal = a.updatedAt || '';
            bVal = b.updatedAt || '';
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [tasks, columnFilters, sortColumn, sortDirection]);

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return (
        <svg className="h-3 w-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const FilterDropdown = ({ column, options }: { column: keyof ColumnFilter; options: string[] }) => {
    const activeFilters = columnFilters[column];
    const isOpen = showFilters[column];

    return (
      <div className="relative inline-block">
        <button
          onClick={() => setShowFilters(prev => ({ ...prev, [column]: !prev[column] }))}
          className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: activeFilters.length > 0 ? 'var(--primary-600)' : 'var(--color-text-secondary)' }}
          title="Filter urgency"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowFilters(prev => ({ ...prev, [column]: false }))} />
            <div className="card absolute left-0 top-full z-20 mt-1 max-h-[200px] min-w-[150px] overflow-y-auto p-2 shadow-lg">
              {activeFilters.length > 0 && (
                <button
                  onClick={() => clearColumnFilter(column)}
                  className="mb-1 w-full rounded px-2 py-1 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--primary-600)' }}
                >
                  Clear all
                </button>
              )}
              {options.map(option => (
                <label key={option} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={activeFilters.includes(option)}
                    onChange={() => toggleFilter(column, option)}
                    className="rounded"
                  />
                  <span style={{ color: 'var(--color-text)' }}>{option}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="sticky top-0 z-20">
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-muted)' }}>
                <th className="w-[34%] px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1 text-caption font-medium uppercase tracking-wider hover:opacity-80"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Title
                    <SortIcon column="title" />
                  </button>
                </th>
                <th className="w-[9%] px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('priority')}
                    className="flex items-center gap-1 text-caption font-medium uppercase tracking-wider hover:opacity-80"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Priority
                    <SortIcon column="priority" />
                  </button>
                </th>
                <th className="w-[12%] px-4 py-3 text-left">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSort('urgency')}
                      className="flex items-center gap-1 text-caption font-medium uppercase tracking-wider hover:opacity-80"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Urgency
                      <SortIcon column="urgency" />
                    </button>
                    <FilterDropdown column="urgency" options={filterOptions.urgency} />
                  </div>
                </th>
                <th className="w-[12%] px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('dueDate')}
                    className="flex items-center gap-1 text-caption font-medium uppercase tracking-wider hover:opacity-80"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Due Date
                    <SortIcon column="dueDate" />
                  </button>
                </th>
                <th className="w-[13%] px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('deadlineDate')}
                    className="flex items-center gap-1 text-caption font-medium uppercase tracking-wider hover:opacity-80"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Deadline
                    <SortIcon column="deadlineDate" />
                  </button>
                </th>
                <th className="w-[20%] px-4 py-3 text-right text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((task, i) => (
                <tr
                  key={task.id}
                  onClick={() => setViewTask(task)}
                  className="cursor-pointer transition-colors hover:bg-black/[.015] dark:hover:bg-white/[.015]"
                  style={{
                    borderBottom: i < filteredAndSorted.length - 1 ? '1px solid var(--color-border)' : undefined,
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <p className="truncate text-body font-medium" style={{ color: 'var(--color-text)' }} title={task.title}>
                        {task.title}
                      </p>
                      {(task.source === 'BULK' || task.tags?.includes('Batch Uploaded')) && (
                        <Badge variant="primary" className="shrink-0 !px-1.5 !py-0 !text-[9px]">Batch</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {task.priority != null ? (
                      <span className="inline-flex items-center rounded-full bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
                        {task.priority}
                      </span>
                    ) : (
                      <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {task.urgency ? (
                      <Badge
                        variant={task.urgency === 'High' ? 'danger' : task.urgency === 'Medium' ? 'warning' : 'default'}
                        className="!px-1.5 !py-0.5 !text-[10px]"
                      >
                        {task.urgency}
                      </Badge>
                    ) : (
                      <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                      {task.dueDate ? formatDate(task.dueDate) : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                      {task.deadlineDate ? formatDate(task.deadlineDate) : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        className="btn btn-xs btn-outline p-1"
                        onClick={(event) => {
                          event.stopPropagation();
                          onComplete(task.id);
                        }}
                        disabled={completingId === task.id}
                        title="Complete task"
                      >
                        {completingId === task.id ? (
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <button
                        className="btn btn-xs btn-outline p-1"
                        onClick={(event) => {
                          event.stopPropagation();
                          scheduleToday.mutate(task.id);
                        }}
                        disabled={scheduleToday.isPending}
                        title="Schedule for today"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        className="btn btn-xs btn-outline p-1"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditTask(task);
                        }}
                        title="Edit task"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        className="btn btn-xs btn-outline p-1"
                        onClick={(event) => {
                          event.stopPropagation();
                          setLinkTask(task);
                        }}
                        title="Link to project"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>
                      <button
                        className="btn btn-xs btn-outline p-1"
                        onClick={(event) => {
                          event.stopPropagation();
                          setConfirmId(task.id);
                        }}
                        disabled={deletingId === task.id}
                        style={{ color: 'var(--color-danger, #ef4444)' }}
                        title="Delete task"
                      >
                        {deletingId === task.id ? (
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewTask && <TaskViewModal task={viewTask} onClose={() => setViewTask(null)} />}
      {editTask && <EditTaskModal task={editTask} onClose={() => setEditTask(null)} />}
      {linkTask && <LinkToProjectModal task={linkTask} onClose={() => setLinkTask(null)} />}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card w-full max-w-sm space-y-4 p-6">
            <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Delete Task?</h3>
            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              This task will be moved to the deleted list.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className="rounded-md px-4 py-2 text-caption font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(confirmId); setConfirmId(null); }}
                className="rounded-md px-4 py-2 text-caption font-medium !text-white transition-colors"
                style={{ backgroundColor: 'var(--color-danger, #ef4444)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
