import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Task, TaskImage, TaskRevisionSuggestion, TaskStatus } from '@/types';
import { useUpdateTask } from '@/hooks/useTasks';
import { taskService } from '@/services/endpoints/taskService';
import { TASK_CATEGORIES } from '@/constants';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

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

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

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
  const [reminderEnabled, setReminderEnabled] = useState(Boolean(task.reminderEnabled));
  const [reminderAt, setReminderAt] = useState(toDateTimeLocalValue(task.reminderAt));
  const [revisionSuggestion, setRevisionSuggestion] = useState<TaskRevisionSuggestion | null>(null);
  const [analyzingRevision, setAnalyzingRevision] = useState(false);
  const [images, setImages] = useState<TaskImage[]>(task.images || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
    setReminderEnabled(Boolean(task.reminderEnabled));
    setReminderAt(toDateTimeLocalValue(task.reminderAt));
    setRevisionSuggestion(null);
    setImages(task.images || []);
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
          reminderEnabled,
          reminderAt: reminderEnabled && reminderAt ? reminderAt : null,
          images,
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;

    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`You can attach up to ${MAX_IMAGES} images.`);
      return;
    }

    files.forEach((file) => {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`"${file.name}" is too large (max 10MB).`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setImages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), name: file.name, url, type: file.type, size: file.size },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
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

            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">
                Images
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleImageSelect}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={handleImageSelect}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload image
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take screenshot
                </button>
              </div>

              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {images.map((img) => (
                    <div key={img.id} className="relative">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="h-16 w-16 object-cover rounded-md border"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center text-xs"
                        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                        aria-label={`Remove ${img.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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

            <div className="rounded-lg border p-3 space-y-3" style={{ borderColor: 'var(--color-border)' }}>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="rounded"
                />
                Enable reminder
              </label>
              <Input
                label="Reminder Time"
                type="datetime-local"
                value={reminderAt}
                onChange={(e) => setReminderAt(e.target.value)}
                disabled={!reminderEnabled}
              />
            </div>
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
