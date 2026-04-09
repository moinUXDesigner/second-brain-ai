import { useEffect, useState, useRef } from 'react';
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
  { value: 'Low',    label: 'Low',    color: 'var(--primary-500)' },
  { value: 'Medium', label: 'Medium', color: '#f59e0b' },
  { value: 'High',   label: 'High',   color: '#ef4444' },
];

const RECURRENCE_OPTIONS: Array<'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'> = [
  'None', 'Daily', 'Weekly', 'Monthly', 'Yearly',
];

const parseEstimatedTime = (value: string): number => {
  const s = value.toLowerCase().trim();
  const min  = s.match(/(\d+)\s*min/);       if (min)  return Math.max(1, Number(min[1]));
  const hour = s.match(/(\d+\.?\d*)\s*hour/); if (hour) return Math.max(1, Math.round(Number(hour[1]) * 60));
  const day  = s.match(/(\d+\.?\d*)\s*day/);  if (day)  return Math.max(1, Math.round(Number(day[1]) * 480));
  const week = s.match(/(\d+\.?\d*)\s*week/); if (week) return Math.max(1, Math.round(Number(week[1]) * 2400));
  const num  = Number(s);
  return !isNaN(num) && num > 0 ? Math.max(1, Math.round(num)) : 30;
};

const formatEstimatedTime = (minutes: number): string => {
  if (minutes < 60)  return `${minutes} minutes`;
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes / 60 === 1 ? '' : 's'}`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const inferRecurrence = (text: string): WizardData['recurrence'] => {
  const t = text.toLowerCase();
  if (t.includes('daily')   || t.includes('every day'))   return 'Daily';
  if (t.includes('weekly')  || t.includes('every week'))  return 'Weekly';
  if (t.includes('monthly') || t.includes('every month')) return 'Monthly';
  if (t.includes('yearly')  || t.includes('annual'))      return 'Yearly';
  return undefined;
};

export function StepAIReview({ data, onChange, onBack, onCreate, submitting }: StepAIReviewProps) {
  const { aiEnabled, toggleAI } = useUiStore();

  const [analyzing,       setAnalyzing]       = useState(false);
  const [analyzed,        setAnalyzed]        = useState(false);
  const [source,          setSource]          = useState<'AI' | 'RULE' | ''>('');
  const [confidence,      setConfidence]      = useState(0);
  const [subtasks,        setSubtasks]        = useState<string[]>(data.subtasks ?? []);
  const [aiError,         setAiError]         = useState(false);
  const [editing,         setEditing]         = useState(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState(() => parseEstimatedTime(data.estimatedTime));
  const [recurrence,      setRecurrence]      = useState<'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>(
    data.recurrence ?? 'None',
  );

  // Capture initial values in refs so analysis never re-triggers on prop changes
  const initialText      = useRef(data.text);
  const initialArea      = useRef(data.area);
  const aiEnabledRef     = useRef(aiEnabled);
  const hasRun           = useRef(false);

  const runAnalysis = async (withAI: boolean) => {
    setAnalyzing(true);
    setAnalyzed(false);
    setAiError(false);
    try {
      const res = await inputService.analyzeInput({
        text:      initialText.current,
        area:      initialArea.current,
        aiEnabled: withAI,
      });
      const r: AnalyzeResult = res.data;

      const normalizedSubs = (r.subtasks ?? []).map((st: unknown) => {
        if (typeof st === 'string') return st;
        if (st && typeof st === 'object') {
          const o = st as Record<string, unknown>;
          return String(o.subtask ?? o.title ?? o.text ?? o.name ?? JSON.stringify(st));
        }
        return String(st);
      });

      const inferredRecurrence = r.recurrence ?? inferRecurrence(initialText.current);
      const nextEstimated      = r.estimatedTime || formatEstimatedTime(estimatedMinutes);
      const nextMinutes        = parseEstimatedTime(nextEstimated);

      // Update local state only — no onChange call here to avoid re-render loop
      setSubtasks(normalizedSubs);
      setConfidence(r.confidence);
      setSource(r.source);
      setEstimatedMinutes(nextMinutes);
      setRecurrence(inferredRecurrence ?? 'None');

      // Push result up to parent once
      onChange({
        type:          r.type,
        category:      r.category,
        priority:      r.priority,
        estimatedTime: nextEstimated,
        recurrence:    inferredRecurrence,
        subtasks:      normalizedSubs,
      });
    } catch {
      setSource('RULE');
      setConfidence(0.3);
      setAiError(true);
    } finally {
      setAnalyzing(false);
      setAnalyzed(true);
    }
  };

  // Run ONCE on mount only
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    runAnalysis(aiEnabledRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleAI = () => {
    const next = !aiEnabled;
    toggleAI();
    aiEnabledRef.current = next;
    hasRun.current = false;
    runAnalysis(next);
  };

  const priorityColor = data.priority === 'High' ? '#ef4444' : data.priority === 'Medium' ? '#f59e0b' : 'var(--primary-500)';

  // ── PREVIEW ──────────────────────────────────────────────
  const renderPreview = () => (
    <div className="flex-1 space-y-5 overflow-y-auto">
      {aiError && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-caption text-yellow-800">
          AI analysis failed — using rule-based suggestions instead.
        </div>
      )}

      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
          style={{
            backgroundColor: source === 'AI' ? 'var(--primary-100)' : 'var(--color-muted)',
            color:           source === 'AI' ? 'var(--primary-700)' : 'var(--color-muted-fg)',
          }}
        >
          {source === 'AI' ? '✦ AI' : '⚙ Rule'} · {Math.round(confidence * 100)}%
        </span>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <span
            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mb-2"
            style={{
              backgroundColor: data.type === 'project' ? 'var(--primary-100)' : 'var(--color-muted)',
              color:           data.type === 'project' ? 'var(--primary-700)' : 'var(--color-muted-fg)',
            }}
          >
            {data.type}
          </span>
          <h3 className="text-body font-bold" style={{ color: 'var(--color-text)' }}>{data.text}</h3>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {data.area && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}>
                {data.area}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}>
              {data.category}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}>
              <span style={{ color: priorityColor, fontSize: '10px' }}>●</span> {data.priority}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}>
              ⏱ {data.estimatedTime}
            </span>
            {data.recurrence && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}>
                🔁 {data.recurrence}
              </span>
            )}
          </div>

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

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleToggleAI}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium transition-all"
          style={{
            backgroundColor: aiEnabled ? 'var(--primary-100)' : 'var(--color-muted)',
            color:           aiEnabled ? 'var(--primary-700)' : 'var(--color-muted-fg)',
            border:          aiEnabled ? '1px solid var(--primary-300)' : '1px solid var(--color-border)',
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

  // ── EDIT FORM ─────────────────────────────────────────────
  const renderEditForm = () => (
    <div className="flex-1 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold" style={{ color: 'var(--color-text)' }}>Edit Details</h2>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
          style={{
            backgroundColor: source === 'AI' ? 'var(--primary-100)' : 'var(--color-muted)',
            color:           source === 'AI' ? 'var(--primary-700)' : 'var(--color-muted-fg)',
          }}
        >
          {source === 'AI' ? '✦ AI suggested' : '⚙ Rule based'}
        </span>
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <label className="text-caption font-medium" style={{ color: 'var(--color-text-secondary)' }}>Type</label>
        <div className="flex gap-2">
          {(['task', 'project'] as const).map((t) => (
            <button key={t} type="button" onClick={() => onChange({ type: t })}
              className="flex-1 rounded-lg py-2.5 text-body font-medium capitalize transition-all"
              style={{
                backgroundColor: data.type === t ? 'var(--primary-50)' : 'var(--color-surface)',
                color:           data.type === t ? 'var(--primary-700)' : 'var(--color-text-secondary)',
                border:          data.type === t ? '2px solid var(--primary-500)' : '2px solid var(--color-border)',
              }}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-caption font-medium" style={{ color: 'var(--color-text-secondary)' }}>Category</label>
        <select value={data.category} onChange={(e) => onChange({ category: e.target.value })} className="input-base">
          {TASK_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Priority */}
      <div className="space-y-1.5">
        <label className="text-caption font-medium" style={{ color: 'var(--color-text-secondary)' }}>Priority</label>
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map((p) => (
            <button key={p.value} type="button" onClick={() => onChange({ priority: p.value })}
              className="flex-1 rounded-lg py-2 text-caption font-medium transition-all"
              style={{
                backgroundColor: data.priority === p.value ? 'var(--primary-50)' : 'var(--color-muted)',
                color:           data.priority === p.value ? 'var(--primary-700)' : 'var(--color-text-secondary)',
                border:          data.priority === p.value ? '1px solid var(--primary-300)' : '1px solid transparent',
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
            <button key={opt} type="button"
              onClick={() => { setRecurrence(opt); onChange({ recurrence: opt === 'None' ? undefined : opt }); }}
              className="px-3 py-1.5 rounded-full text-caption font-medium transition-all"
              style={{
                backgroundColor: recurrence === opt ? 'var(--primary-50)' : 'var(--color-muted)',
                color:           recurrence === opt ? 'var(--primary-700)' : 'var(--color-text-secondary)',
                border:          recurrence === opt ? '1px solid var(--primary-300)' : '1px solid transparent',
              }}
            >{opt}</button>
          ))}
        </div>
      </div>

      {/* Estimated Time */}
      <div className="space-y-1.5">
        <label className="text-caption font-medium" style={{ color: 'var(--color-text-secondary)' }}>Estimated Time</label>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-xs"
            onClick={() => { const n = Math.max(5, estimatedMinutes - 15); setEstimatedMinutes(n); onChange({ estimatedTime: formatEstimatedTime(n) }); }}
          >-15</button>
          <span className="text-body font-semibold min-w-[80px] text-center" style={{ color: 'var(--primary-600)' }}>
            {formatEstimatedTime(estimatedMinutes)}
          </span>
          <button type="button" className="btn btn-xs"
            onClick={() => { const n = estimatedMinutes + 15; setEstimatedMinutes(n); onChange({ estimatedTime: formatEstimatedTime(n) }); }}
          >+15</button>
        </div>
      </div>

      {/* Subtasks */}
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
      {analyzing && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--primary-500)', borderTopColor: 'transparent' }} />
            <p className="text-caption" style={{ color: 'var(--color-muted-fg)' }}>
              {aiEnabled ? 'AI is analyzing your input…' : 'Running rule-based analysis…'}
            </p>
          </div>
        </div>
      )}

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

          <div className="flex gap-3 pt-4">
            {editing ? (
              <Button className="flex-1" onClick={() => setEditing(false)}>OK</Button>
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
