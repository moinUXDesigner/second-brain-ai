import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import type { Task, TaskImage } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatDateRelative } from '@/utils/dateFormat';
import { formatAiTime, formatDuration } from '@/utils/time';
import { useUpdateTask } from '@/hooks/useTasks';

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface TaskViewModalProps {
  task: Task;
  onClose: () => void;
}

function display(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Not set';
  return String(value);
}

function formatDateDetail(value?: string) {
  if (!value) return 'Not set';

  const relative = formatDateRelative(value);
  const date = formatDate(value);

  if (relative === date) return date;
  return `${relative} (${date})`;
}

function statusVariant(status: Task['status']) {
  if (status === 'Done') return 'success';
  if (status === 'Deleted') return 'danger';
  if (status === 'Idea' || status === 'Note') return 'primary';
  return 'default';
}

function urgencyVariant(urgency?: string) {
  if (urgency === 'High') return 'danger';
  if (urgency === 'Medium') return 'warning';
  return 'default';
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md px-3 py-2" style={{ backgroundColor: 'var(--color-muted)' }}>
      <dt className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </dt>
      <dd className="mt-1 text-sm break-words" style={{ color: 'var(--color-text)' }}>
        {value}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

type CarouselImage = {
  id: string;
  name: string;
  url?: string;
  size?: number;
  type?: string;
  legacy?: boolean;
};

const IMAGE_URL_PATTERN = /(https?:\/\/[^\s)]+?\.(?:png|jpe?g|gif|webp|bmp|svg)(?:\?[^\s)]*)?|data:image\/[a-zA-Z0-9.+-]+;base64,[^\s)]+)/gi;
const LEGACY_IMAGE_NOTE_PATTERN = /^Image:\s*(.+)$/gim;

function isImageRecord(value: unknown): value is TaskImage {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'url' in value &&
      typeof (value as TaskImage).url === 'string' &&
      (value as TaskImage).url.trim(),
  );
}

