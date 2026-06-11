import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { selectNavSidebarCollapsed } from '../../store/slices/readerSlice';
import { useHistory } from '../../hooks';

// ── Icons ──────────────────────────────────────────────────────────────────
const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  library: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  ),
  personal: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
    </svg>
  ),
  author: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  admin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  ),
};

// ── Sidebar link ───────────────────────────────────────────────────────────
function SidebarLink({ to, icon, label, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-150 group
        ${collapsed ? 'justify-center' : ''}
        ${isActive
          ? 'bg-ink-800 text-parchment-50 dark:bg-parchment-200 dark:text-ink-900'
          : 'text-ink-500 hover:bg-parchment-100 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-parchment-200'}
      `}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

// ── Recently read mini-list ────────────────────────────────────────────────
function RecentlyRead({ onNavigate, collapsed }) {
  const { data, isLoading } = useHistory();
  const recent = data?.slice(0, 3) ?? [];

  if (isLoading || recent.length === 0 || collapsed) return null;

  return (
    <div className="mt-6 pt-4 border-t border-parchment-100 dark:border-ink-800">
      <p className="px-3 text-xs font-medium uppercase tracking-widest text-ink-300 dark:text-ink-600 mb-2">
        Continue reading
      </p>
      <div className="flex flex-col gap-1">
        {recent.map((h) => (
          <NavLink
            key={h.id}
            to={`/reader/${h.book?.visibility === 'public' ? 'public' : 'personal'}/${h.book_id}`}
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-parchment-50 dark:hover:bg-ink-800 transition-colors group"
          >
            <div className="w-8 h-10 rounded flex-shrink-0 overflow-hidden bg-parchment-200 dark:bg-ink-700">
              {h.book?.cover_path ? (
                <img src={`/uploads/${h.book.cover_path}`} alt={h.book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-ink-700 dark:text-parchment-200 truncate">{h.book?.title}</p>
              <div className="mt-1 h-1 rounded-full bg-parchment-200 dark:bg-ink-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-ink-600 dark:bg-parchment-400 transition-all"
                  style={{ width: `${Math.min(100, parseFloat(h.completion_pct))}%` }}
                />
              </div>
              <p className="text-[10px] text-ink-300 dark:text-ink-600 mt-0.5">
                {Math.round(parseFloat(h.completion_pct))}% read
              </p>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// ── Main Sidebar ───────────────────────────────────────────────────────────
export default function Sidebar({ mobileOpen, onClose, onToggleCollapse }) {
  const user = useSelector(selectUser);
  const collapsed = useSelector(selectNavSidebarCollapsed);
  const role = user?.role || 'user';

  const links = [
    { to: '/dashboard', icon: icons.dashboard, label: 'Dashboard',      show: true },
    { to: '/library',   icon: icons.library,   label: 'Public Library', show: true },
    { to: '/personal',  icon: icons.personal,  label: 'My Books',       show: true },
    { to: '/author',    icon: icons.author,    label: 'Author Panel',   show: ['author','admin'].includes(role) },
    { to: '/admin',     icon: icons.admin,     label: 'Admin Panel',    show: role === 'admin' },
  ].filter((l) => l.show);

  const sidebarContent = (
    <div className="flex flex-col h-full p-4">
      <nav className="flex flex-col gap-1">
        {links.map((l) => (
          <SidebarLink key={l.to} {...l} collapsed={collapsed} onClick={onClose} />
        ))}
      </nav>
      <RecentlyRead onNavigate={onClose} collapsed={collapsed} />

      {/* Collapse toggle button — desktop only */}
      <div className="mt-auto pt-4 border-t border-parchment-100 dark:border-ink-800 hidden lg:flex">
        <button
          onClick={onToggleCollapse}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium
            text-ink-400 hover:bg-parchment-100 hover:text-ink-700
            dark:text-ink-500 dark:hover:bg-ink-800 dark:hover:text-ink-300
            transition-colors ${collapsed ? 'justify-center' : ''}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? icons.chevronRight : icons.chevronLeft}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  const width = collapsed ? 'w-[64px]' : 'w-[240px]';

  return (
    <>
      {/* ── Desktop fixed sidebar ──────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-[60px] bottom-0 ${width}
          border-r border-parchment-200 dark:border-ink-800
          bg-white dark:bg-ink-900 overflow-y-auto z-30
          transition-all duration-200`}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile drawer ──────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-[2px] lg:hidden animate-fade-in"
            onClick={onClose}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-[240px] z-50 bg-white dark:bg-ink-900 shadow-xl lg:hidden overflow-y-auto animate-slide-in-right">
            <div className="h-[60px] flex items-center px-4 border-b border-parchment-100 dark:border-ink-800">
              <span className="font-serif text-lg text-ink-800 dark:text-parchment-100">Menu</span>
              <button onClick={onClose} className="ml-auto btn-icon btn-ghost">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
