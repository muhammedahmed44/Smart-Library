import { useState, useRef, useCallback } from 'react';
import Modal from '../shared/Modal';
import Spinner from '../shared/Spinner';

const GENRES = [
  'Fiction','Non-Fiction','Science','Technology','History','Philosophy',
  'Biography','Self-Help','Business','Art','Poetry','Mystery','Romance',
  'Science Fiction','Fantasy','Horror','Travel','Children',
];

export default function UploadModal({ isOpen, onClose, onUpload, isUploading, mode = 'personal' }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [meta, setMeta] = useState({ title: '', description: '', genre: '' });
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const reset = () => {
    setFile(null); setMeta({ title: '', description: '', genre: '' }); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const validateAndSet = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { setError('Only PDF files are accepted.'); return; }
    if (f.size > 20 * 1024 * 1024) { setError('File must be under 20 MB.'); return; }
    setError('');
    setFile(f);
    if (!meta.title) setMeta((m) => ({ ...m, title: f.name.replace(/\.pdf$/i, '') }));
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  }, [meta.title]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a PDF file.'); return; }
    if (!meta.title.trim()) { setError('Book title is required.'); return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', meta.title.trim());
    fd.append('description', meta.description.trim());
    fd.append('genre', meta.genre);
    onUpload(fd, { onSuccess: handleClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}
      title={mode === 'author' ? 'Publish to Public Library' : 'Upload to My Books'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
            transition-all duration-150
            ${dragging
              ? 'border-parchment-500 bg-parchment-50 dark:bg-ink-700'
              : file
              ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
              : 'border-parchment-300 dark:border-ink-600 hover:border-parchment-500 dark:hover:border-ink-400'}
          `}
        >
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
            onChange={(e) => validateAndSet(e.target.files?.[0])} />

          {file ? (
            <div className="flex items-center justify-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-500 flex-shrink-0">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-ink-700 dark:text-parchment-200 truncate max-w-[240px]">
                  {file.name}
                </p>
                <p className="text-xs text-ink-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="ml-auto btn-icon btn-ghost text-ink-400">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                className="text-parchment-400 dark:text-ink-500">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-ink-600 dark:text-ink-300">
                  Drop PDF here or <span className="text-parchment-600 dark:text-parchment-400">browse</span>
                </p>
                <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">Max 20 MB · PDF only</p>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Metadata */}
        <div>
          <label className="label">Title <span className="text-red-400">*</span></label>
          <input className="input" value={meta.title}
            onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
            placeholder="Enter book title" required />
        </div>

        <div>
          <label className="label">Genre</label>
          <select className="input" value={meta.genre}
            onChange={(e) => setMeta((m) => ({ ...m, genre: e.target.value }))}>
            <option value="">— Select genre —</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} value={meta.description}
            onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
            placeholder="Short description (optional)" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button type="button" className="btn-secondary flex-1 justify-center" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={isUploading}>
            {isUploading ? <Spinner size="sm" /> : mode === 'author' ? 'Publish' : 'Upload'}
          </button>
        </div>
      </form>
    </Modal>
  );
}