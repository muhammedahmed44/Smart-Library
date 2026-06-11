import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── 401 interceptor — clear Redux auth state and redirect ──────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Lazily import store to avoid circular deps
      import('../store').then(({ default: store }) => {
        import('../store/slices/authSlice').then(({ clearUser }) => {
          store.dispatch(clearUser());
        });
      });
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
