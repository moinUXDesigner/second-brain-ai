import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { useUiStore } from '@/app/store/uiStore';
import { useAudit } from '@/hooks/useAudit';
import { QUERY_KEYS } from '@/constants';
import {
  parseCSV,
  parseJSON,
  detectFormat,
  processBulkUpload,
  openSummaryAsPDF,
  type BulkMode,
  type BulkInputRow,
  type BulkProgress,
  type BulkSummary,
} from '@/services/endpoints/bulkUploadService';

type Step = 'upload' | 'preview' | 'processing' | 'summary';

const SAMPLE_JSON = `[
  { "text": "Redesign landing page", "area": "Work" },
  { "text": "Schedule dentist appointment", "area": "Health" },
  { "text": "Build mobile app project", "area": "Development" }
]`;

const SAMPLE_CSV = `text,area
Redesign landing page,Work
Schedule dentist appointment,Health
Build mobile app project,Development`;

export function BulkUploadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { log } = useAudit();
  const aiEnabled = useUiStore((s) => s.aiEnabled);

  const [step, setStep] = useState<Step>('upload');
  const [mode, setMode] = useState<BulkMode>(aiEnabled ? 'ai' : 'rule');
  const [rawInput, setRawInput] = useState('');
  const [parsedItems, setParsedItems] = useState<BulkInputRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [progress, setProgress] = useState<BulkProgress | null>(null);
  const [summary, setSummary] = useState<BulkSummary | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Upload step handlers ──

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawInput(text);
      setParseError('');
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleParse = useCallback(() => {
    try {
      const fmt = detectFormat(rawInput);
      const rows = fmt === 'json' ? parseJSON(rawInput) : parseCSV(rawInput);
      if (rows.length === 0) {
        setParseError('No valid items found. Ensure your data has "text" and "area" fields.');
        return;
      }
      if (rows.length > 500) {
        setParseError(`Maximum 500 items allowed. Found ${rows.length} items.`);
        return;
      }
      setParsedItems(rows);
      setParseError('');
      setStep('preview');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse input');
    }
  }, [rawInput]);

  const handleRemoveItem = useCallback((index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Processing ──

  const handleStart = useCallback(async () => {
    setStep('processing');
    setProgress(null);
    abortRef.current = new AbortController();

    try {
      const result = await processBulkUpload(
        parsedItems,
        mode,
        aiEnabled,
        setProgress,
        abortRef.current.signal,
      );
      setSummary(result);
      setStep('summary');

      // Audit log
      log('CREATE_TASK', 'bulk', undefined, {
        mode,
        total: result.totalProcessed,
        tasks: result.tasksCreated,
        projects: result.projectsCreated,
        failed: result.failed,
      });

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayTasks });

      toast.success(`Created ${result.tasksCreated} tasks and ${result.projectsCreated} projects`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk upload failed');
      setStep('preview');
    }
  }, [parsedItems, mode, aiEnabled, log, queryClient]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setStep('preview');
  }, []);

  // ── Preview stats ──

  const previewStats = useMemo(() => {
    const areas = new Map<string, number>();
    parsedItems.forEach((r) => areas.set(r.area, (areas.get(r.area) ?? 0) + 1));
    return { total: parsedItems.length, areas };
  }, [parsedItems]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Bulk Upload</h1>
          <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Import tasks and projects from JSON or CSV
          </p>
        </div>
        {step !== 'processing' && (
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {(['upload', 'preview', 'processing', 'summary'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            {i > 0 && <div className="w-6 h-px" style={{ backgroundColor: 'var(--color-border)' }} />}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: s === step ? 'var(--primary-600)' : 'var(--color-muted)',
                color: s === step ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              <span>{i + 1}</span>
              <span className="hidden sm:inline capitalize">{s}</span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Mode toggle */}
            <div className="card p-4 space-y-3">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Classification Mode</p>
              <div className="flex gap-2">
                {([
                  { value: 'ai', label: 'AI Only', desc: 'AI classifies type, priority, category & generates subtasks' },
                  { value: 'rule', label: 'Rule Only', desc: 'Rule-based classification (AI still generates subtasks for projects)' },
                  { value: 'both', label: 'AI + Rule', desc: 'AI first, rule-based fallback if AI fails' },
                ] as { value: BulkMode; label: string; desc: string }[]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    className="flex-1 p-3 rounded-lg border-2 text-left transition-all"
                    style={{
                      borderColor: mode === opt.value ? 'var(--primary-500)' : 'var(--color-border)',
                      backgroundColor: mode === opt.value ? 'var(--primary-50)' : 'var(--color-surface)',
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: mode === opt.value ? 'var(--primary-700)' : 'var(--color-text)' }}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] mt-0.5 leading-tight" style={{ color: 'var(--color-text-secondary)' }}>
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>
              {!aiEnabled && mode !== 'rule' && (
                <p className="text-xs px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--warning-50, #fffbeb)', color: 'var(--warning-700, #a16207)' }}>
                  AI is disabled globally. Enable it in settings or switch to Rule Only.
                </p>
              )}
            </div>

            {/* File drop */}
            <div
              onClick={() => fileRef.current?.click()}
              className="card p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors hover:border-[var(--primary-400)]"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <input ref={fileRef} type="file" accept=".json,.csv,.txt" className="hidden" onChange={handleFileUpload} />
              <svg className="mx-auto h-10 w-10 mb-3" style={{ color: 'var(--color-muted-fg)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-body font-medium" style={{ color: 'var(--color-text)' }}>
                Click to upload JSON or CSV file
              </p>
              <p className="text-caption mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Or paste your data below. Max 500 items.
              </p>
            </div>

            {/* Paste area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Paste Data</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setRawInput(SAMPLE_JSON)}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors"
                    style={{ backgroundColor: 'var(--color-muted)', color: 'var(--primary-600)' }}
                  >
                    Sample JSON
                  </button>
                  <button
                    onClick={() => setRawInput(SAMPLE_CSV)}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors"
                    style={{ backgroundColor: 'var(--color-muted)', color: 'var(--primary-600)' }}
                  >
                    Sample CSV
                  </button>
                </div>
              </div>
              <textarea
                value={rawInput}
                onChange={(e) => { setRawInput(e.target.value); setParseError(''); }}
                rows={10}
                placeholder={`Paste JSON array:\n[\n  { "text": "My task", "area": "Work" },\n  ...\n]\n\nOr CSV:\ntext,area\nMy task,Work`}
                className="w-full rounded-lg border p-3 text-sm font-mono outline-none resize-y"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              />
              {parseError && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-danger, #ef4444)' }}>{parseError}</p>
              )}
            </div>

            {/* Format guide */}
            <div className="card p-4 space-y-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Format Guide</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                <div>
                  <p className="font-medium mb-1" style={{ color: 'var(--color-text)' }}>Required Fields</p>
                  <p><code className="px-1 py-0.5 rounded text-[11px]" style={{ backgroundColor: 'var(--color-muted)' }}>text</code> — Task/project description</p>
                  <p><code className="px-1 py-0.5 rounded text-[11px]" style={{ backgroundColor: 'var(--color-muted)' }}>area</code> — Category area (Work, Health, etc.)</p>
                </div>
                <div>
                  <p className="font-medium mb-1" style={{ color: 'var(--color-text)' }}>How It Works</p>
                  <p>AI determines if each item is a task or project</p>
                  <p>Projects get auto-generated subtasks</p>
                  <p>Priority & category assigned by AI/rules</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleParse}
                disabled={!rawInput.trim()}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
                style={{ backgroundColor: 'var(--primary-600)', color: '#fff' }}
              >
                Parse & Preview
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Preview */}
        {step === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Stats bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="card px-4 py-2 flex items-center gap-2">
                <span className="text-lg font-bold" style={{ color: 'var(--primary-600)' }}>{previewStats.total}</span>
                <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>items</span>
              </div>
              {Array.from(previewStats.areas.entries()).slice(0, 5).map(([area, count]) => (
                <Badge key={area} variant="default">{area} ({count})</Badge>
              ))}
              <Badge variant={mode === 'ai' ? 'primary' : mode === 'rule' ? 'warning' : 'success'}>
                {mode === 'ai' ? 'AI Only' : mode === 'rule' ? 'Rule Only' : 'AI + Rule'}
              </Badge>
            </div>

            {/* Item list */}
            <div className="card overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {parsedItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="shrink-0 text-xs font-mono w-8 text-center" style={{ color: 'var(--color-muted-fg)' }}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--color-text)' }}>{item.text}</p>
                      <Badge variant="default" className="!text-[10px] mt-0.5">{item.area}</Badge>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(i)}
                      className="shrink-0 p-1 rounded-md transition-colors"
                      style={{ color: 'var(--color-muted-fg)' }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* API info callout */}
            <div
              className="rounded-lg p-3 text-xs flex items-start gap-2"
              style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)' }}
            >
              <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">Processing Info</p>
                <p className="mt-0.5">
                  Items are processed in batches of 5 (Google Apps Script limit).{' '}
                  {previewStats.total} items ≈ {Math.ceil(previewStats.total / 5)} batches.{' '}
                  Estimated time: ~{Math.ceil(previewStats.total / 5 * 3)} seconds.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
              >
                Back
              </button>
              <button
                onClick={handleStart}
                disabled={parsedItems.length === 0}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
                style={{ backgroundColor: 'var(--primary-600)', color: '#fff' }}
              >
                Start Upload ({parsedItems.length} items)
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Processing */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="card p-8 text-center space-y-6">
              {/* Spinning icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <svg className="h-16 w-16 animate-spin" style={{ color: 'var(--primary-200)' }} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  </svg>
                  <svg className="h-16 w-16 animate-spin absolute inset-0" style={{ color: 'var(--primary-600)' }} fill="none" viewBox="0 0 24 24">
                    <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
                  </svg>
                </div>
              </div>

              <div>
                <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  {progress?.phase === 'classifying' ? 'Classifying Items…' : 'Creating Items…'}
                </p>
                <p className="text-caption mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {progress?.currentLabel ?? 'Starting…'}
                </p>
              </div>

              {/* Progress bar */}
              {progress && (
                <div className="max-w-md mx-auto space-y-2">
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-muted)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: 'var(--primary-600)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>{progress.phase === 'classifying' ? 'Classifying' : 'Creating'}</span>
                    <span>{progress.current} / {progress.total}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Summary */}
        {step === 'summary' && summary && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Success header */}
            <div className="card p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--success-50, #f0fdf4)' }}
                >
                  <svg className="h-7 w-7" style={{ color: 'var(--success-600, #16a34a)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Upload Complete!</h2>
              <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                Successfully processed {summary.totalProcessed} items
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Tasks Created" value={summary.tasksCreated} color="var(--success-600, #16a34a)" bg="var(--success-50, #f0fdf4)" />
              <StatCard label="Projects Created" value={summary.projectsCreated} color="var(--primary-600)" bg="var(--primary-50)" />
              <StatCard label="Failed" value={summary.failed} color="var(--color-danger, #ef4444)" bg="var(--danger-50, #fef2f2)" />
              <StatCard label="Total" value={summary.totalProcessed} color="var(--color-text)" bg="var(--color-muted)" />
            </div>

            {/* Priority breakdown */}
            <div className="card p-4">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Priority Breakdown</p>
              <div className="flex gap-4">
                <PriorityBar label="High" count={summary.priorityBreakdown.High} total={summary.totalProcessed - summary.failed} color="#ef4444" />
                <PriorityBar label="Medium" count={summary.priorityBreakdown.Medium} total={summary.totalProcessed - summary.failed} color="#f59e0b" />
                <PriorityBar label="Low" count={summary.priorityBreakdown.Low} total={summary.totalProcessed - summary.failed} color="#22c55e" />
              </div>
            </div>

            {/* Created items list */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Created Items</p>
                <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                  {summary.tasksCreated + summary.projectsCreated} items
                </span>
              </div>
              <div className="max-h-[320px] overflow-y-auto divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {summary.items.map((item) => (
                  <div key={item.index} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="shrink-0 text-[11px] font-mono w-6 text-center" style={{ color: 'var(--color-muted-fg)' }}>
                      {item.index + 1}
                    </span>
                    {item.error ? (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-through truncate" style={{ color: 'var(--color-muted-fg)' }}>{item.input.text}</p>
                        <span className="text-[11px]" style={{ color: 'var(--color-danger, #ef4444)' }}>{item.error}</span>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: 'var(--color-text)' }}>
                          {item.created.project?.title ?? item.created.task?.title ?? item.input.text}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant={item.created.project ? 'primary' : 'default'} className="!text-[10px]">
                            {item.created.project ? 'Project' : 'Task'}
                          </Badge>
                          <Badge
                            variant={item.analysis.priority === 'High' ? 'danger' : item.analysis.priority === 'Medium' ? 'warning' : 'success'}
                            className="!text-[10px]"
                          >
                            {item.analysis.priority}
                          </Badge>
                          <span className="text-[10px]" style={{ color: 'var(--color-muted-fg)' }}>{item.analysis.area}</span>
                          {item.created.project?.subtasks && item.created.project.subtasks.length > 0 && (
                            <span className="text-[10px]" style={{ color: 'var(--primary-600)' }}>
                              {item.created.project.subtasks.length} subtasks
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <Badge variant={item.analysis.source === 'AI' ? 'primary' : 'warning'} className="!text-[10px] shrink-0">
                      {item.analysis.source}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => openSummaryAsPDF(summary)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Save as PDF
                </button>
                <button
                  onClick={() => {
                    setStep('upload');
                    setRawInput('');
                    setParsedItems([]);
                    setSummary(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
                >
                  Upload More
                </button>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: 'var(--primary-600)', color: '#fff' }}
              >
                Go to Tasks
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Sub-components ──

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-caption mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      <div className="h-1 rounded-full mt-2 mx-auto w-12" style={{ backgroundColor: bg }} />
    </div>
  );
}

function PriorityBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex-1">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span className="font-semibold" style={{ color }}>{count}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-muted)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
