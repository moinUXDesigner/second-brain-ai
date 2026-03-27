import { Button } from '@/components/ui/Button';

interface StepInputProps {
  text: string;
  area: string;
  onChange: (partial: { text?: string; area?: string }) => void;
  onNext: () => void;
}

const AREA_OPTIONS = [
  'Work',
  'Personal',
  'Health',
  'Finance',
  'Learning',
  'Social',
  'Creative',
  'Home',
];

export function StepInput({ text, area, onChange, onNext }: StepInputProps) {
  const canProceed = text.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-5">
        <h2
          className="text-h2 font-semibold"
          style={{ color: 'var(--color-text)' }}
        >
          What&apos;s on your mind?
        </h2>

        {/* Main textarea */}
        <textarea
          value={text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="I need to build a new gym app for fitness tracking"
          className="input-base min-h-[160px] resize-y text-body"
          autoFocus
        />

        <p
          className="text-caption"
          style={{ color: 'var(--color-muted-fg)' }}
        >
          Describe the task or project you have in mind…
        </p>

        {/* Area selection */}
        <div className="space-y-2">
          <label
            className="text-caption font-medium"
            style={{ color: 'var(--color-text)' }}
          >
            Area
          </label>
          <div className="flex flex-wrap gap-2">
            {AREA_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange({ area: area === opt ? '' : opt })}
                className="px-3 py-1.5 rounded-full text-caption font-medium transition-all"
                style={{
                  backgroundColor:
                    area === opt ? 'var(--primary-100)' : 'var(--color-muted)',
                  color:
                    area === opt ? 'var(--primary-700)' : 'var(--color-text-secondary)',
                  border:
                    area === opt
                      ? '1px solid var(--primary-300)'
                      : '1px solid transparent',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Next button */}
      <div className="pt-4">
        <Button
          className="w-full"
          onClick={onNext}
          disabled={!canProceed}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
