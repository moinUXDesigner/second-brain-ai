import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TaskList } from './components/TaskList';
import { useTasks, useUpdateTaskStatus, useCreateTask } from '@/hooks/useTasks';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Task } from '@/types';

const PAGE_SIZE = 10;

export function NotesIdeasPage() {
  const { data: tasks, isLoading } = useTasks();
  const updateStatus = useUpdateTaskStatus();
  const createTask = useCreateTask();

  const [filterArea, setFilterArea] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemType, setNewItemType] = useState<'Note' | 'Idea'>('Note');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemArea, setNewItemArea] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');

  const areas = useMemo(() => {
    if (!tasks) return [];
    const set = new Set(
      tasks
        .filter((t) => t.status === 'Note' || t.status === 'Idea')
        .map((t) => t.area)
        .filter(Boolean),
    );
    return Array.from(set).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    if (!tasks) return [];

    let list = tasks.filter((t) => t.status === 'Note' || t.status === 'Idea');

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

    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [tasks, filterArea, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;

    await createTask.mutateAsync({
      title: newItemTitle.trim(),
      status: newItemType,
      area: newItemArea.trim() || undefined,
      notes: newItemNotes.trim() || undefined,
    });

    setNewItemTitle('');
    setNewItemArea('');
    setNewItemNotes('');
    setShowAddForm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-3.5rem-6.5rem)] lg:h-[calc(100vh-4rem-3rem)]"
    >
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Notes & Ideas</h1>
          <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            {filtered.length} items
          </span>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add {showAddForm ? '' : 'Note/Idea'}
        </Button>
      </div>

      {showAddForm && (
        <div className="shrink-0 card p-4 space-y-3 mt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewItemType('Note')}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: newItemType === 'Note' ? 'var(--primary-100)' : 'var(--color-muted)',
                color: newItemType === 'Note' ? 'var(--primary-700)' : 'var(--color-text-secondary)',
              }}
            >
              Note
            </button>
            <button
              onClick={() => setNewItemType('Idea')}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: newItemType === 'Idea' ? 'var(--primary-100)' : 'var(--color-muted)',
                color: newItemType === 'Idea' ? 'var(--primary-700)' : 'var(--color-text-secondary)',
              }}
            >
              Idea
            </button>
          </div>

          <Input
            id="title"
            label="Title"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Enter title..."
            required
          />

          <Input
            id="area"
            label="Area (optional)"
            value={newItemArea}
            onChange={(e) => setNewItemArea(e.target.value)}
            placeholder="e.g., Work, Personal, Health"
          />

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={newItemNotes}
              onChange={(e) => setNewItemNotes(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="input-base w-full resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddItem}
              isLoading={createTask.isPending}
              disabled={!newItemTitle.trim()}
            >
              Add {newItemType}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddForm(false);
                setNewItemTitle('');
                setNewItemArea('');
                setNewItemNotes('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

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
            placeholder="Search notes & ideas…"
            className="input-base pl-9 text-sm h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
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

          {(filterArea || searchQuery) && (
            <button
              onClick={() => { setFilterArea(''); setSearchQuery(''); setPage(1); }}
              className="shrink-0 text-xs font-medium px-2 py-1 rounded-full"
              style={{ color: 'var(--primary-600)' }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <TaskList
            tasks={paginated}
            onDelete={() => undefined}
            onComplete={(id) => updateStatus.mutate({ id, status: 'Done' })}
            deletingId={null}
            completingId={updateStatus.isPending ? updateStatus.variables?.id ?? null : null}
          />
        )}
      </div>

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
              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
            >
              Previous
            </button>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
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
