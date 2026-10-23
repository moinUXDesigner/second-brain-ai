import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useProjects } from '@/hooks/useProjects';
import { taskService } from '@/services/endpoints/taskService';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import toast from 'react-hot-toast';
import type { Task } from '@/types';

interface LinkToProjectModalProps {
  task: Task;
  onClose: () => void;
}

export function LinkToProjectModal({ task, onClose }: LinkToProjectModalProps) {
  const { data: projects, isLoading } = useProjects();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState(task.projectId || '');
  const [linking, setLinking] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const close = () => { if (!submitting.current) onClose(); };
  const [searchQuery, setSearchQuery] = useState('');

  const activeProjects = projects?.filter(p => p.status === 'Active') || [];
  
  const filteredProjects = searchQuery
    ? activeProjects.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.domain?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeProjects;

  const handleLink = async () => {
    if (submitting.current || selectedProjectId === task.projectId) return;
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    if (submitting.current) return;
    submitting.current = true;
    setError('');
    setLinking(true);
    try {
      await taskService.linkTaskToProject(task.id, selectedProjectId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.smartTodayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      toast.success(task.projectId ? 'Task moved to project' : 'Task linked to project');
      onClose();
    } catch {
      setError('Failed to move task. Please try again.');
    } finally {
      submitting.current = false;
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setError('');
    setLinking(true);
    try {
      await taskService.linkTaskToProject(task.id, '');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.smartTodayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      toast.success('Task unlinked from project');
      onClose();
    } catch {
      setError('Failed to unlink task. Please try again.');
    } finally {
      submitting.current = false;
      setLinking(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={close}
    >
      <div 
        className="card p-6 max-w-md w-full space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>
          {task.projectId ? 'Move task to project' : 'Link task to project'}
        </h3>
        
        <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
          {task.title}
        </p>

        {task.projectId && <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
          Moving clears the current phase and milestone. Assign new ones in the destination project.
        </p>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: 'var(--color-muted-fg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="input-base pl-9 text-sm h-9 w-full"
          />
        </div>

        {/* Project List */}
        <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-2" style={{ borderColor: 'var(--color-border)' }}>
          {isLoading ? (
            <div className="text-center py-4 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-4 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              No projects found
            </div>
          ) : (
            filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                disabled={linking || project.id === task.projectId}
                className="w-full text-left px-3 py-2 rounded-md transition-colors"
                style={{
                  backgroundColor: selectedProjectId === project.id ? 'var(--primary-50)' : 'transparent',
                  color: selectedProjectId === project.id ? 'var(--primary-700)' : 'var(--color-text)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{project.title}</p>
                    {project.domain && (
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {project.domain}
                      </p>
                    )}
                  </div>
                  {selectedProjectId === project.id && (
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-2">
          <div>
            {task.projectId && (
              <button
                onClick={handleUnlink}
                disabled={linking}
                className="px-4 py-2 rounded-md text-caption font-medium transition-colors"
                style={{ color: 'var(--color-danger, #ef4444)' }}
              >
                Unlink
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={close}
              className="px-4 py-2 rounded-md text-caption font-medium transition-colors"
              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleLink}
              disabled={linking || !selectedProjectId || selectedProjectId === task.projectId}
              className="px-4 py-2 rounded-md text-caption font-medium transition-colors !text-white disabled:opacity-40"
              style={{ backgroundColor: 'var(--primary-600)' }}
            >
              {linking ? 'Saving...' : task.projectId ? 'Move' : 'Link'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
