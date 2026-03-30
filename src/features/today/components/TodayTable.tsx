import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task, TaskStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
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

export function TodayTable({ tasks, localStatus, onStatusChange }: TodayTableProps) {
  const navigate = useNavigate();
  const getStatus = useCallback(
    (task: Task): TaskStatus => localStatus[task.id] ?? task.status,
    [localStatus],
  );

  // Modal state for editing
  const [editTask, setEditTask] = useState<Task | null>(null);
  // Modal state for convert
  const [convertTask, setConvertTask] = useState<Task | null>(null);

  // Stub: Replace with actual modal/component
  const EditTaskModal = editTask ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Edit Task</h2>
        <p className="mb-4">(Task editing form goes here)</p>
        <button className="btn btn-primary mr-2" onClick={() => setEditTask(null)}>Save</button>
        <button className="btn btn-secondary" onClick={() => setEditTask(null)}>Cancel</button>
      </div>
    </div>
  ) : null;

  const ConvertTaskModal = convertTask ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Convert Task to Project</h2>
        <p className="mb-4">Do you want to convert this task to a project with AI-generated subtasks?</p>
        <button
          className="btn btn-primary mr-2"
          onClick={() => {
            if (convertTask) {
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
      <div className="card p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-body text-neutral-500 mt-4">No tasks for today</p>
        <p className="text-caption text-neutral-400">Use the input module to create tasks</p>
      </div>
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
      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {tasks.map((task) => {
          const status = getStatus(task);
          const priorityStyle = getPriorityVariant(task.priority);
          return (
            <div key={task.id} className={cn('card p-4 space-y-2', status === 'Done' && 'opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={cn('text-body font-medium text-neutral-900 dark:text-neutral-50 truncate', status === 'Done' && 'line-through')}>
                    {task.title}
                  </p>
                  {task.projectName && (
                    <p className="text-caption text-primary-600">Project: {task.projectName}</p>
                  )}
                  {task.area && <p className="text-caption text-neutral-400">{task.area}</p>}
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
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Task</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Fit Score</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-caption font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-semantic-border">
              {tasks.map((task) => {
                const status = getStatus(task);
                const priorityStyle = getPriorityVariant(task.priority);
                return (
                  <tr key={task.id} className={cn('transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/30', status === 'Done' && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <p className={cn('text-body font-medium text-neutral-900 dark:text-neutral-50', status === 'Done' && 'line-through')}>{task.title}</p>
                      {task.projectName && (
                        <p className="text-caption text-primary-600">Project: {task.projectName}</p>
                      )}
                      {task.area && <p className="text-caption text-neutral-400">{task.area}</p>}
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
      {EditTaskModal}
      {ConvertTaskModal}
    </>
  );
}
