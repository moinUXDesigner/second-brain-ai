import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TaskList } from './components/TaskList';
import { useTasks } from '@/hooks/useTasks';
import { TableSkeleton } from '@/components/ui/Skeleton';

type SortField = 'newest' | 'oldest' | 'priority' | 'impact';

const PAGE_SIZE = 10;

export function TasksPage() {
  const { data: tasks, isLoading } = useTasks();

  const [sortBy, setSortBy] = useState<SortField>('newest');
  const [filterArea, setFilterArea] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const areas = useMemo(() => {
    if (!tasks) return [];
    const set = new Set(tasks.map((t) => t.area).filter(Boolean));
    return Array.from(set).sort();
  }, [tasks]);

  const urgencies = ['High', 'Medium', 'Low'];

  const filtered = useMemo(() => {
    if (!tasks) return [];

    let list = tasks.filter((t) => t.status === 'Pending');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.area?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q),
      );
    }

    if (filterArea) {
      list = list.filter((t) => t.area === filterArea);
    }

    if (filterUrgency) {
      list = list.filter((t) => t.urgency === filterUrgency);
    }

    const sorted = [...list];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        break;
      case 'oldest':
        sorted.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        break;
      case 'priority':
        sorted.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        break;
      case 'impact':
        sorted.sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0));
        break;
    }

    return sorted;
  }, [tasks, sortBy, filterArea, filterUrgency, searchQuery]);

  // Reset to page 1 when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) setPage(safePage);

  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pendingCount = tasks?.filter((t) => t.status === 'Pending').length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-3.5rem-2rem)] lg:h-[calc(100vh-4rem-3rem)]"
    >
      {/* Header — fixed */}
      <div className="shrink-0">
        <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Tasks</h1>
        <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {filtered.length} of {pendingCount} pending task{pendingCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search + Filters — fixed */}
      <div className="shrink-0 space-y-3 pt-4 pb-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: 'var(--color-muted-fg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search tasks…"
            className="input-base pl-9 text-body"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortField); setPage(1); }}
            className="input-base text-caption w-auto pr-8"
            style={{ minWidth: 'auto' }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">Priority</option>
            <option value="impact">Impact</option>
          </select>

          <select
            value={filterArea}
            onChange={(e) => { setFilterArea(e.target.value); setPage(1); }}
            className="input-base text-caption w-auto pr-8"
            style={{ minWidth: 'auto' }}
          >
            <option value="">All Areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={filterUrgency}
            onChange={(e) => { setFilterUrgency(e.target.value); setPage(1); }}
            className="input-base text-caption w-auto pr-8"
            style={{ minWidth: 'auto' }}
          >
            <option value="">All Urgency</option>
            {urgencies.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          {(filterArea || filterUrgency || searchQuery) && (
            <button
              onClick={() => { setFilterArea(''); setFilterUrgency(''); setSearchQuery(''); setPage(1); }}
              className="px-3 py-1.5 rounded-sm text-caption font-medium transition-colors"
              style={{ color: 'var(--primary-600)' }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Task list — scrollable area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? <TableSkeleton /> : <TaskList tasks={paginated} />}
      </div>

      {/* Pagination — fixed at bottom */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between pt-3 pb-1">
          <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            Page {safePage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              className="px-3 py-1.5 rounded-sm text-caption font-medium transition-colors disabled:opacity-40"
              style={{
                backgroundColor: 'var(--color-muted)',
                color: 'var(--color-text)',
              }}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | 'dots')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('dots');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === 'dots' ? (
                  <span key={`dots-${idx}`} className="px-2 py-1.5 text-caption" style={{ color: 'var(--color-text-secondary)' }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="h-8 w-8 rounded-sm text-caption font-medium transition-colors"
                    style={{
                      backgroundColor: p === safePage ? 'var(--primary-600)' : 'var(--color-muted)',
                      color: p === safePage ? '#fff' : 'var(--color-text)',
                    }}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              className="px-3 py-1.5 rounded-sm text-caption font-medium transition-colors disabled:opacity-40"
              style={{
                backgroundColor: 'var(--color-muted)',
                color: 'var(--color-text)',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
