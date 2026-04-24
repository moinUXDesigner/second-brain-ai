import { useState, useMemo } from 'react';
import type { Task } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { TaskTimer } from '@/components/task/TaskTimer';
import { EditTaskModal } from './EditTaskModal';
import { LinkToProjectModal } from '@/components/task/LinkToProjectModal';
import { TaskViewModal } from '@/components/task/TaskViewModal';
import { useScheduleToday } from '@/hooks/useTasks';
import { formatDate } from '@/utils/dateFormat';

type SortDirection = 'asc' | 'desc' | null;
type SortColumn = 'title' | 'type' | 'area' | 'impact' | 'effort' | 'priority' | 'urgency' | 'project' | 'updated';

interface ColumnFilter {
  type: string[];
  area: string[];
  urgency: string[];
  project: string[];
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
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({
    type: [],
    area: [],
    urgency: [],
    project: [],
  });
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [linkTask, setLinkTask] = useState<Task | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const scheduleToday = useScheduleToday();

  // Extract unique values for filters
  const filterOptions = useMemo(() => ({
    type: Array.from(new Set(tasks.map(t => t.type).filter((v): v is string => Boolean(v)))).sort(),
    area: Array.from(new Set(tasks.map(t => t.area).filter((v): v is string => Boolean(v)))).sort(),
    urgency: ['High', 'Medium', 'Low'],
    project: Array.from(new Set(tasks.map(t => t.projectName).filter((v): v is string => Boolean(v)))).sort(),
  }), [tasks]);

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

    // Apply filters
    if (columnFilters.type.length > 0) {
      result = result.filter(t => columnFilters.type.includes(t.type || ''));
    }
    if (columnFilters.area.length > 0) {
      result = result.filter(t => columnFilters.area.includes(t.area || ''));
    }
    if (columnFilters.urgency.length > 0) {
      result = result.filter(t => columnFilters.urgency.includes(t.urgency || ''));
    }
    if (columnFilters.project.length > 0) {
      result = result.filter(t => columnFilters.project.includes(t.projectName || ''));
    }

