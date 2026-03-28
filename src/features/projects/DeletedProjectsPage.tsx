import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDeletedProjects } from '@/hooks/useProjects';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const PAGE_SIZE = 9;

export function DeletedProjectsPage() {
  const { data: projects, isLoading, isError } = useDeletedProjects();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!projects) return [];
    let list = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }

    // newest deleted first
    list.sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
    return list;
  }, [projects, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-h1 text-neutral-900 dark:text-neutral-50">Deleted Projects</h1>
        <p className="text-body text-neutral-500 mt-1">Projects that have been removed</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search deleted projects..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full rounded-md border py-2 pl-10 pr-3 text-caption"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="card p-8 text-center">
          <p className="text-body text-neutral-500">Unable to load deleted projects.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-body text-neutral-500">No deleted projects.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((p) => (
              <Card key={p.id} className="flex flex-col gap-4 cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/projects/${p.id}`)}>
                <div className="flex items-start justify-between">
                  <h3 className="text-body font-semibold text-neutral-900 dark:text-neutral-50 flex-1 min-w-0 mr-2">{p.title}</h3>
                  <Badge variant="danger">Deleted</Badge>
                </div>

                {p.description && (
                  <p className="text-caption text-neutral-500 line-clamp-2">{p.description}</p>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between text-caption text-neutral-500">
                    <span>Progress</span>
                    <span>{p.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div className="h-full rounded-full bg-neutral-400 transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>

                <div className="flex justify-between text-caption text-neutral-400">
                  <span>{p.subtasks?.filter((s) => s.status === 'Done').length ?? 0}/{p.subtasks?.length ?? 0} subtasks done</span>
                  {p.updatedAt && <span>Deleted {new Date(p.updatedAt).toLocaleDateString()}</span>}
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-md text-caption font-medium transition-colors disabled:opacity-40"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
              >
                Previous
              </button>
              <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-md text-caption font-medium transition-colors disabled:opacity-40"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
