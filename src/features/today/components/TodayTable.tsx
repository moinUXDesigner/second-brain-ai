import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task, TaskStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { EditTaskModal } from '@/features/tasks/components/EditTaskModal';
import { TASK_CATEGORIES, PRIORITY_COLORS } from '@/constants';
import { cn } from '@/utils/cn';

function getPriorityVariant(priority?: number) {
  if (!priority) return PRIORITY_COLORS.normal;
  if (priority >= 8) return PRIORITY_COLORS.critical;
  if (priority >= 5) return PRIORITY_COLORS.important;
  return PRIORITY_COLORS.normal;
}

function getCategoryStyle(category?: string) {
  return TASK_CATEGORIES.find((c) => c.value === category)?.color ?? 'bg-neutral-100 text-neutral-600';
}

interface TodayTableProps {
  tasks: Task[];
  localStatus: Record<string, TaskStatus>;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

type TodayTableSortKey = 'title' | 'category' | 'priority' | 'fitScore' | 'timeEstimate' | 'status' | 'projectName' | 'area';
type SortDirection = 'asc' | 'desc';

const PRIORITY_FILTER_OPTIONS = [
  { label: 'All', value: 'All' },
  { label: '1-3', value: '1-3' },
  { label: '4-6', value: '4-6' },
  { label: '7-9', value: '7-9' },
  { label: '10', value: '10' },
];

export function TodayTable({ tasks, localStatus, onStatusChange }: TodayTableProps) {
  const navigate = useNavigate();
  const [filterText, setFilterText] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'All' | TaskStatus>('All');
  const [filterPriority, setFilterPriority] = useState<'All' | '1-3' | '4-6' | '7-9' | '10'>('All');
  const [filterArea, setFilterArea] = useState('All');

  const [sortBy, setSortBy] = useState<TodayTableSortKey>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const getStatus = useCallback(
    (task: Task): TaskStatus => localStatus[task.id] ?? task.status,
    [localStatus],
  );

  const getSortValue = (task: Task, key: TodayTableSortKey) => {
    switch (key) {
      case 'title':
        return task.title?.toLowerCase() ?? '';
      case 'category':
        return task.category?.toLowerCase() ?? '';
      case 'projectName':
        return task.projectName?.toLowerCase() ?? '';
      case 'area':
        return task.area?.toLowerCase() ?? '';
      case 'priority':
        return task.priority ?? 0;
      case 'fitScore':
        return task.fitScore ?? 0;
      case 'timeEstimate':
        return task.timeEstimate ?? '';
      case 'status':
        return getStatus(task).toLowerCase();
      default:
        return '';
    }
  };

  const filteredTasks = useMemo(() => {
    const t = tasks.filter((task) => {
      const status = getStatus(task);
      if (filterStatus !== 'All' && status !== filterStatus) return false;
      if (filterCategory !== 'All' && task.category !== filterCategory) return false;
      if (filterArea !== 'All' && task.area !== filterArea) return false;
      if (filterPriority !== 'All') {
        if (task.priority == null) return false;
        const p = task.priority;
        if (filterPriority === '1-3' && (p < 1 || p > 3)) return false;
        if (filterPriority === '4-6' && (p < 4 || p > 6)) return false;
        if (filterPriority === '7-9' && (p < 7 || p > 9)) return false;
        if (filterPriority === '10' && p !== 10) return false;
      }
      if (filterText.trim()) {
        const text = filterText.toLowerCase();
        const haystack = [task.title, task.category, task.projectName, task.area, status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(text)) return false;
      }
      return true;
    });

    const sorted = [...t].sort((a, b) => {
      const av = getSortValue(a, sortBy);
      const bv = getSortValue(b, sortBy);

      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDirection === 'asc' ? av - bv : bv - av;
      }

      const sa = String(av);
      const sb = String(bv);
      if (sa < sb) return sortDirection === 'asc' ? -1 : 1;
      if (sa > sb) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [tasks, getStatus, filterText, filterCategory, filterStatus, filterPriority, filterArea, sortBy, sortDirection]);

  const handleSort = (column: TodayTableSortKey) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (column: TodayTableSortKey) => {
    if (sortBy !== column) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const renderSortableHeader = (column: TodayTableSortKey, label: string) => (
    <button
      type="button"
      onClick={() => handleSort(column)}
      className="inline-flex items-center gap-1 text-left font-medium text-neutral-500 hover:text-neutral-700"
    >
      {label}
      <span className="text-xs">{getSortIndicator(column)}</span>
    </button>
  );

  // Modal state for editing
  const [editTask, setEditTask] = useState<Task | null>(null);
  // Modal state for convert
  const [convertTask, setConvertTask] = useState<Task | null>(null);

  const editTaskModal = editTask ? (
    <EditTaskModal
      task={editTask}
      onClose={() => setEditTask(null)}
    />
  ) : null;

  const categories = Array.from(new Set(tasks.map((task) => task.category ?? '').filter(Boolean))).sort();
  const areas = Array.from(new Set(tasks.map((task) => task.area ?? '').filter(Boolean))).sort();

  const filterControls = (
    <div className="card p-3 mb-4">
      <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-5">
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Search all columns..."
          className="input w-full"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="select w-full"
        >
          <option value="All">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'All' | TaskStatus)}
          className="select w-full"
        >
          <option value="All">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Idea">Idea</option>
          <option value="Note">Note</option>
          <option value="Done">Done</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as 'All' | '1-3' | '4-6' | '7-9' | '10')}
          className="select w-full"
        >
          {PRIORITY_FILTER_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <select
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
          className="select w-full"
        >
          <option value="All">All areas</option>
          {areas.map((area) => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-caption text-neutral-500">
        Showing {filteredTasks.length} of {tasks.length}
      </p>
    </div>
  );

  const ConvertTaskModal = convertTask ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Convert Task to Project</h2>
        <p className="mb-4">Do you want to convert this task to a project with AI-generated subtasks?</p>
        <button
          className="btn btn-primary mr-2"
          onClick={() => {
            if (convertTask) {
              onStatusChange(convertTask.id, 'Done');
              navigate('/create', {
                state: {
                  skipStep1: true,
                  text: convertTask.title,
                  area: convertTask.area,
                  type: 'project',
                },
              });
            }
            setConvertTask(null);
          }}
        >
          Convert
        </button>
        <button className="btn btn-secondary" onClick={() => setConvertTask(null)}>Cancel</button>
      </div>
    </div>
  ) : null;

  if (tasks.length === 0) {
    return (
      <>
        {filterControls}
        <div className="card p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-body text-neutral-500 mt-4">No tasks for today</p>
          <p className="text-caption text-neutral-400">Use the input module to create tasks</p>
        </div>
      </>
    );
  }

  const StatusSelect = ({ task }: { task: Task }) => {
    const status = getStatus(task);
    return (
      <select
        value={status}
        onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
        className={cn(
          'rounded-md border px-1.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer',
          status === 'Done'
            ? 'bg-success-50 text-success-700 border-success-200'
            : status === 'Idea'
            ? 'bg-primary-50 text-primary-700 border-primary-200'
            : status === 'Note'
            ? 'bg-neutral-100 text-neutral-700 border-neutral-200'
            : 'bg-warning-50 text-warning-700 border-warning-200',
        )}
      >
        <option value="Pending">Pending</option>
        <option value="Done">Done</option>
        <option value="Idea">Idea</option>
        <option value="Note">Note</option>
      </select>
    );
  };

  return (
    <>
      {filterControls}
      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {filteredTasks.map((task) => {
          const status = getStatus(task);
          const priorityStyle = getPriorityVariant(task.priority);
          return (
            <div key={task.id} className={cn('card p-4 space-y-2', status === 'Done' && 'opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={cn('text-body font-medium text-neutral-900 dark:text-neutral-50 truncate', status === 'Done' && 'line-through')}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {task.projectName && (
                      <Badge className="!text-[10px] !px-1.5 !py-0.5">{task.projectName}</Badge>
                    )}
                    {task.area && (
                      <span className="text-caption text-neutral-400">{task.area}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <StatusSelect task={task} />
                  <div className="flex gap-1 mt-1">
                    <button
                      className="btn btn-xs btn-outline p-1"
                      onClick={() => setEditTask(task)}
                      title="Edit task"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      className="btn btn-xs btn-outline p-1"
                      onClick={() => setConvertTask(task)}
                      title="Convert to project"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-caption">
                {task.category && (
                  <Badge className={cn(getCategoryStyle(task.category), '!text-[10px] !px-1.5 !py-0.5')}>{task.category}</Badge>
                )}
                {task.priority != null && (
                  <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold', priorityStyle.bg, priorityStyle.text)}>
                    P{task.priority}
                  </span>
                )}
                {task.fitScore != null && (
                  <span className="text-neutral-500">Fit: {task.fitScore}%</span>
                )}
                <span className="text-neutral-400">{task.timeEstimate ?? '\u2014'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table layout */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-semantic-border bg-neutral-50 dark:bg-neutral-800/50">
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">{renderSortableHeader('title', 'Task')}</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">{renderSortableHeader('category', 'Category')}</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">{renderSortableHeader('priority', 'Priority')}</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">{renderSortableHeader('fitScore', 'Fit Score')}</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">{renderSortableHeader('timeEstimate', 'Time')}</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">{renderSortableHeader('status', 'Status')}</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-semantic-border">
              {filteredTasks.map((task) => {
                const status = getStatus(task);
                const priorityStyle = getPriorityVariant(task.priority);
                return (
                  <tr key={task.id} className={cn('transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/30', status === 'Done' && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <p className={cn('text-body font-medium text-neutral-900 dark:text-neutral-50', status === 'Done' && 'line-through')}>{task.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {task.projectName && (
                          <Badge className="!text-[10px] !px-1.5 !py-0.5">{task.projectName}</Badge>
                        )}
                        {task.area && <span className="text-caption text-neutral-400">{task.area}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {task.category && (
                        <Badge className={cn(getCategoryStyle(task.category), '!text-[10px] !px-1.5 !py-0.5')}>
                          {task.category}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {task.priority != null && (
                      <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold', priorityStyle.bg, priorityStyle.text)}>
                          {task.priority}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {task.fitScore != null && (
                        <span className="text-body text-neutral-700 dark:text-neutral-300">{task.fitScore}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-caption text-neutral-500">{task.timeEstimate ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelect task={task} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          className="btn btn-xs btn-outline p-1"
                          onClick={() => setEditTask(task)}
                          title="Edit task"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="btn btn-xs btn-outline p-1"
                          onClick={() => setConvertTask(task)}
                          title="Convert to project"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {editTaskModal}
      {ConvertTaskModal}
    </>
  );
}
