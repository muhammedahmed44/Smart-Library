import { useEffect, useState, useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useDispatch } from 'react-redux';
import { setUser, clearUser } from './store/slices/authSlice';
import { authApi } from './api/auth';
import { createAppRouter } from './router/index.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 60 * 1000 },
    mutations: { retry: 0 },
  },
});

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('elib-theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('elib-theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return { theme, toggle };
}

function AuthBootstrap({ children }) {
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then((res) => dispatch(setUser(res.data.data)))
      .catch(() => dispatch(clearUser()))
      .finally(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;
  return children;
}

export default function App() {
  const { theme, toggle } = useTheme();
  const router = useMemo(() => createAppRouter({ theme, onToggleTheme: toggle }), [theme, toggle]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
