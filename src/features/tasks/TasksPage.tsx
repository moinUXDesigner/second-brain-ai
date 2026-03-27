import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TaskList } from './components/TaskList';
import { useTasks } from '@/hooks/useTasks';
import { TableSkeleton } from '@/components/ui/Skeleton';
import type { Task } from '@/types';

type SortField = 'newest' | 'oldest' | 'priority' | 'impact';

export function TasksPage() {
  const { data: tasks, isLoading } = useTasks();

  const [sortBy, setSortBy] = useState<SortField>('newest');
  const [filterArea, setFilterArea] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Derive unique area values from tasks
  const areas = useMemo(() => {
    if (!tasks) return [];
    const set = new Set(tasks.map((t) => t.area).filter(Boolean));
    return Array.from(set).sort();
  }, [tasks]);

  const urgencies = ['High', 'Medium', 'Low'];

  // Filter: only pending, then apply user filters + sort
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

    // Sort
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

  const pendingCount = tasks?.filter((t) => t.status === 'Pending').length ?? 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Tasks</h1>
        <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {pendingCount} pending task{pendingCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search + Sort + Filters bar */}
      <div className="space-y-3">
        {/* Search */}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks…"
            className="input-base pl-9 text-body"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="input-base text-caption w-auto pr-8"
            style={{ minWidth: 'auto' }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">Priority</option>
            <option value="impact">Impact</option>
          </select>

          {/* Area filter */}
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="input-base text-caption w-auto pr-8"
            style={{ minWidth: 'auto' }}
          >
            <option value="">All Areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Urgency filter */}
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="input-base text-caption w-auto pr-8"
            style={{ minWidth: 'auto' }}
          >
            <option value="">All Urgency</option>
            {urgencies.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          {/* Clear filters */}
          {(filterArea || filterUrgency || searchQuery) && (
            <button
              onClick={() => { setFilterArea(''); setFilterUrgency(''); setSearchQuery(''); }}
              className="px-3 py-1.5 rounded-sm text-caption font-medium transition-colors"
              style={{ color: 'var(--primary-600)' }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {isLoading ? <TableSkeleton /> : <TaskList tasks={filtered} />}
    </motion.div>
  );
}
