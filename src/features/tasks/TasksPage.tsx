import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TaskList } from './components/TaskList';
import { AdvancedTaskTable } from './components/AdvancedTaskTable';
import { useTasks, useDeleteTask, useUpdateTaskStatus } from '@/hooks/useTasks';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { taskService } from '@/services/endpoints/taskService';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import toast from 'react-hot-toast';

type SortField = 'newest' | 'oldest' | 'priority' | 'impact';

const PAGE_SIZE = 10;

export function TasksPage() {
  const navigate = useNavigate();
  const { data: tasks, isLoading } = useTasks();
  const deleteTask = useDeleteTask();
  const completeTask = useUpdateTaskStatus();

  const [sortBy, setSortBy] = useState<SortField>('newest');
  const [filterArea, setFilterArea] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [assigningDates, setAssigningDates] = useState(false);
  const queryClient = useQueryClient();

  const missingDueDateCount = useMemo(
    () => tasks?.filter((t) => t.status === 'Pending' && !t.dueDate).length ?? 0,
    [tasks],
  );

  const handleAssignDueDates = async () => {
    setAssigningDates(true);
    const toastId = toast.loading('AI is assigning due dates…');
    try {
      const res = await taskService.assignDueDates();
      toast.success(`Done! ${res.data.updated} tasks updated.`, { id: toastId });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
    } catch {
      toast.error('Failed to assign due dates.', { id: toastId });
    } finally {
      setAssigningDates(false);
    }
  };

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pendingCount = tasks?.filter((t) => t.status === 'Pending').length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-3.5rem-6.5rem)] lg:h-[calc(100vh-4rem-3rem)]"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Tasks</h1>
          <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            {filtered.length} of {pendingCount} pending
          </span>
        </div>
        <div className="flex items-center gap-2">
          {missingDueDateCount > 0 && (
            <button
              onClick={handleAssignDueDates}
              disabled={assigningDates}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {assigningDates ? 'Assigning…' : `AI Assign Dates (${missingDueDateCount})`}
            </button>
          )}
          <button
            onClick={() => navigate('/bulk-upload')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)' }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="shrink-0 space-y-2 pt-3 pb-2">
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
            className="input-base pl-9 text-sm h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortField); setPage(1); }}
            className="shrink-0 text-xs rounded-full py-1 pl-2.5 pr-6 border outline-none"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="priority">Priority</option>
            <option value="impact">Impact</option>
          </select>

          <select
            value={filterArea}
            onChange={(e) => { setFilterArea(e.target.value); setPage(1); }}
            className="shrink-0 text-xs rounded-full py-1 pl-2.5 pr-6 border outline-none"
            style={{ borderColor: filterArea ? 'var(--primary-500)' : 'var(--color-border)', backgroundColor: filterArea ? 'var(--primary-50)' : 'var(--color-surface)', color: filterArea ? 'var(--primary-700)' : 'var(--color-text)' }}
          >
            <option value="">All Areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={filterUrgency}
            onChange={(e) => { setFilterUrgency(e.target.value); setPage(1); }}
            className="shrink-0 text-xs rounded-full py-1 pl-2.5 pr-6 border outline-none"
            style={{ borderColor: filterUrgency ? 'var(--primary-500)' : 'var(--color-border)', backgroundColor: filterUrgency ? 'var(--primary-50)' : 'var(--color-surface)', color: filterUrgency ? 'var(--primary-700)' : 'var(--color-text)' }}
          >
            <option value="">All Urgency</option>
            {urgencies.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          {(filterArea || filterUrgency || searchQuery) && (
            <button
              onClick={() => { setFilterArea(''); setFilterUrgency(''); setSearchQuery(''); setPage(1); }}
              className="shrink-0 text-xs font-medium px-2 py-1 rounded-full"
              style={{ color: 'var(--primary-600)' }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Task list — scrollable area */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>
            {/* Mobile view */}
            <div className="md:hidden">
              <TaskList
                tasks={paginated}
                onDelete={(id) => deleteTask.mutate(id)}
                deletingId={deleteTask.isPending ? (deleteTask.variables ?? null) : null}
                onComplete={(id) => completeTask.mutate({ id, status: 'Done' })}
                completingId={completeTask.isPending ? (completeTask.variables?.id ?? null) : null}
              />
            </div>
            {/* Desktop view with advanced table */}
            <div className="hidden md:block">
              <AdvancedTaskTable
                tasks={filtered}
                onDelete={(id) => deleteTask.mutate(id)}
                deletingId={deleteTask.isPending ? (deleteTask.variables ?? null) : null}
                onComplete={(id) => completeTask.mutate({ id, status: 'Done' })}
                completingId={completeTask.isPending ? (completeTask.variables?.id ?? null) : null}
              />
            </div>
          </>
        )}
      </div>

      {/* Pagination — fixed at bottom */}
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
              style={{
                backgroundColor: 'var(--color-muted)',
                color: 'var(--color-text)',
              }}
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
