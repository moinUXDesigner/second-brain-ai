import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-caption font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <input ref={ref} id={id} className={cn('input-base', error && 'border-danger-500 focus:ring-danger-500', className)} {...props} />
      {error && <p className="text-caption text-danger-500">{error}</p>}
    </div>
  ),
);

Input.displayName = 'Input';
