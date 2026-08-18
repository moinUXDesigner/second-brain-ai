import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { financeService } from '@/services/endpoints/financeService';
import { formatDate } from '@/utils/dateFormat';
import type { FinanceBucket, FinanceEntry, FinanceEntryPayload, FinanceSummary } from '@/types';

type BucketFilter = FinanceBucket | 'all';

const BUCKETS: Array<{ value: FinanceBucket; label: string; tone: string; description: string }> = [
  { value: 'asset', label: 'Assets', tone: 'var(--success-600, #16a34a)', description: 'Cash, savings, inventory, gold, or other holdings' },
  { value: 'loan', label: 'Loans', tone: 'var(--danger-600, #dc2626)', description: 'Money you owe to lenders or institutions' },
  { value: 'receivable', label: 'Receivables', tone: 'var(--primary-600)', description: 'Money others owe you' },
  { value: 'handloan', label: 'Handloans', tone: 'var(--warning-600, #d97706)', description: 'Informal borrowed or payable amounts' },
];

const STATUS_OPTIONS = ['active', 'pending', 'paid', 'closed'];

const EMPTY_SUMMARY: FinanceSummary = {
  totals: {
    asset: 0,
    loan: 0,
    receivable: 0,
    handloan: 0,
  },
  counts: {
    asset: 0,
    loan: 0,
    receivable: 0,
    handloan: 0,
  },
  netPosition: 0,
  zakatBase: 0,
  zakatEstimate: 0,
  activeEntryCount: 0,
  entryCount: 0,
};

const EMPTY_FORM: FinanceEntryPayload = {
  bucket: 'asset',
  title: '',
  amount: 0,
  counterparty: '',
  dueDate: '',
  status: 'active',
  notes: '',
  zakatEligible: true,
};

