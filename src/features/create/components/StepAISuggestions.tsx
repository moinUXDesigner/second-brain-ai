import { Button } from '@/components/ui/Button';
import { TASK_CATEGORIES } from '@/constants';
import type { WizardData } from '../CreateFlowPage';

interface StepAISuggestionsProps {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
  onBack: () => void;
  onCreate: () => void;
  submitting: boolean;
}

const PRIORITY_OPTIONS: { value: WizardData['priority']; label: string; badge: string; color: string }[] = [
  { value: 'Low', label: 'Low', badge: '● Low', color: 'var(--primary-500)' },
  { value: 'Medium', label: 'Medium', badge: '● Medium', color: '#f59e0b' },
  { value: 'High', label: 'High', badge: '● High', color: '#ef4444' },
];

const TIME_OPTIONS = [
  '30 minutes',
  '1 hour',
  '2 hours',
  '4 hours',
  '1 day',
  '2 days',
  '1 week',
];

export function StepAISuggestions({ data, onChange, onBack, onCreate, submitting }: StepAISuggestionsProps) {
  const currentPriority = PRIORITY_OPTIONS.find((p) => p.value === data.priority) || PRIORITY_OPTIONS[1];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-5">
        <h2
          className="text-h2 font-semibold"
          style={{ color: 'var(--color-text)' }}
        >
          Review the AI suggestions
        </h2>

        {/* Category */}
        <div className="space-y-1.5">
          <label
            className="text-caption font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Category
          </label>
          <select
            value={data.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className="input-base"
          >
            {TASK_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <label
            className="text-caption font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Priority
          </label>
          <div
            className="flex items-center justify-between rounded-sm px-3 py-2.5"
            style={{
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <span className="text-body" style={{ color: 'var(--color-text)' }}>
              {currentPriority.label}
            </span>
            <span
              className="text-caption font-semibold"
              style={{ color: currentPriority.color }}
            >
              {currentPriority.badge}
            </span>
          </div>
          {/* Priority selector */}
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onChange({ priority: p.value })}
                className="flex-1 rounded-sm py-2 text-caption font-medium transition-all"
                style={{
                  backgroundColor:
                    data.priority === p.value
                      ? 'var(--primary-50)'
                      : 'var(--color-muted)',
                  color:
                    data.priority === p.value
                      ? 'var(--primary-700)'
                      : 'var(--color-text-secondary)',
                  border:
                    data.priority === p.value
                      ? '1px solid var(--primary-300)'
                      : '1px solid transparent',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Estimated Time */}
        <div className="space-y-1.5">
          <label
            className="text-caption font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Estimated Time
          </label>
          <select
            value={data.estimatedTime}
            onChange={(e) => onChange({ estimatedTime: e.target.value })}
            className="input-base"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="secondary" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" onClick={onCreate} isLoading={submitting}>
          Create
        </Button>
      </div>
    </div>
  );
}
