interface StepIndicatorProps {
  currentStep: number;
  labels: string[];
  completedSteps: Set<number>;
}

export function StepIndicator({ currentStep, labels, completedSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {labels.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = completedSteps.has(stepNum);
        const isPast = stepNum < currentStep;
        const isLast = i === labels.length - 1;

        return (
          <div key={stepNum} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              {/* Circle */}
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-caption font-semibold transition-all"
                style={{
                  backgroundColor:
                    isCompleted || isActive
                      ? 'var(--primary-600)'
                      : 'var(--color-muted)',
                  color:
                    isCompleted || isActive
                      ? '#ffffff'
                      : 'var(--color-muted-fg)',
                }}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              {/* Label */}
              <span
                className="text-[10px] sm:text-caption font-medium whitespace-nowrap max-w-[70px] sm:max-w-none text-center truncate"
                style={{
                  color:
                    isActive || isPast
                      ? 'var(--color-text)'
                      : 'var(--color-muted-fg)',
                }}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className="h-0.5 w-8 sm:w-12 mx-1 sm:mx-2 -mt-5 transition-colors"
                style={{
                  backgroundColor:
                    isPast || isCompleted
                      ? 'var(--primary-500)'
                      : 'var(--color-border)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
