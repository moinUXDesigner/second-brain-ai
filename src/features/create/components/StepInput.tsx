import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { DOMAIN_OPTIONS, joinDomains, splitDomains } from '@/utils/domains';

interface StepInputProps {
  text: string;
  area: string;
  onChange: (partial: { text?: string; area?: string }) => void;
  onNext: () => void;
}

const CUSTOM_KEY = '__custom__';

export function StepInput({ text, area, onChange, onNext }: StepInputProps) {
  const selectedDomains = splitDomains(area);
  const customDomains = selectedDomains.filter((domain) => !DOMAIN_OPTIONS.includes(domain as typeof DOMAIN_OPTIONS[number]));
  const [showCustomInput, setShowCustomInput] = useState(customDomains.length > 0);
  const customInputRef = useRef<HTMLInputElement>(null);
  const canProceed = text.trim().length > 0;

  useEffect(() => {
    if (showCustomInput) {
      customInputRef.current?.focus();
    }
  }, [showCustomInput]);

  const handleChipClick = (opt: string) => {
    if (opt === CUSTOM_KEY) {
      setShowCustomInput(true);
      return;
    }

    const nextDomains = selectedDomains.includes(opt)
      ? selectedDomains.filter((domain) => domain !== opt)
      : [...selectedDomains, opt];

    onChange({ area: joinDomains(nextDomains) });
  };

  const handleCustomChange = (value: string) => {
    const baseDomains = selectedDomains.filter((domain) => DOMAIN_OPTIONS.includes(domain as typeof DOMAIN_OPTIONS[number]));
    const customValues = value
      .split(',')
      .map((domain) => domain.trim())
      .filter(Boolean);

    onChange({ area: joinDomains([...baseDomains, ...customValues]) });
  };

  const handleClearDomains = () => {
    setShowCustomInput(false);
    onChange({ area: '' });
  };

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

        {/* Domain selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label
              className="text-caption font-medium"
              style={{ color: 'var(--color-text)' }}
            >
              Domains
            </label>
            {selectedDomains.length > 0 && (
              <button
                type="button"
                onClick={handleClearDomains}
                className="text-caption font-medium"
                style={{ color: 'var(--primary-600)' }}
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {DOMAIN_OPTIONS.map((opt) => {
              const selected = selectedDomains.includes(opt);

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleChipClick(opt)}
                  className="px-3 py-1.5 rounded-full text-caption font-medium transition-all"
                  style={{
                    backgroundColor: selected ? 'var(--primary-100)' : 'var(--color-muted)',
                    color: selected ? 'var(--primary-700)' : 'var(--color-text-secondary)',
                    border: selected ? '1px solid var(--primary-300)' : '1px solid transparent',
                  }}
                >
                  {opt}
                </button>
              );
            })}
            {/* Custom chip */}
            <button
              type="button"
              onClick={() => handleChipClick(CUSTOM_KEY)}
              className="px-3 py-1.5 rounded-full text-caption font-medium transition-all"
              style={{
                backgroundColor:
                  showCustomInput ? 'var(--primary-100)' : 'var(--color-muted)',
                color:
                  showCustomInput ? 'var(--primary-700)' : 'var(--color-text-secondary)',
                border:
                  showCustomInput
                    ? '1px solid var(--primary-300)'
                    : '1px solid transparent',
              }}
            >
              + Custom
            </button>
          </div>

          {/* Custom domain input */}
          {showCustomInput && (
            <input
              ref={customInputRef}
              type="text"
              value={customDomains.join(', ')}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="Enter custom domains, separated by commas..."
              className="input-base text-body mt-2"
            />
          )}
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
