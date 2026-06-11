import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import { authApi } from '../api/auth';
import Spinner from '../components/shared/Spinner';

// ── Form field ──────────────────────────────────────────────────────────────
function Field({ label, id, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} className={`input ${error ? 'input-error' : ''}`} {...props} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Login form ──────────────────────────────────────────────────────────────
function LoginForm({ onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.login(form),
    onSuccess: (res) => {
      dispatch(setUser(res.data.data));
      onSuccess();
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    },
  });

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setError(''); mutate(); }}
      className="flex flex-col gap-4"
    >
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      <Field label="Email" id="email" name="email" type="email" value={form.email}
        onChange={handle} autoComplete="email" required placeholder="you@example.com" />
      <Field label="Password" id="password" name="password" type="password" value={form.password}
        onChange={handle} autoComplete="current-password" required placeholder="••••••••" />

      <button type="submit" className="btn-primary w-full justify-center mt-2" disabled={isPending}>
        {isPending ? <Spinner size="sm" /> : 'Sign in'}
      </button>
    </form>
  );
}

// ── Register form ────────────────────────────────────────────────────────────
function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.register({ name: form.name, email: form.email, password: form.password }),
    onSuccess: (res) => {
      dispatch(setUser(res.data.data));
      onSuccess();
    },
    onError: (err) => {
      setErrors({ server: err.response?.data?.message || 'Registration failed.' });
    },
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (validate()) mutate(); }}
      className="flex flex-col gap-4"
    >
      {errors.server && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {errors.server}
        </div>
      )}
      <Field label="Full name" id="name" name="name" type="text" value={form.name}
        onChange={handle} autoComplete="name" required placeholder="Jane Doe"
        error={errors.name} />
      <Field label="Email" id="reg-email" name="email" type="email" value={form.email}
        onChange={handle} autoComplete="email" required placeholder="you@example.com" />
      <Field label="Password" id="reg-password" name="password" type="password" value={form.password}
        onChange={handle} autoComplete="new-password" required placeholder="Min. 8 characters"
        error={errors.password} />
      <Field label="Confirm password" id="confirmPassword" name="confirmPassword" type="password"
        value={form.confirmPassword} onChange={handle} autoComplete="new-password" required
        placeholder="Repeat password" error={errors.confirmPassword} />

      <button type="submit" className="btn-primary w-full justify-center mt-2" disabled={isPending}>
        {isPending ? <Spinner size="sm" /> : 'Create account'}
      </button>
    </form>
  );
}

// ── Auth page ────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab === 'register' ? 'register' : 'login');

  const from = location.state?.from?.pathname || '/dashboard';
  const handleSuccess = () => navigate(from, { replace: true });

  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-ink-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-ink-800 dark:bg-parchment-200 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-parchment-50 dark:text-ink-800">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-ink-800 dark:text-parchment-100">E-Library Interactive</h1>
          <p className="text-sm text-ink-400 dark:text-ink-500 mt-1">Your personal AI-powered reading space</p>
        </div>

        {/* Card */}
        <div className="card-elevated rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-parchment-100 dark:border-ink-700">
            {[['login', 'Sign in'], ['register', 'Create account']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`
                  flex-1 py-3 text-sm font-medium transition-colors
                  ${tab === key
                    ? 'text-ink-800 dark:text-parchment-100 border-b-2 border-ink-700 dark:border-parchment-300 -mb-px'
                    : 'text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300'}
                `}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="p-6">
            {tab === 'login'
              ? <LoginForm onSuccess={handleSuccess} />
              : <RegisterForm onSuccess={handleSuccess} />
            }
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-ink-300 dark:text-ink-600 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}