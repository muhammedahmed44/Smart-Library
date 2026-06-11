import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { setUser, clearUser, selectUser, selectIsLoading, updatePreferences } from '../store/slices/authSlice';
import { authApi } from '../api/auth';
import { libraryApi, personalApi, authorApi, historyApi, highlightsApi, adminApi } from '../api/books';

// ─── Auth ──────────────────────────────────────────────────────────────────
export function useAuth() {
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);
  return { user, isLoading };
}

export function useMe() {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await authApi.me();
        dispatch(setUser(res.data.data));
        return res.data.data;
      } catch (err) {
        dispatch(clearUser());
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const dispatch = useDispatch();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      dispatch(clearUser());
      qc.clear();
    },
  });
}

// ─── Public Library ────────────────────────────────────────────────────────
export function usePublicBooks(params = {}) {
  return useQuery({
    queryKey: ['library', 'books', params],
    queryFn: () => libraryApi.listBooks(params).then((r) => r.data.data),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePublicBook(id) {
  return useQuery({
    queryKey: ['library', 'book', id],
    queryFn: () => libraryApi.getBook(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: () => libraryApi.listGenres().then((r) => r.data.data),
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Personal Library ──────────────────────────────────────────────────────
export function usePersonalBooks(params = {}) {
  return useQuery({
    queryKey: ['personal', 'books', params],
    queryFn: () => personalApi.listBooks(params).then((r) => r.data.data),
    staleTime: 60 * 1000,
  });
}

export function useUploadBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => personalApi.uploadBook(formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal', 'books'] }),
  });
}

export function useUpdateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => personalApi.updateBook(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal', 'books'] }),
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => personalApi.deleteBook(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal', 'books'] }),
  });
}

// ─── Author Panel ──────────────────────────────────────────────────────────
export function useAuthorBooks(params = {}) {
  return useQuery({
    queryKey: ['author', 'books', params],
    queryFn: () => authorApi.listBooks(params).then((r) => r.data.data),
  });
}

export function usePublishBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => authorApi.publishBook(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['author', 'books'] });
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
    },
  });
}

export function useTogglePublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => authorApi.togglePublish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['author', 'books'] });
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
    },
  });
}

// ─── Reading History ───────────────────────────────────────────────────────
export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: () => historyApi.getHistory().then((r) => r.data.data),
    staleTime: 30 * 1000,
  });
}

export function useUpsertProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, lastPage }) => historyApi.upsertProgress(bookId, lastPage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['history'] }),
  });
}

// ─── Highlights ────────────────────────────────────────────────────────────
export function useHighlights(bookId) {
  return useQuery({
    queryKey: ['highlights', bookId],
    queryFn: () => highlightsApi.getHighlights(bookId).then((r) => r.data.data),
    enabled: !!bookId,
  });
}

export function useCreateHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => highlightsApi.createHighlight(data),
    onSuccess: (res) => {
      const bookId = res.data.data?.book_id;
      if (bookId) qc.invalidateQueries({ queryKey: ['highlights', String(bookId)] });
    },
  });
}

export function useDeleteHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bookId }) => highlightsApi.deleteHighlight(id).then(() => bookId),
    onSuccess: (bookId) => qc.invalidateQueries({ queryKey: ['highlights', String(bookId)] }),
  });
}

// ─── Admin ─────────────────────────────────────────────────────────────────
export function useRoleRequests(params = {}) {
  return useQuery({
    queryKey: ['admin', 'role-requests', params],
    queryFn: () => adminApi.listRoleRequests(params).then((r) => r.data.data),
  });
}

export function useActionRoleRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, adminNote }) => adminApi.actionRoleRequest(id, action, adminNote),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'role-requests'] }),
  });
}

export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.listUsers(params).then((r) => r.data.data),
  });
}
