import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-caption font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <select ref={ref} id={id} className={cn('input-base pr-8', error && 'border-danger-500', className)} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-caption text-danger-500">{error}</p>}
    </div>
  ),
);

Select.displayName = 'Select';
