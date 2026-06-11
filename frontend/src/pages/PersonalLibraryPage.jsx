import { useState } from 'react';
import { usePersonalBooks, useUploadBook, useDeleteBook } from '../hooks';
import BookGrid from '../components/library/BookGrid';
import UploadModal from '../components/library/UploadModal';
import EmptyState from '../components/shared/EmptyState';

export default function PersonalLibraryPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data, isLoading } = usePersonalBooks();
  const { mutate: uploadBook, isPending: isUploading } = useUploadBook();
  const { mutate: deleteBook } = useDeleteBook();

  const books = data?.books ?? [];

  const handleDelete = (id) => {
    if (window.confirm('Delete this book? This cannot be undone.')) {
      deleteBook(id);
    }
  };

  return (
    <div className="page-container">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="section-title">My Books</h1>
          <p className="text-sm text-ink-400 dark:text-ink-500 mt-1">
            Your private PDF collection
          </p>
        </div>
        <button onClick={() => setUploadOpen(true)} className="btn-primary flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Upload PDF
        </button>
      </div>

      <BookGrid
        books={books}
        isLoading={isLoading}
        source="personal"
        onDelete={handleDelete}
        emptyState={
          <EmptyState
            title="No books yet"
            description="Upload your first PDF to start reading with AI assistance."
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            }
            action={
              <button onClick={() => setUploadOpen(true)} className="btn-primary">
                Upload your first book
              </button>
            }
          />
        }
      />

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={(fd, { onSuccess }) => uploadBook(fd, { onSuccess })}
        isUploading={isUploading}
        mode="personal"
      />
    </div>
  );
}