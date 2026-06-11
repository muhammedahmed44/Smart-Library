import Spinner from '../components/shared/Spinner';

// These are thin stubs — each will be fully built in Stages 5–8.
// They exist now so the router compiles and navigation works end-to-end.

function ComingSoon({ title }) {
  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-parchment-100 dark:bg-ink-800 flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-parchment-400">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
      </div>
      <h1 className="section-title">{title}</h1>
      <p className="text-sm text-ink-400 dark:text-ink-500">This page will be built in the next stage.</p>
    </div>
  );
}

export function DashboardPage()     { return <ComingSoon title="Dashboard" />; }
export function PublicLibraryPage() { return <ComingSoon title="Public Library" />; }
export function PersonalPage()      { return <ComingSoon title="My Books" />; }
export function AuthorPanelPage()   { return <ComingSoon title="Author Panel" />; }
export function AdminPage()         { return <ComingSoon title="Admin Panel" />; }
export function ReaderPage()        { return <ComingSoon title="Reader" />; }
export function SettingsPage()      { return <ComingSoon title="Settings" />; }

export function NotFoundPage() {
  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <p className="font-serif text-7xl text-parchment-300 dark:text-ink-700 select-none">404</p>
      <h1 className="section-title">Page not found</h1>
      <p className="text-sm text-ink-400 dark:text-ink-500">The page you're looking for doesn't exist.</p>
      <a href="/dashboard" className="btn-primary mt-2">Go to Dashboard</a>
    </div>
  );
}