function formatAmount(value: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function normalizePayload(form: FinanceEntryPayload): FinanceEntryPayload {
  return {
    ...form,
    amount: Number(form.amount) || 0,
    title: form.title.trim(),
    counterparty: form.counterparty?.trim() || undefined,
    dueDate: form.dueDate || undefined,
    notes: form.notes?.trim() || undefined,
    status: form.status || 'active',
  };
}

export function FinancePage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [summary, setSummary] = useState<FinanceSummary>(EMPTY_SUMMARY);
  const [activeBucket, setActiveBucket] = useState<BucketFilter>('all');
  const [form, setForm] = useState<FinanceEntryPayload>(EMPTY_FORM);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedBucketMeta = BUCKETS.find((bucket) => bucket.value === form.bucket) ?? BUCKETS[0];

  const visibleTotals = useMemo(
    () => [
      { label: 'Assets', value: summary.totals.asset, color: BUCKETS[0].tone },
      { label: 'Loans', value: summary.totals.loan, color: BUCKETS[1].tone },
      { label: 'Receivables', value: summary.totals.receivable, color: BUCKETS[2].tone },
      { label: 'Handloans', value: summary.totals.handloan, color: BUCKETS[3].tone },
      { label: 'Net Position', value: summary.netPosition, color: summary.netPosition >= 0 ? 'var(--success-600, #16a34a)' : 'var(--danger-600, #dc2626)' },
      { label: 'Estimated Zakat', value: summary.zakatEstimate, color: 'var(--primary-600)' },
    ],
    [summary],
  );

  const loadFinance = async (bucket: BucketFilter = activeBucket) => {
    setLoading(true);
    try {
      const [entriesRes, summaryRes] = await Promise.all([
        financeService.getEntries(bucket === 'all' ? undefined : bucket),
        financeService.getSummary(),
      ]);
      setEntries(entriesRes.data);
      setSummary(summaryRes.data);
    } catch {
      toast.error('Could not load finance ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinance(activeBucket);
  }, [activeBucket]);

  const updateForm = <K extends keyof FinanceEntryPayload>(key: K, value: FinanceEntryPayload[K]) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'bucket' && !editingEntry) {
        next.zakatEligible = value === 'asset' || value === 'receivable';
      }
      return next;
    });
  };

  const resetForm = () => {
    setEditingEntry(null);
    setForm(EMPTY_FORM);
  };

  const editEntry = (entry: FinanceEntry) => {
    setEditingEntry(entry);
    setForm({
      bucket: entry.bucket,
      title: entry.title,
      amount: entry.amount,
      counterparty: entry.counterparty || '',
      dueDate: entry.dueDate || '',
      status: entry.status || 'active',
      notes: entry.notes || '',
      zakatEligible: entry.zakatEligible,
    });
  };

  const handleSubmit = async () => {
    const payload = normalizePayload(form);
    if (!payload.title) {
      toast.error('Title is required.');
      return;
    }

    setSaving(true);
    try {
      if (editingEntry) {
        await financeService.updateEntry(editingEntry.id, payload);
        toast.success('Finance entry updated.');
      } else {
        await financeService.createEntry(payload);
        toast.success('Finance entry added.');
      }

      resetForm();
      await loadFinance();
    } catch {
      toast.error('Could not save finance entry.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (entry: FinanceEntry) => {
    if (!window.confirm(`Delete "${entry.title}" from the finance ledger?`)) return;

    try {
      await financeService.deleteEntry(entry.id);
      toast.success('Finance entry deleted.');
      await loadFinance();
      if (editingEntry?.id === entry.id) resetForm();
    } catch {
      toast.error('Could not delete finance entry.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>
            Finance
          </h1>
          <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Track assets, loans, receivables, handloans, and an estimated Zakat summary in one single-currency ledger.
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/profile/finance')}>
          Update Finance Profile
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {visibleTotals.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {item.label}
            </p>
            <p className="mt-2 text-xl font-bold" style={{ color: item.color }}>
              {formatAmount(item.value)}
            </p>
            {item.label === 'Estimated Zakat' && (
              <p className="mt-1 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                2.5% estimate
              </p>
            )}
          </Card>
        ))}
      </div>

      <Card className="border-l-4" style={{ borderLeftColor: 'var(--primary-600)' }}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Zakat Estimate
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Estimated at 2.5% of eligible asset/receivable base after active liabilities. This is a planning estimate, not a ruling.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Eligible base</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--primary-600)' }}>{formatAmount(summary.zakatBase)}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingEntry ? 'Edit Entry' : 'Add Entry'}</CardTitle>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {selectedBucketMeta.description}
            </p>
          </CardHeader>
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Bucket</span>
              <select
                value={form.bucket}
                onChange={(event) => updateForm('bucket', event.target.value as FinanceBucket)}
                className="input-base text-sm"
              >
                {BUCKETS.map((bucket) => (
                  <option key={bucket.value} value={bucket.value}>{bucket.label}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Title</span>
              <input
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                placeholder="e.g. Savings account, personal loan"
                className="input-base text-sm"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Amount</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => updateForm('amount', Number(event.target.value))}
                  className="input-base text-sm"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Status</span>
                <select
                  value={form.status}
                  onChange={(event) => updateForm('status', event.target.value)}
                  className="input-base text-sm capitalize"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Counterparty</span>
              <input
                value={form.counterparty}
                onChange={(event) => updateForm('counterparty', event.target.value)}
                placeholder="Person, bank, or institution"
                className="input-base text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Due date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => updateForm('dueDate', event.target.value)}
                className="input-base text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateForm('notes', event.target.value)}
                placeholder="Optional details"
                className="input-base min-h-[84px] resize-y text-sm"
              />
            </label>

            <label className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: 'var(--color-muted)' }}>
              <input
                type="checkbox"
                checked={form.zakatEligible}
                onChange={(event) => updateForm('zakatEligible', event.target.checked)}
                className="mt-1 h-4 w-4 rounded accent-primary-600"
              />
              <span>
                <span className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  Zakat eligible
                </span>
                <span className="block text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Include this entry in the 2.5% estimate when applicable.
                </span>
              </span>
            </label>

            <div className="flex justify-end gap-2">
              {editingEntry && (
                <Button variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleSubmit} isLoading={saving}>
                {editingEntry ? 'Save Entry' : 'Add Entry'}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Ledger</CardTitle>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {summary.activeEntryCount} active entries / {summary.entryCount} total
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveBucket('all')}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{
                  backgroundColor: activeBucket === 'all' ? 'var(--primary-600)' : 'var(--color-muted)',
                  color: activeBucket === 'all' ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                All
              </button>
              {BUCKETS.map((bucket) => (
                <button
                  key={bucket.value}
                  type="button"
                  onClick={() => setActiveBucket(bucket.value)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    backgroundColor: activeBucket === bucket.value ? bucket.tone : 'var(--color-muted)',
                    color: activeBucket === bucket.value ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  {bucket.label}
                </button>
              ))}
            </div>
          </CardHeader>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg" style={{ backgroundColor: 'var(--color-muted)' }} />
              ))}
            </div>
          ) : entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    <th className="py-2 pr-3 font-medium">Title</th>
                    <th className="py-2 pr-3 font-medium">Bucket</th>
                    <th className="py-2 pr-3 font-medium">Amount</th>
                    <th className="py-2 pr-3 font-medium">Counterparty</th>
                    <th className="py-2 pr-3 font-medium">Due</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const meta = BUCKETS.find((bucket) => bucket.value === entry.bucket) ?? BUCKETS[0];

                    return (
                      <tr key={entry.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="py-3 pr-3">
                          <p className="font-medium" style={{ color: 'var(--color-text)' }}>{entry.title}</p>
                          {entry.notes && (
                            <p className="mt-1 max-w-xs truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {entry.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ backgroundColor: 'var(--color-muted)', color: meta.tone }}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3 pr-3 font-semibold" style={{ color: 'var(--color-text)' }}>{formatAmount(entry.amount)}</td>
                        <td className="py-3 pr-3" style={{ color: 'var(--color-text-secondary)' }}>{entry.counterparty || '-'}</td>
                        <td className="py-3 pr-3" style={{ color: 'var(--color-text-secondary)' }}>{entry.dueDate ? formatDate(entry.dueDate) : '-'}</td>
                        <td className="py-3 pr-3 capitalize" style={{ color: 'var(--color-text-secondary)' }}>{entry.status}</td>
                        <td className="py-3 pr-3 text-right">
                          <button
                            type="button"
                            onClick={() => editEntry(entry)}
                            className="mr-3 text-xs font-semibold"
                            style={{ color: 'var(--primary-600)' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteEntry(entry)}
                            className="text-xs font-semibold"
                            style={{ color: 'var(--danger-600, #dc2626)' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg py-12 text-center" style={{ backgroundColor: 'var(--color-muted)' }}>
              <p className="font-medium" style={{ color: 'var(--color-text)' }}>No finance entries yet.</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Add an asset, loan, receivable, or handloan to start the ledger.
              </p>
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
