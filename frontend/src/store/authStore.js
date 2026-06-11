import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,   // true until the /auth/me bootstrap resolves

      // ── Setters ──────────────────────────────────────────────────────────
      setUser: (user) => set({ user, isLoading: false }),
      clearUser: () => set({ user: null, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),

      // ── Derived helpers ───────────────────────────────────────────────────
      isAuthenticated: () => !!get().user,
      isAdmin: () => get().user?.role === 'admin',
      isAuthor: () => ['author', 'admin'].includes(get().user?.role),
      isUser: () => !!get().user,

      // ── Preferences ──────────────────────────────────────────────────────
      updatePreferences: (prefs) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, preferences: { ...state.user.preferences, ...prefs } }
            : null,
        })),
    }),
    {
      name: 'elib-auth',
      // Only persist non-sensitive fields — the real auth is the HTTP-only cookie
      partialize: (state) => ({
        user: state.user
          ? {
              id: state.user.id,
              name: state.user.name,
              email: state.user.email,
              role: state.user.role,
              preferences: state.user.preferences,
            }
          : null,
      }),
    }
  )
);