function formatImageSize(size?: number) {
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getTaskImages(task: Task): CarouselImage[] {
  const images: CarouselImage[] = [];
  const seen = new Set<string>();

  (task.images ?? []).forEach((image, index) => {
    if (isImageRecord(image)) {
      const key = image.url;
      if (seen.has(key)) return;
      seen.add(key);
      images.push({
        id: image.id || `${task.id}-image-${index}`,
        name: image.name || `Image ${index + 1}`,
        url: image.url,
        size: image.size,
        type: image.type,
      });
    }
  });

  Array.from(task.notes?.matchAll(IMAGE_URL_PATTERN) ?? []).forEach((match, index) => {
    const url = match[0];
    if (seen.has(url)) return;
    seen.add(url);
    images.push({
      id: `${task.id}-note-url-${index}`,
      name: `Image ${images.length + 1}`,
      url,
    });
  });

  Array.from(task.notes?.matchAll(LEGACY_IMAGE_NOTE_PATTERN) ?? []).forEach((match, index) => {
    const label = match[1]?.trim();
    if (!label || seen.has(label)) return;
    seen.add(label);
    images.push({
      id: `${task.id}-legacy-image-${index}`,
      name: label,
      legacy: true,
    });
  });

  return images;
}

function ImageCarousel({
  images,
  removableIds,
  onRemove,
}: {
  images: CarouselImage[];
  removableIds?: Set<string>;
  onRemove?: (id: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];
  const hasMultipleImages = images.length > 1;
  const canRemoveActive = Boolean(onRemove && activeImage && removableIds?.has(activeImage.id));

  useEffect(() => {
    setActiveIndex(0);
  }, [images.length]);

  if (!activeImage) return null;

  const showPrevious = () => setActiveIndex((index) => (index - 1 + images.length) % images.length);
  const showNext = () => setActiveIndex((index) => (index + 1) % images.length);

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-md border" style={{ borderColor: 'var(--color-border)' }}>
        <div className="relative flex min-h-[260px] items-center justify-center" style={{ backgroundColor: 'var(--color-muted)' }}>
          {activeImage.url ? (
            <img
              src={activeImage.url}
              alt={activeImage.name}
              className="max-h-[420px] w-full object-contain"
            />
          ) : (
            <div className="flex min-h-[260px] w-full flex-col items-center justify-center gap-2 px-6 text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--primary-600)' }}
                aria-hidden="true"
              >
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5l4.5-4.5 3.75 3.75L15 12l6 6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zm3 4h.01" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {activeImage.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                This older attachment only has a saved filename.
              </p>
            </div>
          )}

          {canRemoveActive && (
            <button
              type="button"
              onClick={() => onRemove?.(activeImage.id)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              aria-label="Remove image"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full shadow-sm transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                aria-label="Previous image"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={showNext}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full shadow-sm transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                aria-label="Next image"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-3 py-2" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {activeImage.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {activeImage.legacy ? 'Filename only' : formatImageSize(activeImage.size) || activeImage.type || 'Image'}
            </p>
          </div>
          {hasMultipleImages && (
            <span className="shrink-0 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {activeIndex + 1}/{images.length}
            </span>
          )}
        </div>

        {hasMultipleImages && (
          <div className="flex gap-2 overflow-x-auto px-3 py-2" style={{ borderTop: '1px solid var(--color-border)' }}>
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="h-12 w-16 shrink-0 overflow-hidden rounded border text-[10px] font-medium"
                style={{
                  borderColor: index === activeIndex ? 'var(--primary-600)' : 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-muted)',
                }}
                aria-label={`Show image ${index + 1}`}
              >
                {image.url ? (
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center px-1">Image</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskViewModal({ task, onClose }: TaskViewModalProps) {
  const [localImages, setLocalImages] = useState<TaskImage[]>(task.images || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mutation = useUpdateTask();

  useEffect(() => {
    setLocalImages(task.images || []);
  }, [task]);

  const taskImages = useMemo(
    () => getTaskImages({ ...task, images: localImages }),
    [task, localImages],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const saveImages = (images: TaskImage[]) => {
    setLocalImages(images);
    mutation.mutate(
      { id: task.id, updates: { images } },
      { onError: () => toast.error('Could not save image') },
    );
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;

    if (localImages.length + files.length > MAX_IMAGES) {
      toast.error(`You can attach up to ${MAX_IMAGES} images.`);
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`"${file.name}" is too large (max 10MB).`);
        return false;
      }
      return true;
    });
    if (!validFiles.length) return;

    const newImages = await Promise.all(
      validFiles.map(
        (file) =>
          new Promise<TaskImage>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              resolve({
                id: crypto.randomUUID(),
                name: file.name,
                url: ev.target?.result as string,
                type: file.type,
                size: file.size,
              });
            };
            reader.readAsDataURL(file);
          }),
      ),
    );

    saveImages([...localImages, ...newImages]);
  };

  const handleRemoveImage = (id: string) => {
    saveImages(localImages.filter((img) => img.id !== id));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-view-title"
      onClick={onClose}
    >
      <div
        className="card max-h-[90vh] w-full max-w-3xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-4 px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="task-view-title" className="text-xl font-bold leading-tight" style={{ color: 'var(--color-text)' }}>
                View Task
              </h2>
              <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
              {task.urgency && <Badge variant={urgencyVariant(task.urgency)}>{task.urgency}</Badge>}
            </div>
            <p className="text-base font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
              {task.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Close task details"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-5 space-y-5">
          <Section title="Overview">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="Type" value={display(task.type)} />
              <DetailRow label="Area" value={display(task.area)} />
              <DetailRow label="Project" value={display(task.projectName)} />
              <DetailRow label="Phase" value={display(task.phaseName || task.phaseId)} />
              <DetailRow label="Milestone" value={display(task.milestoneName || task.milestoneId)} />
              <DetailRow label="Status" value={<Badge variant={statusVariant(task.status)}>{task.status}</Badge>} />
              <DetailRow label="Priority" value={display(task.priority)} />
              <DetailRow label="Urgency" value={task.urgency ? <Badge variant={urgencyVariant(task.urgency)}>{task.urgency}</Badge> : 'Not set'} />
            </dl>
          </Section>

          <Section title="Scoring">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="Impact" value={display(task.impact)} />
              <DetailRow label="Effort" value={display(task.effort)} />
              <DetailRow label="Fit Score" value={display(task.fitScore)} />
              <DetailRow label="Confidence" value={display(task.confidence)} />
              <DetailRow label="Category" value={display(task.category)} />
              <DetailRow label="Maslow" value={display(task.maslow)} />
            </dl>
          </Section>

          <Section title="Schedule">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="Due Date" value={formatDateDetail(task.dueDate)} />
              <DetailRow label="Deadline Date" value={formatDateDetail(task.deadlineDate)} />
              <DetailRow label="Completed At" value={formatDateDetail(task.completedAt)} />
              <DetailRow label="Created At" value={formatDateDetail(task.createdAt)} />
              <DetailRow label="Updated At" value={formatDateDetail(task.updatedAt)} />
              <DetailRow label="Recurrence" value={display(task.recurrence)} />
            </dl>
          </Section>

          <Section title="Time">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="AI Assigned Time" value={formatAiTime(task.timeEstimate)} />
              <DetailRow label="Actual Time Taken" value={formatDuration(task.timeSpent)} />
              <DetailRow label="Timer" value={task.timerRunning ? 'Running' : 'Stopped'} />
              <DetailRow label="Timer Started" value={formatDateDetail(task.timerStartedAt)} />
            </dl>
          </Section>

          <Section title="Notes">
            <div className="rounded-md p-3" style={{ backgroundColor: 'var(--color-muted)' }}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                {task.notes?.trim() || 'No notes added.'}
              </p>
            </div>
          </Section>

          <Section title="Images">
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
          </Section>

          {taskImages.length > 0 && (
            <ImageCarousel images={taskImages} removableIds={new Set(localImages.map((img) => img.id))} onRemove={handleRemoveImage} />
          )}

          <Section title="Metadata">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <DetailRow label="Source" value={display(task.source)} />
              <DetailRow label="Tags" value={task.tags?.length ? task.tags.join(', ') : 'Not set'} />
              <DetailRow label="Task ID" value={task.id} />
              <DetailRow label="Project ID" value={display(task.projectId)} />
              <DetailRow label="User ID" value={display(task.userId)} />
            </dl>
          </Section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
