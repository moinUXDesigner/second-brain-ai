import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Task, TaskStatus } from '@/types';
import { useUpdateTask } from '@/hooks/useTasks';

const STATUS_OPTIONS: TaskStatus[] = ['Pending', 'Done', 'Idea', 'Note', 'Deleted'];

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
  }, [task]);

  const handleSave = async () => {
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
          recurrence: recurrence as Task['recurrence'],
          timeEstimate: estimatedTime.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg dark:bg-neutral-900">
        <h2 className="text-xl font-bold mb-4">Edit Task</h2>
        <div className="grid grid-cols-1 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Type
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input w-full"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Area
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="input w-full"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="textarea h-24 w-full"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="select w-full">
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Priority
              <input
                type="number"
                value={priority}
                min={0}
                max={10}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="input w-full"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Urgency
              <input
                type="text"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="input w-full"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Recurrence
              <input
                type="text"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="input w-full"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Time Estimate
            <input
              type="text"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className="input w-full"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