    // Apply sorting
    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortColumn) {
          case 'title':
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          case 'type':
            aVal = a.type || '';
            bVal = b.type || '';
            break;
          case 'area':
            aVal = a.area || '';
            bVal = b.area || '';
            break;
          case 'impact':
            aVal = a.impact ?? 0;
            bVal = b.impact ?? 0;
            break;
          case 'effort':
            aVal = a.effort ?? 0;
            bVal = b.effort ?? 0;
            break;
          case 'priority':
            aVal = a.priority ?? 0;
            bVal = b.priority ?? 0;
            break;
          case 'urgency':
            aVal = a.urgency || '';
            bVal = b.urgency || '';
            break;
          case 'project':
            aVal = a.projectName || '';
            bVal = b.projectName || '';
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
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: activeFilters.length > 0 ? 'var(--primary-600)' : 'var(--color-text-secondary)' }}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowFilters(prev => ({ ...prev, [column]: false }))} />
            <div className="absolute top-full left-0 mt-1 z-20 card p-2 min-w-[150px] max-h-[200px] overflow-y-auto shadow-lg">
              {activeFilters.length > 0 && (
                <button
                  onClick={() => clearColumnFilter(column)}
                  className="w-full text-left px-2 py-1 text-xs rounded hover:bg-black/5 dark:hover:bg-white/5 mb-1"
                  style={{ color: 'var(--primary-600)' }}
                >
                  Clear all
                </button>
              )}
              {options.map(option => (
                <label key={option} className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
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
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-muted)' }}>
                <th className="w-10 px-3 py-3"></th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1 text-caption font-medium uppercase tracking-wider hover:opacity-80"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Title
                    <SortIcon column="title" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSort('type')}
                      className="flex items-center gap-1 text-caption font-medium uppercase tracking-wider hover:opacity-80"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Type
                      <SortIcon column="type" />
                    </button>
                    <FilterDropdown column="type" options={filterOptions.type} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSort('area')}
                      className="flex items-center gap-1 text-caption font-medium uppercase tracking-wider hover:opacity-80"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Area
                      <SortIcon column="area" />
                    </button>
                    <FilterDropdown column="area" options={filterOptions.area} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('impact')}
                    className="flex items-center gap-1 text-caption font-medium uppercase tracking-wider hover:opacity-80"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Impact
                    <SortIcon column="impact" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <button
                    onClick={() => handleSort('effort')}
                    className="flex items-center gap-1 text-caption font-medium uppercase tracking-wider hover:opacity-80"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Effort
                    <SortIcon column="effort" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('priority')}
                    className="flex items-center gap-1 text-caption font-medium uppercase tracking-wider hover:opacity-80"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Priority
                    <SortIcon column="priority" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
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
                <th className="px-4 py-3 text-left hidden xl:table-cell">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSort('project')}
                      className="flex items-center gap-1 text-caption font-medium uppercase tracking-wider hover:opacity-80"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Project
                      <SortIcon column="project" />
                    </button>
                    <FilterDropdown column="project" options={filterOptions.project} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left hidden xl:table-cell text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Due Date</th>
                <th className="px-4 py-3 text-left hidden xl:table-cell text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Deadline Date</th>
                <th className="px-4 py-3 text-left hidden xl:table-cell text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>AI Time</th>
                <th className="px-4 py-3 text-left hidden xl:table-cell text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Actual Time</th>
                <th className="px-4 py-3 text-left hidden xl:table-cell">
                  <button
                    onClick={() => handleSort('updated')}
                    className="flex items-center gap-1 text-caption font-medium uppercase tracking-wider hover:opacity-80"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Updated
                    <SortIcon column="updated" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Actions</th>
                <th className="px-4 py-3 text-right text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}></th>
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
                  <td className="px-3 py-3">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onComplete(task.id);
                      }}
                      disabled={completingId === task.id}
                      className="flex items-center justify-center h-5 w-5 rounded-full border-[1.5px] transition-all duration-200"
                      style={{
                        borderColor: completingId === task.id ? 'var(--primary-500)' : 'var(--color-border)',
                        backgroundColor: completingId === task.id ? 'var(--primary-500)' : 'transparent',
                      }}
                    >
                      {completingId === task.id && (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <p className="text-body font-medium" style={{ color: 'var(--color-text)' }}>
                        {task.title}
                      </p>
                      {(task.source === 'BULK' || task.tags?.includes('Batch Uploaded')) && (
                        <Badge variant="primary" className="shrink-0 !text-[9px] !px-1.5 !py-0">Batch</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="!text-[10px] !px-1.5 !py-0.5">{task.type || '—'}</Badge>
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
                    {task.priority != null ? (
                      <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700">
                        {task.priority}
                      </span>
                    ) : (
                      <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {task.urgency ? (
                      <Badge
                        variant={task.urgency === 'High' ? 'danger' : task.urgency === 'Medium' ? 'warning' : 'default'}
                        className="!text-[10px] !px-1.5 !py-0.5"
                      >
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
                      {task.dueDate ? formatDate(task.dueDate) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                      {task.deadlineDate ? formatDate(task.deadlineDate) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                      {task.timeEstimate || 'â€”'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <TaskTimer task={task} compact />
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                      {task.updatedAt ? formatDate(task.updatedAt) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
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
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setConfirmId(task.id);
                      }}
                      disabled={deletingId === task.id}
                      className="p-1.5 rounded-md transition-colors hover:opacity-80 disabled:opacity-40"
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
          <div className="card p-6 max-w-sm w-full space-y-4">
            <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Delete Task?</h3>
            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              This task will be moved to the deleted list.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 rounded-md text-caption font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(confirmId); setConfirmId(null); }}
                className="px-4 py-2 rounded-md text-caption font-medium transition-colors !text-white"
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
