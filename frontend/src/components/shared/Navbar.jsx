import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useLogout } from '../../hooks';
import { useState, useRef, useEffect } from 'react';

// ── Icons (inline SVG, no external deps) ──────────────────────────────────
const BookOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);

// ── Nav link definition ────────────────────────────────────────────────────
function useNavLinks(role) {
  const links = [
    { to: '/dashboard',       label: 'Dashboard',       roles: ['user', 'author', 'admin'] },
    { to: '/library',         label: 'Public Library',  roles: ['user', 'author', 'admin'] },
    { to: '/personal',        label: 'My Books',        roles: ['user', 'author', 'admin'] },
    { to: '/author',          label: 'Author Panel',    roles: ['author', 'admin'] },
    { to: '/admin',           label: 'Admin',           roles: ['admin'] },
  ];
  return links.filter((l) => l.roles.includes(role));
}

// ── User avatar dropdown ───────────────────────────────────────────────────
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleBadge = { user: 'Reader', author: 'Author', admin: 'Admin' }[user.role];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-parchment-100 dark:hover:bg-ink-700 transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-ink-700 dark:bg-parchment-300 flex items-center justify-center">
          <span className="text-xs font-medium text-parchment-50 dark:text-ink-800">{initials}</span>
        </div>
        <span className="hidden sm:block text-sm font-medium text-ink-700 dark:text-parchment-200 max-w-[120px] truncate">
          {user.name}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 card-elevated rounded-xl shadow-lg py-1 z-50 animate-slide-up">
          <div className="px-3 py-2 border-b border-parchment-100 dark:border-ink-700">
            <p className="text-sm font-medium text-ink-800 dark:text-parchment-100 truncate">{user.name}</p>
            <p className="text-xs text-ink-400 dark:text-ink-500 truncate">{user.email}</p>
            <span className="badge-amber mt-1">{roleBadge}</span>
          </div>

          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-ink-600 dark:text-ink-300 hover:bg-parchment-50 dark:hover:bg-ink-700 transition-colors"
          >
            Settings
          </Link>

          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Navbar ────────────────────────────────────────────────────────────
export default function Navbar({ theme, onToggleTheme }) {
  const user = useSelector(selectUser);
  const { mutate: logout } = useLogout();
  const location = useLocation();
  const navLinks = useNavLinks(user?.role || 'user');

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-40 h-[60px]
        bg-white/90 dark:bg-ink-900/90
        backdrop-blur-md
        border-b border-parchment-200 dark:border-ink-800
      "
    >
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-6">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-ink-800 dark:bg-parchment-200 flex items-center justify-center text-parchment-50 dark:text-ink-800">
            <BookOpenIcon />
          </div>
          <span className="font-serif text-lg text-ink-800 dark:text-parchment-100 hidden sm:block">
            E-Library
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map(({ to, label }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-parchment-100 text-ink-800 dark:bg-ink-700 dark:text-parchment-100'
                    : 'text-ink-500 hover:text-ink-800 hover:bg-parchment-50 dark:text-ink-400 dark:hover:text-parchment-200 dark:hover:bg-ink-800'}
                `}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="btn-icon btn-ghost"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* User menu */}
          {user && <UserMenu user={user} onLogout={logout} />}
        </div>
      </div>
    </header>
  );
}