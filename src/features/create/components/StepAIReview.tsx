import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { TASK_CATEGORIES } from '@/constants';
import { inputService } from '@/services/endpoints/inputService';
import { useUiStore } from '@/app/store/uiStore';
import type { WizardData } from '../CreateFlowPage';
import type { AnalyzeResult } from '@/types';

interface StepAIReviewProps {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
  onBack: () => void;
  onCreate: () => void;
  submitting: boolean;
}

const PRIORITY_OPTIONS: { value: WizardData['priority']; label: string; color: string }[] = [
  { value: 'Low', label: 'Low', color: 'var(--primary-500)' },
  { value: 'Medium', label: 'Medium', color: '#f59e0b' },
  { value: 'High', label: 'High', color: '#ef4444' },
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

export function StepAIReview({ data, onChange, onBack, onCreate, submitting }: StepAIReviewProps) {
  const { aiEnabled, toggleAI } = useUiStore();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [source, setSource] = useState<'AI' | 'RULE' | ''>('');
  const [confidence, setConfidence] = useState(0);
  const [subtasks, setSubtasks] = useState<string[]>([]);

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    try {
      const res = await inputService.analyzeInput({
        text: data.text,
        area: data.area,
        aiEnabled,
      });
      const r: AnalyzeResult = res.data;
      // Normalize subtasks before storing
      const rawSubs = r.subtasks || [];
      const normalizedSubs = rawSubs.map((st: unknown) => {
        if (typeof st === 'string') return st;
        if (st && typeof st === 'object') {
          const obj = st as Record<string, unknown>;
          return String(obj.subtask || obj.title || obj.text || obj.name || JSON.stringify(st));
        }
        return String(st);
      });
      onChange({
        type: r.type,
        category: r.category,
        priority: r.priority,
        estimatedTime: r.estimatedTime,
        subtasks: normalizedSubs,
      });
      setSubtasks(normalizedSubs);
      setConfidence(r.confidence);
      setSource(r.source);
    } catch {
      // Fallback: keep current values
      setSource('RULE');
      setConfidence(0.3);
    } finally {
      setAnalyzing(false);
      setAnalyzed(true);
    }
  }, [data.text, data.area, aiEnabled, onChange]);

  useEffect(() => {
    runAnalysis();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-5 overflow-y-auto">
        {/* Header with AI toggle */}
        <div className="flex items-center justify-between">
          <h2
            className="text-h2 font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            {analyzing ? 'Analyzing…' : 'Review & Adjust'}
          </h2>
          <button
            type="button"
            onClick={() => {
              toggleAI();
              // Re-analyze with toggled setting after state update
              setTimeout(() => runAnalysis(), 50);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium transition-all"
            style={{
              backgroundColor: aiEnabled ? 'var(--primary-100)' : 'var(--color-muted)',
              color: aiEnabled ? 'var(--primary-700)' : 'var(--color-muted-fg)',
              border: aiEnabled
                ? '1px solid var(--primary-300)'
                : '1px solid var(--color-border)',
            }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI {aiEnabled ? 'On' : 'Off'}
          </button>
        </div>

        {/* Loading state */}
        {analyzing && (
          <div
            className="flex items-center justify-center py-12 rounded-lg"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--primary-500)', borderTopColor: 'transparent' }}
              />
              <p className="text-caption" style={{ color: 'var(--color-muted-fg)' }}>
                {aiEnabled ? 'AI is analyzing your input…' : 'Running rule-based analysis…'}
              </p>
            </div>
          </div>
        )}

        {/* Analysis results */}
        {!analyzing && analyzed && (
          <>
            {/* Source badge */}
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                style={{
                  backgroundColor: source === 'AI' ? 'var(--primary-100)' : 'var(--color-muted)',
                  color: source === 'AI' ? 'var(--primary-700)' : 'var(--color-muted-fg)',
                }}
              >
                {source === 'AI' ? '✦ AI' : '⚙ Rule'} · {Math.round(confidence * 100)}% confidence
              </span>
            </div>

            {/* Type toggle */}
            <div className="space-y-1.5">
              <label
                className="text-caption font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Type
              </label>
              <div className="flex gap-2">
                {(['task', 'project'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange({ type: t })}
                    className="flex-1 rounded-lg py-2.5 text-body font-medium capitalize transition-all"
                    style={{
                      backgroundColor:
                        data.type === t ? 'var(--primary-50)' : 'var(--color-surface)',
                      color:
                        data.type === t ? 'var(--primary-700)' : 'var(--color-text-secondary)',
                      border:
                        data.type === t
                          ? '2px solid var(--primary-500)'
                          : '2px solid var(--color-border)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

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
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => onChange({ priority: p.value })}
                    className="flex-1 rounded-lg py-2 text-caption font-medium transition-all"
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
                    <span style={{ color: p.color }}>●</span> {p.label}
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

            {/* Subtasks preview (projects only) */}
            {data.type === 'project' && subtasks.length > 0 && (
              <div className="space-y-2">
                <label
                  className="text-caption font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Suggested Subtasks
                </label>
                <div className="space-y-1.5">
                  {subtasks.map((st, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg px-3 py-2"
                      style={{ backgroundColor: 'var(--color-muted)' }}
                    >
                      <span
                        className="text-caption font-semibold shrink-0"
                        style={{ color: 'var(--primary-600)' }}
                      >
                        {i + 1}.
                      </span>
                      <span className="text-caption" style={{ color: 'var(--color-text)' }}>
                        {st}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="secondary" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={onCreate}
          isLoading={submitting}
          disabled={analyzing}
        >
          Create {data.type === 'project' ? 'Project' : 'Task'}
        </Button>
      </div>
    </div>
  );
}
