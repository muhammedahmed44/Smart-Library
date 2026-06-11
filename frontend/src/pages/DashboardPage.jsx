import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { useHistory } from '../hooks';
import { authApi } from '../api/auth';
import { recommendationsApi } from '../api/books';
import Spinner from '../components/shared/Spinner';

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-ink-400 dark:text-ink-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="font-serif text-3xl text-ink-800 dark:text-parchment-100">{value}</p>
      {sub && <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Continue reading card ──────────────────────────────────────────────────
function ContinueCard({ item }) {
  const source = item.book?.visibility === 'public' ? 'public' : 'personal';
  const pct = Math.min(100, Math.round(parseFloat(item.completion_pct)));

  return (
    <Link to={`/reader/${source}/${item.book_id}`}
      className="card hover:shadow-md transition-shadow duration-200 flex gap-3 p-3 group">
      {/* Cover */}
      <div className="w-12 flex-shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-parchment-100 dark:bg-ink-700">
        {item.book?.cover_path ? (
          <img src={`/uploads/${item.book.cover_path}`} alt={item.book?.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-parchment-300 dark:text-ink-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-serif font-semibold text-ink-800 dark:text-parchment-100 line-clamp-1 leading-snug">
          {item.book?.title}
        </p>
        <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">
          Page {item.last_page} · {pct}% done
        </p>
        {/* Progress */}
        <div className="mt-2 h-1.5 rounded-full bg-parchment-200 dark:bg-ink-700 overflow-hidden">
          <div className="h-full rounded-full bg-ink-600 dark:bg-parchment-400 transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}

// ── Recommendation card ────────────────────────────────────────────────────
function RecommendationCard({ rec }) {
  if (!rec.book) return null;
  return (
    <Link to={`/reader/public/${rec.book_id}`}
      className="card flex-shrink-0 w-36 hover:shadow-md transition-shadow duration-200 group overflow-hidden">
      <div className="aspect-[2/3] bg-parchment-100 dark:bg-ink-700 overflow-hidden">
        {rec.book.cover_path ? (
          <img src={`/uploads/${rec.book.cover_path}`} alt={rec.book.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-parchment-300 dark:text-ink-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-serif font-semibold text-ink-800 dark:text-parchment-100 line-clamp-2 leading-tight">
          {rec.book.title}
        </p>
        {rec.reason && (
          <p className="text-[10px] text-ink-400 dark:text-ink-500 mt-1 line-clamp-1">{rec.reason}</p>
        )}
      </div>
    </Link>
  );
}

// ── Role request panel ─────────────────────────────────────────────────────
function AuthorRequestPanel() {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ['roleRequest'],
    queryFn: () => authApi.myRoleRequest().then((r) => r.data.data),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.requestAuthorRole(message),
    onSuccess: () => setSent(true),
  });

  if (existing?.status === 'pending' || sent) {
    return (
      <div className="card p-4 border-parchment-300 dark:border-ink-600">
        <div className="flex items-center gap-2">
          <span className="badge-amber">Pending</span>
          <p className="text-sm text-ink-600 dark:text-ink-300">Your author request is under review.</p>
        </div>
      </div>
    );
  }
  if (existing?.status === 'rejected') {
    return (
      <div className="card p-4 border-red-200 dark:border-red-900/50">
        <p className="text-sm text-ink-600 dark:text-ink-300 mb-1">Your previous request was not approved.</p>
        {existing.admin_note && <p className="text-xs text-ink-400 italic">"{existing.admin_note}"</p>}
      </div>
    );
  }

  return (
    <div className="card p-4">
      <p className="text-sm font-medium text-ink-700 dark:text-parchment-200 mb-2">
        Want to publish books to the public library?
      </p>
      <textarea
        className="input resize-none mb-3" rows={2}
        placeholder="Tell us a bit about yourself (optional)…"
        value={message} onChange={(e) => setMessage(e.target.value)}
      />
      <button className="btn-primary btn-sm" onClick={() => mutate()} disabled={isPending}>
        {isPending ? <Spinner size="sm" /> : 'Request Author Role'}
      </button>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user = useSelector(selectUser);
  const { data: history = [], isLoading: histLoading } = useHistory();

  const { data: recommendations = [] } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => recommendationsApi.get().then((r) => r.data.data),
  });

  // Stats
  const booksStarted = history.length;
  const booksCompleted = history.filter((h) => parseFloat(h.completion_pct) >= 95).length;
  const pagesRead = history.reduce((sum, h) => sum + (h.last_page || 0), 0);

  const inProgress = history.filter((h) => {
    const p = parseFloat(h.completion_pct);
    return p > 0 && p < 95;
  }).slice(0, 6);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-container space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="font-serif text-3xl text-ink-800 dark:text-parchment-100">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-ink-400 dark:text-ink-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Books started" value={booksStarted} />
        <StatCard label="Completed" value={booksCompleted} />
        <StatCard label="Pages read" value={pagesRead.toLocaleString()} />
      </div>

      {/* Continue reading */}
      {!histLoading && inProgress.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-xl text-ink-800 dark:text-parchment-100">Continue reading</h2>
            <Link to="/library" className="text-sm text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 transition-colors">
              Browse more →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inProgress.map((h) => <ContinueCard key={h.id} item={h} />)}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section>
          <h2 className="font-serif text-xl text-ink-800 dark:text-parchment-100 mb-3">Recommended for you</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4"
            style={{ scrollbarWidth: 'none' }}>
            {recommendations.map((rec) => <RecommendationCard key={rec.id} rec={rec} />)}
          </div>
        </section>
      )}

      {/* Author request (user role only) */}
      {user?.role === 'user' && (
        <section>
          <h2 className="font-serif text-xl text-ink-800 dark:text-parchment-100 mb-3">Become an Author</h2>
          <AuthorRequestPanel />
        </section>
      )}
    </div>
  );
}