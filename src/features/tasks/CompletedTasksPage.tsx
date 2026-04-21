import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/dateFormat';

const PAGE_SIZE = 10;

export function CompletedTasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const updateStatus = useUpdateTaskStatus();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [page, setPage] = useState(1);

  const areas = useMemo(() => {
    if (!tasks) return [];
    const set = new Set(
      tasks.filter((t) => t.status === 'Done' || t.status === 'Deleted').map((t) => t.area).filter(Boolean),
    );
    return Array.from(set).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    if (!tasks) return [];

    let list = [...tasks.filter((t) => t.status === 'Done' || t.status === 'Deleted')];

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

    // newest completed first
    list.sort((a, b) => (b.completedAt || b.createdAt || '').localeCompare(a.completedAt || a.createdAt || ''));
    
    return list;
  }, [tasks, searchQuery, filterArea]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const doneCount = tasks?.filter((t) => t.status === 'Done' || t.status === 'Deleted').length ?? 0;

  const handleReopen = (id: string) => {
    updateStatus.mutate({ id, status: 'Pending' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-3.5rem-2rem)] lg:h-[calc(100vh-4rem-3rem)]"
    >
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Completed / Deleted</h1>
        <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {filtered.length} of {doneCount} completed task{doneCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search + Filters */}
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
            placeholder="Search completed tasks…"
            className="input-base pl-9 text-body"
          />
        </div>

        <div className="flex flex-wrap gap-2">
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

          {(filterArea || searchQuery) && (
            <button
              onClick={() => { setFilterArea(''); setSearchQuery(''); setPage(1); }}
              className="px-3 py-1.5 rounded-sm text-caption font-medium transition-colors"
              style={{ color: 'var(--primary-600)' }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <TableSkeleton />
        ) : paginated.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
              No completed tasks found.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {paginated.map((task) => (
                <div key={task.id} className="card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-body font-medium line-through opacity-70" style={{ color: 'var(--color-text)' }}>
                        {task.title}
                      </p>
                      {task.area && (
                        <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{task.area}</p>
                      )}
                    </div>
                    <Badge variant={task.status === 'Deleted' ? 'danger' : 'success'} className="!text-[10px] !px-1.5 !py-0.5">{task.status === 'Deleted' ? 'Deleted' : 'Done'}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap text-caption">
                      <Badge className="!text-[10px] !px-1.5 !py-0.5">{task.type || '—'}</Badge>
                      {task.completedAt && (
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {formatDate(task.completedAt)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleReopen(task.id)}
                      disabled={updateStatus.isPending}
                      className="shrink-0 px-3 py-1.5 rounded-md text-caption font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--color-muted)',
                        color: 'var(--primary-600)',
                      }}
                    >
                      ↩ Reopen
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="card overflow-hidden hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-muted)' }}>
                      <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Title</th>
                      <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Type</th>
                      <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Area</th>
                      <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                      <th className="px-4 py-3 text-left text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Completed</th>
                      <th className="px-4 py-3 text-right text-caption font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((task, i) => (
                      <tr
                        key={task.id}
                        className="transition-colors"
                        style={{
                          borderBottom: i < paginated.length - 1 ? '1px solid var(--color-border)' : undefined,
                        }}
                      >
                        <td className="px-4 py-3">
                          <p className="text-body font-medium line-through opacity-70" style={{ color: 'var(--color-text)' }}>
                            {task.title}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="!text-[10px] !px-1.5 !py-0.5">{task.type || '—'}</Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{task.area || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={task.status === 'Deleted' ? 'danger' : 'success'} className="!text-[10px] !px-1.5 !py-0.5">{task.status === 'Deleted' ? 'Deleted' : 'Done'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                            {task.completedAt ? formatDate(task.completedAt) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleReopen(task.id)}
                            disabled={updateStatus.isPending}
                            className="px-3 py-1.5 rounded-md text-caption font-medium transition-colors disabled:opacity-40"
                            style={{
                              backgroundColor: 'var(--color-muted)',
                              color: 'var(--primary-600)',
                            }}
                          >
                            ↩ Reopen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between pt-3 pb-1">
          <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="px-3 py-1.5 rounded-sm text-caption font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
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
                      backgroundColor: p === currentPage ? 'var(--primary-600)' : 'var(--color-muted)',
                      color: p === currentPage ? '#fff' : 'var(--color-text)',
                    }}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="px-3 py-1.5 rounded-sm text-caption font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
