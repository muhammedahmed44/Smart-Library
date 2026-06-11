import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './guards';
import AppLayout from '../layouts/AppLayout';
import AuthPage from '../pages/AuthPage';
import DashboardPage from '../pages/DashboardPage';
import PublicLibraryPage from '../pages/PublicLibraryPage';
import PersonalLibraryPage from '../pages/PersonalLibraryPage';
import AuthorPanelPage from '../pages/AuthorPanelPage';
import AdminPage from '../pages/AdminPage';
import ReaderPage from '../pages/ReaderPage';
import { SettingsPage, NotFoundPage } from '../pages/index';

// Router is created inside a function so it receives theme props via the App component
export function createAppRouter(themeProps) {
  return createBrowserRouter([
    // ── Public routes ──────────────────────────────────────────────────────
    {
      path: '/login',
      element: (
        <PublicRoute>
          <AuthPage />
        </PublicRoute>
      ),
    },

    // ── Authenticated app shell ────────────────────────────────────────────
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AppLayout {...themeProps} />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        { path: 'dashboard', element: <DashboardPage /> },
        { path: 'library',   element: <PublicLibraryPage /> },
        { path: 'personal',  element: <PersonalLibraryPage /> },
        { path: 'settings',  element: <SettingsPage /> },

        // ── Reader routes (public and personal books) ─────────────────────
        { path: 'reader/public/:id',   element: <ReaderPage source="public" /> },
        { path: 'reader/personal/:id', element: <ReaderPage source="personal" /> },

        // ── Author panel ───────────────────────────────────────────────────
        {
          path: 'author',
          element: (
            <ProtectedRoute roles={['author', 'admin']}>
              <AuthorPanelPage />
            </ProtectedRoute>
          ),
        },

        // ── Admin panel ────────────────────────────────────────────────────
        {
          path: 'admin',
          element: (
            <ProtectedRoute roles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          ),
        },
      ],
    },

    // ── 404 ────────────────────────────────────────────────────────────────
    { path: '*', element: <NotFoundPage /> },
  ]);
}