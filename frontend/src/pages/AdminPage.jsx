import { useState } from 'react';
import { useRoleRequests, useActionRoleRequest, useAdminUsers } from '../hooks';
import Spinner from '../components/shared/Spinner';
import EmptyState from '../components/shared/EmptyState';

// ── Role request row ───────────────────────────────────────────────────────
function RequestRow({ req, onAction }) {
  const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-parchment-100 dark:bg-ink-700 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-ink-600 dark:text-ink-300">
            {req.requester?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink-800 dark:text-parchment-100">{req.requester?.name}</p>
          <p className="text-xs text-ink-400 dark:text-ink-500">{req.requester?.email}</p>
          {req.message && (
            <p className="text-xs text-ink-600 dark:text-ink-400 mt-1 italic">"{req.message}"</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-ink-300 dark:text-ink-600">
            {new Date(req.created_at).toLocaleDateString()}
          </span>
          <button onClick={() => setExpanded((e) => !e)} className="btn-ghost btn-sm">
            {expanded ? 'Cancel' : 'Review'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-parchment-100 dark:border-ink-700 pt-3 flex flex-col gap-2 animate-fade-in">
          <div>
            <label className="label">Admin note (optional)</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Visible to user on next login…" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onAction(req.id, 'approved', note)}
              className="btn-primary btn-sm flex-1 justify-center"
            >
              Approve
            </button>
            <button
              onClick={() => onAction(req.id, 'rejected', note)}
              className="btn-danger btn-sm flex-1 justify-center"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── User row ──────────────────────────────────────────────────────────────
function UserRow({ user }) {
  const roleColor = {
    admin: 'badge-red',
    author: 'badge-amber',
    user: 'badge-ink',
  }[user.role] || 'badge-ink';

  return (
    <div className="flex items-center gap-3 py-2 border-b border-parchment-100 dark:border-ink-800 last:border-0">
      <div className="w-8 h-8 rounded-full bg-parchment-100 dark:bg-ink-700 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-medium text-ink-600 dark:text-ink-300">
          {user.name?.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-800 dark:text-parchment-100 truncate">{user.name}</p>
        <p className="text-xs text-ink-400 dark:text-ink-500 truncate">{user.email}</p>
      </div>
      <span className={roleColor}>{user.role}</span>
      <span className="text-xs text-ink-300 dark:text-ink-600 hidden sm:block">
        {new Date(user.created_at).toLocaleDateString()}
      </span>
    </div>
  );
}

// ── Admin page ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState('requests');
  const [requestFilter, setRequestFilter] = useState('pending');

  const { data: requestsData, isLoading: reqLoading } = useRoleRequests({ status: requestFilter });
  const { data: usersData, isLoading: usersLoading } = useAdminUsers();
  const { mutate: actionRequest, isPending: actioning } = useActionRoleRequest();

  const requests = requestsData?.requests ?? [];
  const users = usersData?.users ?? [];
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const tabs = [
    { key: 'requests', label: 'Role Requests', count: requestFilter === 'pending' ? pendingCount : null },
    { key: 'users', label: 'Users' },
  ];

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="section-title">Admin Panel</h1>
        <p className="text-sm text-ink-400 dark:text-ink-500 mt-1">Manage users and content requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-parchment-200 dark:border-ink-800 mb-6">
        {tabs.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2
              ${tab === key
                ? 'text-ink-800 dark:text-parchment-100 border-b-2 border-ink-700 dark:border-parchment-300 -mb-px'
                : 'text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300'}`}>
            {label}
            {count != null && count > 0 && (
              <span className="badge-red">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Role requests tab */}
      {tab === 'requests' && (
        <div className="flex flex-col gap-4">
          {/* Status filter */}
          <div className="flex gap-2">
            {['pending', 'approved', 'rejected'].map((s) => (
              <button key={s} onClick={() => setRequestFilter(s)}
                className={`badge cursor-pointer transition-colors capitalize
                  ${requestFilter === s ? 'bg-ink-700 text-parchment-50 dark:bg-parchment-200 dark:text-ink-900' : 'badge-ink'}`}>
                {s}
              </button>
            ))}
          </div>

          {reqLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : requests.length === 0 ? (
            <EmptyState
              title={`No ${requestFilter} requests`}
              description="Role requests will appear here."
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
            />
          ) : (
            requests.map((req) => (
              <RequestRow
                key={req.id}
                req={req}
                onAction={(id, action, note) => actionRequest({ id, action, adminNote: note })}
              />
            ))
          )}
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-ink-600 dark:text-ink-300">
              {usersData?.pagination?.total ?? 0} total users
            </p>
          </div>
          {usersLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div>
              {users.map((u) => <UserRow key={u.id} user={u} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}