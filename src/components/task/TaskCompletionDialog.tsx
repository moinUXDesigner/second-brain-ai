import { useEffect, useRef, useState } from 'react';
import { useTaskCompletionStore } from '@/app/store/taskCompletionStore';
import { taskService } from '@/services/endpoints/taskService';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/utils/date';

function localDateTime(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function TaskCompletionDialog() {
  const request = useTaskCompletionStore((state) => state.request);
  return request ? <CompletionForm key={request.task.id} /> : null;
}

function CompletionForm() {
  const request = useTaskCompletionStore((state) => state.request)!;
  const { task } = request;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [startedAt, setStartedAt] = useState(task.startedAt ? localDateTime(task.startedAt) : '');
  const [completedAt, setCompletedAt] = useState(localDateTime());
  const [startNotes, setStartNotes] = useState(task.startNotes ?? '');
  const [completionNotes, setCompletionNotes] = useState(task.completionNotes ?? '');
  const [notes, setNotes] = useState(task.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const cancel = () => {
    if (saving) return;
    request.resolve({ success: true, data: task });
    useTaskCompletionStore.setState({ request: null });
  };

  return (
    <dialog ref={dialogRef} aria-labelledby="completion-heading"
      onCancel={(event) => { event.preventDefault(); cancel(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl p-0 shadow-xl backdrop:bg-black/50"
      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
      <form className="max-h-[85vh] space-y-4 overflow-y-auto p-6" onSubmit={async (event) => {
        event.preventDefault();
        if (startedAt && new Date(startedAt) > new Date(completedAt)) {
          setError('Completion must be on or after the start date.');
          return;
        }
        setSaving(true);
        setError('');
        try {
          const response = await taskService.completeTask(task.id, {
            startedAt: startedAt ? new Date(startedAt).toISOString() : null,
            completedAt: new Date(completedAt).toISOString(),
            startNotes, completionNotes, notes,
          });
          request.resolve(response);
          useTaskCompletionStore.setState({ request: null });
        } catch {
          setError('Could not save completion details. Please try again.');
          setSaving(false);
        }
      }}>
        <h2 id="completion-heading" className="text-h3">Complete task</h2>
        <p className="font-medium break-words">{task.title}</p>
        <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
          Created: {task.createdAt ? formatDateTime(task.createdAt) : 'Not recorded'}
        </p>
        <fieldset disabled={saving} className="space-y-4">
          <Input id="completion-start" label="Started on (optional)" type="datetime-local" value={startedAt} onChange={(event) => setStartedAt(event.target.value)} />
          <Textarea id="completion-start-input" label="Input when started (optional)" value={startNotes} onChange={(event) => setStartNotes(event.target.value)} maxLength={10000} className="min-h-[70px]" />
          <Input id="completion-date" label="Completed on" type="datetime-local" required value={completedAt} onChange={(event) => setCompletedAt(event.target.value)} />
          <Textarea id="completion-input" label="Input when completed (optional)" value={completionNotes} onChange={(event) => setCompletionNotes(event.target.value)} maxLength={10000} className="min-h-[70px]" />
          <Textarea id="completion-notes" label="Task notes (optional)" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={10000} className="min-h-[70px]" />
        </fieldset>
        {error && <p role="alert" className="text-sm text-danger-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={cancel}>Cancel</Button>
          <Button type="submit" isLoading={saving}>Save & complete</Button>
        </div>
      </form>
    </dialog>
  );
}
