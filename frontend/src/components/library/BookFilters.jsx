import { useGenres } from '../../hooks';

const SORT_OPTIONS = [
  { value: 'published_at-DESC', label: 'Newest first' },
  { value: 'published_at-ASC',  label: 'Oldest first' },
  { value: 'title-ASC',         label: 'Title A–Z' },
  { value: 'title-DESC',        label: 'Title Z–A' },
];

export default function BookFilters({ filters, onChange }) {
  const { data: genres = [] } = useGenres();

  const set = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  const [sort, order] = (filters.sort || 'published_at-DESC').split('-');
  const handleSort = (val) => {
    const [s, o] = val.split('-');
    onChange({ ...filters, sort: s, order: o, page: 1 });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search + Sort row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 dark:text-ink-600"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search books…"
            value={filters.search || ''}
            onChange={(e) => set('search', e.target.value)}
            className="input pl-9"
          />
        </div>

        <select
          value={`${filters.sort || 'published_at'}-${filters.order || 'DESC'}`}
          onChange={(e) => handleSort(e.target.value)}
          className="input w-auto pr-8 cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Genre pills */}
      {genres.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => set('genre', undefined)}
            className={`badge transition-colors cursor-pointer ${
              !filters.genre
                ? 'bg-ink-700 text-parchment-50 dark:bg-parchment-200 dark:text-ink-900'
                : 'badge-ink hover:bg-ink-200 dark:hover:bg-ink-600'
            }`}
          >
            All
          </button>
          {genres.map(({ genre, count }) => (
            <button
              key={genre}
              onClick={() => set('genre', filters.genre === genre ? undefined : genre)}
              className={`badge transition-colors cursor-pointer ${
                filters.genre === genre
                  ? 'bg-ink-700 text-parchment-50 dark:bg-parchment-200 dark:text-ink-900'
                  : 'badge-ink hover:bg-ink-200 dark:hover:bg-ink-600'
              }`}
            >
              {genre}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}