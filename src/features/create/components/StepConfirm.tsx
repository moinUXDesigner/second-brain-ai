import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useProjects } from '@/hooks/useProjects';
import { taskService } from '@/services/endpoints/taskService';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import type { Task, Project } from '@/types';
import type { WizardData } from '../CreateFlowPage';

interface StepConfirmProps {
  data: WizardData;
  task: Task | null;
  project: Project | null;
  onDone: () => void;
}

export function StepConfirm({ data, task, project, onDone }: StepConfirmProps) {
  const isProject = data.type === 'project';
  const title = isProject
    ? project?.title || data.text
    : task?.title || data.text;
  const subtasks = project?.subtasks || [];

  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null);
  const [linkedProjectName, setLinkedProjectName] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const { data: projects } = useProjects();
  const queryClient = useQueryClient();

  const handleLinkToProject = async (proj: Project) => {
    if (!task) return;
    setLinking(true);
    try {
      await taskService.linkTaskToProject(task.id, proj.id);
      setLinkedProjectId(proj.id);
      setLinkedProjectName(proj.title);
      setShowProjectPicker(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
    } catch {
      // silently handle
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center text-center space-y-6 pt-4">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--primary-100)' }}
        >
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            style={{ color: 'var(--primary-600)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-h2 font-semibold"
          style={{ color: 'var(--color-text)' }}
        >
          {isProject ? 'Project' : 'Task'} Created Successfully!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-body font-medium max-w-xs"
          style={{ color: 'var(--color-text)' }}
        >
          {title}
        </motion.p>

        {/* Project subtasks */}
        {isProject && subtasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full text-left space-y-3"
          >
            <h3
              className="text-body font-semibold"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              AI Subtasks
            </h3>
            <div className="space-y-2">
              {subtasks.map((st, i) => (
                <div
                  key={st.id || i}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                  style={{ backgroundColor: 'var(--color-muted)' }}
                >
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full shrink-0"
                    style={{ backgroundColor: 'var(--primary-100)' }}
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                      style={{ color: 'var(--primary-600)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-body" style={{ color: 'var(--color-text)' }}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Task details */}
        {!isProject && task && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full text-left space-y-3"
          >
            <h3
              className="text-body font-semibold"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Task Details
            </h3>
            <div
              className="rounded-lg px-4 py-3 space-y-2"
              style={{ backgroundColor: 'var(--color-muted)' }}
            >
              {data.area && (
                <div className="flex justify-between text-caption">
                  <span style={{ color: 'var(--color-muted-fg)' }}>Area</span>
                  <span style={{ color: 'var(--color-text)' }}>{data.area}</span>
                </div>
              )}
              <div className="flex justify-between text-caption">
                <span style={{ color: 'var(--color-muted-fg)' }}>Category</span>
                <span style={{ color: 'var(--color-text)' }}>{data.category}</span>
              </div>
              <div className="flex justify-between text-caption">
                <span style={{ color: 'var(--color-muted-fg)' }}>Priority</span>
                <span style={{ color: 'var(--color-text)' }}>{data.priority}</span>
              </div>
              <div className="flex justify-between text-caption">
                <span style={{ color: 'var(--color-muted-fg)' }}>Estimated Time</span>
                <span style={{ color: 'var(--color-text)' }}>{data.estimatedTime}</span>
              </div>
              {data.recurrence && (
                <div className="flex justify-between text-caption">
                  <span style={{ color: 'var(--color-muted-fg)' }}>Recurrence</span>
                  <span style={{ color: 'var(--color-text)' }}>{data.recurrence}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Connect to Project — only for tasks */}
        {!isProject && task && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full text-left space-y-3"
          >
            {linkedProjectId ? (
              <div
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ backgroundColor: 'var(--color-muted)' }}
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--primary-600)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-caption font-medium" style={{ color: 'var(--color-text)' }}>Connected to project</p>
                  <p className="text-caption truncate" style={{ color: 'var(--primary-600)' }}>{linkedProjectName}</p>
                </div>
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: 'var(--color-success, #22c55e)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowProjectPicker(!showProjectPicker)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-caption font-medium transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--color-muted)',
                    color: 'var(--primary-600)',
                    border: '1px dashed var(--color-border)',
                  }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Connect to Project
                </button>

                <AnimatePresence>
                  {showProjectPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="rounded-lg border overflow-hidden"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                      >
                        {!projects || projects.length === 0 ? (
                          <div className="px-4 py-6 text-center">
                            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>No projects available</p>
                          </div>
                        ) : (
                          <div className="max-h-48 overflow-y-auto">
                            {projects.map((proj) => (
                              <button
                                key={proj.id}
                                onClick={() => handleLinkToProject(proj)}
                                disabled={linking}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:opacity-80 disabled:opacity-40"
                                style={{ borderBottom: '1px solid var(--color-border)' }}
                              >
                                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)' }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <p className="text-caption font-medium truncate" style={{ color: 'var(--color-text)' }}>{proj.title}</p>
                                  <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                                    {proj.subtasks?.length || 0} tasks · {proj.progress}%
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}

        {/* Project page link */}
        {isProject && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full text-left"
          >
            <h3
              className="text-body font-semibold mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Project Page
            </h3>
            <div
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: 'var(--color-muted)' }}
            >
              <div
                className="flex h-5 w-5 items-center justify-center rounded shrink-0"
                style={{ backgroundColor: 'var(--primary-500)', color: '#fff' }}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-body" style={{ color: 'var(--color-text)' }}>
                {title}
              </span>
              {data.area && (
                <span
                  className="ml-auto text-caption"
                  style={{ color: 'var(--color-muted-fg)' }}
                >
                  for {data.area.toLowerCase()}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Done button */}
      <div className="pt-4">
        <Button className="w-full" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
