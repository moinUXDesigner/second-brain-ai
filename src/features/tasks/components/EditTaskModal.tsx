import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Task, TaskRevisionSuggestion, TaskStatus } from '@/types';
import { useUpdateTask } from '@/hooks/useTasks';
import { taskService } from '@/services/endpoints/taskService';
import { TASK_CATEGORIES } from '@/constants';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Done', label: 'Done' },
  { value: 'Idea', label: 'Idea' },
  { value: 'Note', label: 'Note' },
  { value: 'Deleted', label: 'Deleted' },
];

const RECURRENCE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Yearly', label: 'Yearly' },
];

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
}

export function EditTaskModal({ task, onClose }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [type, setType] = useState(task.type || 'Task');
  const [area, setArea] = useState(task.area || '');
  const [notes, setNotes] = useState(task.notes || '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [category, setCategory] = useState(task.category || '');
  const [priority, setPriority] = useState(task.priority ?? 0);
  const [urgency, setUrgency] = useState(task.urgency || '');
  const [recurrence, setRecurrence] = useState(task.recurrence || '');
  const [estimatedTime, setEstimatedTime] = useState(task.timeEstimate || '');
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
  const [deadlineDate, setDeadlineDate] = useState(task.deadlineDate ? task.deadlineDate.slice(0, 10) : '');
  const [revisionSuggestion, setRevisionSuggestion] = useState<TaskRevisionSuggestion | null>(null);
  const [analyzingRevision, setAnalyzingRevision] = useState(false);

  const mutation = useUpdateTask();

  useEffect(() => {
    setTitle(task.title);
    setType(task.type || 'Task');
    setArea(task.area || '');
    setNotes(task.notes || '');
    setStatus(task.status);
    setCategory(task.category || '');
    setPriority(task.priority ?? 0);
    setUrgency(task.urgency || '');
    setRecurrence(task.recurrence || '');
    setEstimatedTime(task.timeEstimate || '');
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setDeadlineDate(task.deadlineDate ? task.deadlineDate.slice(0, 10) : '');
    setRevisionSuggestion(null);
  }, [task]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    mutation.mutate(
      {
        id: task.id,
        updates: {
          title: title.trim(),
          type,
          area: area.trim(),
          notes: notes.trim(),
          status,
          category: category.trim(),
          priority: priority || 0,
          urgency: urgency.trim(),
          recurrence: (recurrence || undefined) as Task['recurrence'],
          timeEstimate: estimatedTime.trim(),
          dueDate: dueDate || undefined,
          deadlineDate: deadlineDate || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Task updated');
          onClose();
        },
        onError: () => {
          toast.error('Could not update task');
        },
      },
    );
  };

  const handleAnalyzeNotes = async () => {
    setAnalyzingRevision(true);
    try {
      const res = await taskService.analyzeTaskRevision(task.id, {
        title: title.trim(),
        area: area.trim(),
        notes: notes.trim(),
        category,
        urgency: urgency.trim(),
        priority: priority || 0,
        dueDate: dueDate || undefined,
        timeEstimate: estimatedTime.trim(),
      });
      setRevisionSuggestion(res.data);
      toast.success(res.data.source === 'AI' ? 'AI suggestions ready' : 'Rule-based suggestions ready');
    } catch {
      toast.error('Could not analyze notes');
    } finally {
      setAnalyzingRevision(false);
    }
  };

  const handleApplySuggestions = () => {
    if (!revisionSuggestion) return;

    setPriority(revisionSuggestion.priority);
    setUrgency(revisionSuggestion.urgency);
    setDueDate(revisionSuggestion.dueDate ?? '');
    setEstimatedTime(revisionSuggestion.timeEstimate);
    if (revisionSuggestion.category) setCategory(revisionSuggestion.category);
    toast.success('Suggestions applied');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative z-10 w-full max-w-lg rounded-lg bg-white dark:bg-neutral-800 p-6 shadow-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-h3 text-neutral-900 dark:text-neutral-50">Edit Task</h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
              <Input
                label="Area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <Textarea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />

            <div className="rounded-lg border p-3 space-y-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">AI Revision</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Analyze notes to suggest priority, due date, and time estimate.</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleAnalyzeNotes}
                  isLoading={analyzingRevision}
                  disabled={!notes.trim()}
                >
                  Analyze Notes with AI
                </Button>
              </div>

              {revisionSuggestion && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                      {revisionSuggestion.source} suggestion
                      {typeof revisionSuggestion.confidence === 'number' ? ` - ${Math.round(revisionSuggestion.confidence * 100)}%` : ''}
                    </span>
                    <Button variant="primary" onClick={handleApplySuggestions}>
                      Apply Suggestions
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <SuggestionRow label="Priority" current={String(priority || 0)} suggested={String(revisionSuggestion.priority)} />
                    <SuggestionRow label="Urgency" current={urgency || 'None'} suggested={revisionSuggestion.urgency} />
                    <SuggestionRow label="Due Date" current={dueDate || 'None'} suggested={revisionSuggestion.dueDate || 'None'} />
                    <SuggestionRow label="Time Estimate" current={estimatedTime || 'None'} suggested={revisionSuggestion.timeEstimate || 'None'} />
                    {revisionSuggestion.category && (
                      <SuggestionRow label="Category" current={category || 'None'} suggested={revisionSuggestion.category} />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                options={STATUS_OPTIONS}
              />
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[{ value: '', label: 'None' }, ...TASK_CATEGORIES]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Priority"
                type="number"
                value={priority}
                min={0}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              />
              <Select
                label="Recurrence"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                options={RECURRENCE_OPTIONS}
              />
            </div>

            <Input
              label="Time Estimate"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="e.g. 30m, 2h"
            />

            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <Input
              label="Deadline Date"
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={mutation.isPending}>
              Save
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SuggestionRow({ label, current, suggested }: { label: string; current: string; suggested: string }) {
  const changed = current !== suggested;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-3 py-2" style={{ backgroundColor: 'var(--color-muted)' }}>
      <span className="font-medium text-neutral-600 dark:text-neutral-300">{label}</span>
      <span className="min-w-0 text-right text-neutral-500 dark:text-neutral-400">
        <span className={changed ? 'line-through opacity-70' : undefined}>{current}</span>
        {changed && (
          <>
            <span className="mx-1">-&gt;</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-50">{suggested}</span>
          </>
        )}
      </span>
    </div>
  );
}
