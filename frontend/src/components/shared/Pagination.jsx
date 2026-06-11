export default function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages } = pagination;

  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="btn btn-sm btn-secondary disabled:opacity-30">
        ←
      </button>

      {pages[0] > 1 && (
        <>
          <button onClick={() => onChange(1)} className="btn btn-sm btn-ghost">1</button>
          {pages[0] > 2 && <span className="px-1 text-ink-300">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button key={p} onClick={() => onChange(p)}
          className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}>
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-ink-300">…</span>}
          <button onClick={() => onChange(totalPages)} className="btn btn-sm btn-ghost">{totalPages}</button>
        </>
      )}

      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
        className="btn btn-sm btn-secondary disabled:opacity-30">
        →
      </button>
    </div>
  );
}