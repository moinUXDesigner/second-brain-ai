import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  '5 minutes',
  '10 minutes',
  '15 minutes',
  '30 minutes',
  '45 minutes',
  '1 hour',
  '2 hours',
  '4 hours',
  '1 day',
  '2 days',
  '1 week',
];

const RECURRENCE_OPTIONS: Array<'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'> = ['None', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

const parseEstimatedTime = (value: string) => {
  const normalized = value.toLowerCase().trim();
  const minuteMatch = normalized.match(/(\d+)\s*min(?:ute)?/);
  if (minuteMatch) return Math.max(1, Number(minuteMatch[1]));

  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*hour/);
  if (hourMatch) return Math.max(1, Math.round(Number(hourMatch[1]) * 60));

  const dayMatch = normalized.match(/(\d+(?:\.\d+)?)\s*day/);
  if (dayMatch) return Math.max(1, Math.round(Number(dayMatch[1]) * 24 * 60));

  const weekMatch = normalized.match(/(\d+(?:\.\d+)?)\s*week/);
  if (weekMatch) return Math.max(1, Math.round(Number(weekMatch[1]) * 7 * 24 * 60));

  const numeric = Number(normalized);
  if (!Number.isNaN(numeric) && numeric > 0) return Math.max(1, Math.round(numeric));

  return 30;
};

