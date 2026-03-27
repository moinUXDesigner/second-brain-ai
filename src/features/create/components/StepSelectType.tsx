import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface StepSelectTypeProps {
  text: string;
  type: 'task' | 'project';
  onChange: (partial: { type: 'task' | 'project' }) => void;
  onNext: () => void;
}

/**
 * Simple heuristic: if the text contains project-like keywords, suggest "project".
 */
function looksLikeProject(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = ['build', 'create', 'design', 'develop', 'launch', 'plan', 'setup', 'implement', 'redesign', 'migrate', 'app', 'website', 'system', 'platform', 'project'];
  return keywords.filter((k) => lower.includes(k)).length >= 2;
}

export function StepSelectType({ text, type, onChange, onNext }: StepSelectTypeProps) {
  const suggestsProject = looksLikeProject(text);
  const [showSuggestion, setShowSuggestion] = useState(suggestsProject && type === 'task');

  const handleTypeChange = (t: 'task' | 'project') => {
    onChange({ type: t });
    setShowSuggestion(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6">
        <h2
          className="text-h2 font-semibold"
          style={{ color: 'var(--color-text)' }}
        >
          Do you want to create a task or project?
        </h2>

        {/* Radio options */}
        <div className="space-y-3">
          {(['task', 'project'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className="flex items-center gap-3 w-full rounded-lg px-4 py-3 text-left transition-all"
              style={{
                backgroundColor:
                  type === t ? 'var(--primary-50)' : 'var(--color-surface)',
                border:
                  type === t
                    ? '2px solid var(--primary-500)'
                    : '2px solid var(--color-border)',
              }}
            >
              {/* Radio dot */}
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0"
                style={{
                  borderColor:
                    type === t ? 'var(--primary-600)' : 'var(--color-border)',
                }}
              >
                {type === t && (
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: 'var(--primary-600)' }}
                  />
                )}
              </div>
              <span
                className="text-body font-medium capitalize"
                style={{ color: 'var(--color-text)' }}
              >
                {t}
              </span>
            </button>
          ))}
        </div>

        {/* Smart suggestion */}
        <AnimatePresence>
          {showSuggestion && type === 'task' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-lg px-4 py-3 space-y-3"
              style={{
                backgroundColor: 'var(--color-accent)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex items-start gap-2">
                <span className="text-body">⚠️</span>
                <p
                  className="text-body"
                  style={{ color: 'var(--color-text)' }}
                >
                  This looks like a <strong>Project</strong>.<br />
                  Do you want to switch?
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleTypeChange('project')}
                >
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSuggestion(false)}
                >
                  Continue as Task
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Next button */}
      <div className="pt-4">
        <Button className="w-full" onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
