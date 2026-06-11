import { createSlice } from '@reduxjs/toolkit';

// ── Rehydrate from localStorage (replaces zustand persist) ─────────────────
function loadPersistedUser() {
  try {
    const raw = localStorage.getItem('elib-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user ?? null;
  } catch {
    return null;
  }
}

const initialState = {
  user: loadPersistedUser(),
  isLoading: true, // true until /auth/me bootstrap resolves
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isLoading = false;
      // Persist non-sensitive fields to localStorage
      const { id, name, email, role, preferences } = action.payload;
      localStorage.setItem('elib-auth', JSON.stringify({ user: { id, name, email, role, preferences } }));
    },
    clearUser(state) {
      state.user = null;
      state.isLoading = false;
      localStorage.removeItem('elib-auth');
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    updatePreferences(state, action) {
      if (state.user) {
        state.user.preferences = { ...state.user.preferences, ...action.payload };
        // Keep localStorage in sync
        const { id, name, email, role, preferences } = state.user;
        localStorage.setItem('elib-auth', JSON.stringify({ user: { id, name, email, role, preferences } }));
      }
    },
  },
});

export const { setUser, clearUser, setLoading, updatePreferences } = authSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────
export const selectUser        = (state) => state.auth.user;
export const selectIsLoading   = (state) => state.auth.isLoading;
export const selectIsAdmin     = (state) => state.auth.user?.role === 'admin';
export const selectIsAuthor    = (state) => ['author', 'admin'].includes(state.auth.user?.role);
export const selectIsAuthenticated = (state) => !!state.auth.user;

export default authSlice.reducer;
