import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { inputService } from '@/services/endpoints/inputService';
import { useAudit } from '@/hooks/useAudit';
import { QUERY_KEYS } from '@/constants';
import type { Task, Project } from '@/types';
import { StepIndicator } from './components/StepIndicator';
import { StepInput } from './components/StepInput';
import { StepAIReview } from './components/StepAIReview';
import { StepConfirm } from './components/StepConfirm';

export interface WizardData {
  text: string;
  type: 'task' | 'project';
  area: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  estimatedTime: string;
  linkedProjectId?: string;
  subtasks?: string[];
}

const STEP_LABELS = ['Input', 'Review', 'Done'];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export function CreateFlowPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { log } = useAudit();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [wizardData, setWizardData] = useState<WizardData>({
    text: '',
    type: 'task',
    area: '',
    category: 'Deep Work',
    priority: 'Medium',
    estimatedTime: '1 hour',
  });

  // Result after creation
  const [createdTask, setCreatedTask] = useState<Task | null>(null);
  const [createdProject, setCreatedProject] = useState<Project | null>(null);

  const completedSteps = new Set<number>();
  for (let i = 1; i < step; i++) completedSteps.add(i);
  // Step 3 is "completed" only after submission
  if (step === 3 && (createdTask || createdProject)) completedSteps.add(3);

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const update = (partial: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...partial }));
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const res = await inputService.createTaskOrProject({
        text: wizardData.text,
        type: wizardData.type,
        area: wizardData.area || undefined,
        category: wizardData.category,
        priority: wizardData.priority,
        estimatedTime: wizardData.estimatedTime,
        subtasks: wizardData.subtasks,
      });

      if (wizardData.type === 'task' && res.data.task) {
        setCreatedTask(res.data.task);
        await log('CREATE_TASK', 'task', res.data.task.id, {
          text: wizardData.text,
          category: wizardData.category,
          priority: wizardData.priority,
          area: wizardData.area,
        });
        toast.success('Task Created');
      } else if (wizardData.type === 'project' && res.data.project) {
        setCreatedProject(res.data.project);
        await log('CREATE_PROJECT', 'project', res.data.project.id, {
          text: wizardData.text,
          category: wizardData.category,
          priority: wizardData.priority,
          area: wizardData.area,
        });
        toast.success('Project Created');
      }

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });

      // Move to confirm step
      setDirection(1);
      setStep(3);
    } catch {
      toast.error('Failed to create. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    if (wizardData.type === 'project') {
      navigate('/projects');
    } else {
      navigate('/tasks');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="flex-1 flex flex-col overflow-y-auto w-full max-w-lg mx-auto">
        {/* Back arrow */}
        {step < 3 && (
        <div className="px-4 pt-4 shrink-0">
          <button
            onClick={step === 1 ? () => navigate(-1) : goBack}
            className="p-2 -ml-2 rounded-md transition-colors"
            style={{ color: 'var(--color-text)' }}
            aria-label="Go back"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        )}

        {/* Step indicator */}
        <div className="px-6 pt-2 pb-6 shrink-0">
          <StepIndicator
            currentStep={step}
            labels={STEP_LABELS}
            completedSteps={completedSteps}
          />
        </div>

        {/* Step content */}
        <div className="flex-1 px-6 pb-6 flex flex-col min-h-0">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex-1 flex flex-col"
            >
            {step === 1 && (
              <StepInput
                text={wizardData.text}
                area={wizardData.area}
                onChange={update}
                onNext={goNext}
              />
            )}
            {step === 2 && (
              <StepAIReview
                data={wizardData}
                onChange={update}
                onBack={goBack}
                onCreate={handleCreate}
                submitting={submitting}
              />
            )}
            {step === 3 && (
              <StepConfirm
                data={wizardData}
                task={createdTask}
                project={createdProject}
                onDone={handleDone}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
