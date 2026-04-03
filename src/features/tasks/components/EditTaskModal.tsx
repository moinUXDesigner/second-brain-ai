import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Task, TaskStatus } from '@/types';
import { useUpdateTask } from '@/hooks/useTasks';
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
  const [priority, setPriority] = useState(task.priority ?? 0);
  const [urgency, setUrgency] = useState(task.urgency || '');
  const [recurrence, setRecurrence] = useState(task.recurrence || '');
  const [estimatedTime, setEstimatedTime] = useState(task.timeEstimate || '');
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');

  const mutation = useUpdateTask();

  useEffect(() => {
    setTitle(task.title);
    setType(task.type || 'Task');
    setArea(task.area || '');
    setNotes(task.notes || '');
    setStatus(task.status);
    setPriority(task.priority ?? 0);
    setUrgency(task.urgency || '');
    setRecurrence(task.recurrence || '');
    setEstimatedTime(task.timeEstimate || '');
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
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
          priority: priority || 0,
          urgency: urgency.trim(),
          recurrence: (recurrence || undefined) as Task['recurrence'],
          timeEstimate: estimatedTime.trim(),
          dueDate: dueDate || undefined,
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

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                options={STATUS_OPTIONS}
              />
              <Input
                label="Priority"
                type="number"
                value={priority}
                min={0}
                max={10}
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