const formatEstimatedTime = (minutes: number) => {
  if (minutes <= 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes / 60 === 1 ? '' : 's'}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const inferRecurrence = (text: string): 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | undefined => {
  const lower = text.toLowerCase();
  if (lower.includes('daily') || lower.includes('every day')) return 'Daily';
  if (lower.includes('weekly') || lower.includes('every week')) return 'Weekly';
  if (lower.includes('monthly') || lower.includes('every month')) return 'Monthly';
  if (lower.includes('yearly') || lower.includes('every year') || lower.includes('annual')) return 'Yearly';
  return undefined;
};

export function StepAIReview({ data, onChange, onBack, onCreate, submitting }: StepAIReviewProps) {
  const { aiEnabled, toggleAI } = useUiStore();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [source, setSource] = useState<'AI' | 'RULE' | ''>('');
  const [confidence, setConfidence] = useState(0);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [aiError, setAiError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(() => parseEstimatedTime(data.estimatedTime));
  const [recurrence, setRecurrence] = useState<'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>(
    data.recurrence ?? 'None',
  );

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    setAiError(false);
    try {
      const res = await inputService.analyzeInput({
        text: data.text,
        area: data.area,
        aiEnabled,
      });
      const r: AnalyzeResult = res.data;
      const rawSubs = r.subtasks || [];
      const normalizedSubs = rawSubs.map((st: unknown) => {
        if (typeof st === 'string') return st;
        if (st && typeof st === 'object') {
          const obj = st as Record<string, unknown>;
          return String(obj.subtask || obj.title || obj.text || obj.name || JSON.stringify(st));
        }
        return String(st);
      });
      const inferredRecurrence = r.recurrence ?? inferRecurrence(data.text);
      const nextEstimated = r.estimatedTime || formatEstimatedTime(estimatedMinutes);

      onChange({
        type: r.type,
        category: r.category,
        priority: r.priority,
        estimatedTime: nextEstimated,
        recurrence: inferredRecurrence,
        subtasks: normalizedSubs,
      });
      setSubtasks(normalizedSubs);
      setConfidence(r.confidence);
      setSource(r.source);
      setAiError(false);

      setEstimatedMinutes(parseEstimatedTime(nextEstimated));
      setRecurrence(inferredRecurrence ?? 'None');
    } catch {
      setSource('RULE');
      setConfidence(0.3);
      setAiError(true);
    } finally {
      setAnalyzing(false);
      setAnalyzed(true);
    }
  }, [data.text, data.area, aiEnabled, onChange]);

  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setEstimatedMinutes(parseEstimatedTime(data.estimatedTime));
    setRecurrence(data.recurrence ?? 'None');
  }, [data.estimatedTime, data.recurrence]);

  const priorityColor = data.priority === 'High' ? '#ef4444' : data.priority === 'Medium' ? '#f59e0b' : 'var(--primary-500)';

  // ─── PREVIEW MODE ───
  const renderPreview = () => (
    <div className="flex-1 space-y-5 overflow-y-auto">
      {/* AI error info */}
      {aiError && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-caption text-yellow-800 mb-2">
          AI sub-task generation failed, using rule-based suggestions instead.
        </div>
      )}
      {/* AI badge */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
          style={{
            backgroundColor: source === 'AI' ? 'var(--primary-100)' : 'var(--color-muted)',
            color: source === 'AI' ? 'var(--primary-700)' : 'var(--color-muted-fg)',
          }}
        >
          {source === 'AI' ? '✦ AI' : '⚙ Rule'} · {Math.round(confidence * 100)}%
        </span>
      </div>

      {/* Preview Card */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        {/* Card header */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span
                className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mb-2"
                style={{
                  backgroundColor: data.type === 'project' ? 'var(--primary-100)' : 'var(--color-muted)',
                  color: data.type === 'project' ? 'var(--primary-700)' : 'var(--color-muted-fg)',
                }}
              >
                {data.type}
              </span>
              <h3 className="text-body font-bold" style={{ color: 'var(--color-text)' }}>
                {data.text}
              </h3>
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="px-5 py-4 space-y-3">
          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            {data.area && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {data.area}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {data.category}
            </span>
            {data.recurrence && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3V2h6v1m-3 2v4m0 0h.01M12 16v2m-4.93-1.39A8 8 0 1118 12" />
                </svg>
                {data.recurrence}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}>
              <span style={{ color: priorityColor, fontSize: '10px' }}>●</span>
              {data.priority}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {data.estimatedTime}
            </span>
          </div>

          {/* Subtasks */}
          {data.type === 'project' && subtasks.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-caption font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Subtasks ({subtasks.length})
              </p>
              <div className="space-y-1">
                {subtasks.map((st, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-muted)' }}>
                    <span className="text-caption font-semibold shrink-0" style={{ color: 'var(--primary-600)' }}>{i + 1}.</span>
                    <span className="text-caption" style={{ color: 'var(--color-text)' }}>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI toggle */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => { toggleAI(); setTimeout(() => runAnalysis(), 50); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium transition-all"
          style={{
            backgroundColor: aiEnabled ? 'var(--primary-100)' : 'var(--color-muted)',
            color: aiEnabled ? 'var(--primary-700)' : 'var(--color-muted-fg)',
            border: aiEnabled ? '1px solid var(--primary-300)' : '1px solid var(--color-border)',
          }}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI {aiEnabled ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );

  // ─── EDIT MODE ───
  const renderEditForm = () => (
    <div className="flex-1 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold" style={{ color: 'var(--color-text)' }}>Edit Details</h2>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
          style={{
            backgroundColor: source === 'AI' ? 'var(--primary-100)' : 'var(--color-muted)',
            color: source === 'AI' ? 'var(--primary-700)' : 'var(--color-muted-fg)',
          }}
        >
          {source === 'AI' ? '✦ AI suggested' : '⚙ Rule based'}
        </span>
      </div>

      {/* Type toggle */}
      <div className="space-y-1.5">
        <label className="text-caption font-medium" style={{ color: 'var(--color-text-secondary)' }}>Type</label>
        <div className="flex gap-2">
          {(['task', 'project'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ type: t })}
              className="flex-1 rounded-lg py-2.5 text-body font-medium capitalize transition-all"
              style={{
                backgroundColor: data.type === t ? 'var(--primary-50)' : 'var(--color-surface)',
                color: data.type === t ? 'var(--primary-700)' : 'var(--color-text-secondary)',
                border: data.type === t ? '2px solid var(--primary-500)' : '2px solid var(--color-border)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-caption font-medium" style={{ color: 'var(--color-text-secondary)' }}>Category</label>
        <select value={data.category} onChange={(e) => onChange({ category: e.target.value })} className="input-base">
          {TASK_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Priority */}
      <div className="space-y-1.5">
        <label className="text-caption font-medium" style={{ color: 'var(--color-text-secondary)' }}>Priority</label>
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange({ priority: p.value })}
              className="flex-1 rounded-lg py-2 text-caption font-medium transition-all"
              style={{
                backgroundColor: data.priority === p.value ? 'var(--primary-50)' : 'var(--color-muted)',
                color: data.priority === p.value ? 'var(--primary-700)' : 'var(--color-text-secondary)',
                border: data.priority === p.value ? '1px solid var(--primary-300)' : '1px solid transparent',
              }}
            >
              <span style={{ color: p.color }}>●</span> {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recurrence */}
      <div className="space-y-1.5">
        <label className="text-caption font-medium" style={{ color: 'var(--color-text-secondary)' }}>Recurrence</label>
        <div className="flex gap-2 flex-wrap">
          {RECURRENCE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setRecurrence(opt);
                onChange({ recurrence: opt === 'None' ? undefined : opt });
              }}
              className="px-3 py-1.5 rounded-full text-caption font-medium transition-all"
              style={{
                backgroundColor: recurrence === opt ? 'var(--primary-50)' : 'var(--color-muted)',
                color: recurrence === opt ? 'var(--primary-700)' : 'var(--color-text-secondary)',
                border: recurrence === opt ? '1px solid var(--primary-300)' : '1px solid transparent',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Estimated Time */}
      <div className="space-y-1.5">
        <label className="text-caption font-medium" style={{ color: 'var(--color-text-secondary)' }}>Estimated Time (minutes)</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = Math.max(1, estimatedMinutes - 5);
              setEstimatedMinutes(next);
              onChange({ estimatedTime: formatEstimatedTime(next) });
            }}
            className="btn btn-xs"
          >
            -5
          </button>
          <input
            type="number"
            min={1}
            value={estimatedMinutes}
            onChange={(e) => {
              const next = Math.max(1, Number(e.target.value));
              setEstimatedMinutes(next);
              onChange({ estimatedTime: formatEstimatedTime(next) });
            }}
            className="input-base w-24 text-center"
          />
          <button
            type="button"
            onClick={() => {
              const next = Math.max(1, estimatedMinutes + 5);
              setEstimatedMinutes(next);
              onChange({ estimatedTime: formatEstimatedTime(next) });
            }}
            className="btn btn-xs"
          >
            +5
          </button>
          <span className="text-caption text-neutral-600">({formatEstimatedTime(estimatedMinutes)})</span>
        </div>
      </div>

      {/* Subtasks (projects only) */}
      {data.type === 'project' && subtasks.length > 0 && (
        <div className="space-y-2">
          <label className="text-caption font-medium" style={{ color: 'var(--color-text-secondary)' }}>Subtasks</label>
          <div className="space-y-1.5">
            {subtasks.map((st, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-muted)' }}>
                <span className="text-caption font-semibold shrink-0" style={{ color: 'var(--primary-600)' }}>{i + 1}.</span>
                <span className="text-caption" style={{ color: 'var(--color-text)' }}>{st}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Loading state */}
      {analyzing && (
        <div className="flex-1 flex items-center justify-center">
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

      {/* Content */}
      {!analyzing && analyzed && (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={editing ? 'edit' : 'preview'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {editing ? renderEditForm() : renderPreview()}
            </motion.div>
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            {editing ? (
              <Button className="flex-1" onClick={() => setEditing(false)}>
                OK
              </Button>
            ) : (
              <>
                <Button variant="secondary" className="flex-1" onClick={() => setEditing(true)}>
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </span>
                </Button>
                <Button className="flex-1" onClick={onCreate} isLoading={submitting}>
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </span>
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
