import { useState } from 'react';
import { usePublicBooks, useHistory } from '../hooks';
import BookGrid from '../components/library/BookGrid';
import BookFilters from '../components/library/BookFilters';
import Pagination from '../components/shared/Pagination';
import EmptyState from '../components/shared/EmptyState';

export default function PublicLibraryPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 24, sort: 'published_at', order: 'DESC' });
  const { data, isLoading } = usePublicBooks(filters);
  const { data: history = [] } = useHistory();

  // Build a progress map from reading history
  const progressMap = Object.fromEntries(
    history.map((h) => [String(h.book_id), h.completion_pct])
  );

  const books = data?.books ?? [];
  const pagination = data?.pagination;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="section-title">Public Library</h1>
          <p className="text-sm text-ink-400 dark:text-ink-500 mt-1">
            {pagination?.total != null ? `${pagination.total} books available` : 'Browse all published books'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <BookFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Grid */}
      <BookGrid
        books={books}
        isLoading={isLoading}
        source="public"
        progressMap={progressMap}
        emptyState={
          <EmptyState
            title="No books found"
            description="Try adjusting your search or filters."
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
              </svg>
            }
          />
        }
      />

      <Pagination pagination={pagination} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
    </div>
  );
}