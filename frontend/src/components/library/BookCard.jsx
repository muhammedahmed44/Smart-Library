import { Link } from 'react-router-dom';

function ProgressRing({ pct, size = 36 }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, pct) / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        strokeWidth="3" className="stroke-parchment-200 dark:stroke-ink-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        strokeWidth="3" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        className="stroke-ink-600 dark:stroke-parchment-400 transition-all duration-500" />
    </svg>
  );
}

export default function BookCard({ book, progress, source = 'public', onDelete, onTogglePublish }) {
  const readerPath = `/reader/${source}/${book.id}`;
  const coverSrc = book.cover_path ? `/uploads/${book.cover_path}` : null;

  return (
    <div className="card group relative flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Cover */}
      <Link to={readerPath} className="block aspect-[2/3] bg-parchment-100 dark:bg-ink-700 overflow-hidden flex-shrink-0">
        {coverSrc ? (
          <img src={coverSrc} alt={book.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1" className="text-parchment-300 dark:text-ink-600">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            <span className="text-xs font-serif text-parchment-400 dark:text-ink-600 leading-tight line-clamp-3">
              {book.title}
            </span>
          </div>
        )}
      </Link>

      {/* Badges overlay */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {book.genre && <span className="badge-amber">{book.genre}</span>}
        {book.is_published === false && book.visibility === 'private' && (
          <span className="badge-ink">Private</span>
        )}
        {book.is_published && <span className="badge-green">Published</span>}
      </div>

      {/* Progress ring overlay */}
      {progress != null && progress > 0 && (
        <div className="absolute top-2 right-2 bg-white/90 dark:bg-ink-900/90 rounded-full p-0.5">
          <ProgressRing pct={parseFloat(progress)} />
        </div>
      )}

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <Link to={readerPath}>
          <h3 className="font-serif text-sm font-semibold text-ink-800 dark:text-parchment-100
            line-clamp-2 leading-snug hover:text-parchment-600 dark:hover:text-parchment-300 transition-colors">
            {book.title}
          </h3>
        </Link>

        {book.author && (
          <p className="text-xs text-ink-400 dark:text-ink-500 truncate">
            {book.author.name}
          </p>
        )}

        {book.total_pages > 0 && (
          <p className="text-[11px] text-ink-300 dark:text-ink-600">
            {book.total_pages} pages
          </p>
        )}

        {/* Action row */}
        {(onDelete || onTogglePublish) && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-parchment-100 dark:border-ink-700">
            {onTogglePublish && (
              <button onClick={() => onTogglePublish(book.id)}
                className="btn btn-sm btn-secondary flex-1 justify-center text-[11px]">
                {book.is_published ? 'Unpublish' : 'Publish'}
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(book.id)}
                className="btn btn-sm btn-ghost text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}