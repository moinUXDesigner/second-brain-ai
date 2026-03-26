import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-caption font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn('input-base min-h-[120px] resize-y', error && 'border-danger-500 focus:ring-danger-500', className)}
        {...props}
      />
      {error && <p className="text-caption text-danger-500">{error}</p>}
    </div>
  ),
);

Textarea.displayName = 'Textarea';
