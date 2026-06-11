import { useState } from 'react';
import { useAuthorBooks, useTogglePublish } from '../hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authorApi } from '../api/books';
import BookGrid from '../components/library/BookGrid';
import UploadModal from '../components/library/UploadModal';
import EmptyState from '../components/shared/EmptyState';

export default function AuthorPanelPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data, isLoading } = useAuthorBooks();
  const { mutate: togglePublish } = useTogglePublish();
  const qc = useQueryClient();

  const { mutate: publishBook, isPending: isPublishing } = useMutation({
    mutationFn: (fd) => authorApi.publishBook(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['author', 'books'] });
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      setUploadOpen(false);
    },
  });

  const books = data?.books ?? [];
  const published = books.filter((b) => b.is_published).length;
  const drafts = books.filter((b) => !b.is_published).length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="section-title">Author Panel</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-ink-400 dark:text-ink-500">
              {published} published
            </span>
            {drafts > 0 && (
              <span className="text-sm text-ink-400 dark:text-ink-500">
                · {drafts} draft{drafts !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setUploadOpen(true)} className="btn-primary flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Publish New Book
        </button>
      </div>

      {/* Info banner */}
      {books.length > 0 && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-parchment-50 dark:bg-ink-800 border border-parchment-200 dark:border-ink-700 text-sm text-ink-600 dark:text-ink-300 flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-parchment-500 flex-shrink-0">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
          Use the Publish / Unpublish button on each card to control visibility in the public library.
        </div>
      )}

      <BookGrid
        books={books}
        isLoading={isLoading}
        source="personal"
        onTogglePublish={(id) => togglePublish(id)}
        emptyState={
          <EmptyState
            title="No publications yet"
            description="Upload a PDF to publish your first book to the public library."
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            }
            action={
              <button onClick={() => setUploadOpen(true)} className="btn-primary">
                Publish your first book
              </button>
            }
          />
        }
      />

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={(fd, { onSuccess }) => publishBook(fd, { onSuccess })}
        isUploading={isPublishing}
        mode="author"
      />
    </div>
  );
}