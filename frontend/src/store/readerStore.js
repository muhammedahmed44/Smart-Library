import { create } from 'zustand';

export const useReaderStore = create((set, get) => ({
  // ── Current book ─────────────────────────────────────────────────────────
  currentBook: null,
  currentPage: 1,
  setCurrentBook: (book) => set({ currentBook: book }),
  setCurrentPage: (page) => set({ currentPage: page }),

  // ── Text selection (from HighlightLayer) ─────────────────────────────────
  selection: null,        // { text, pageNumber, positionData, boundingRect }
  setSelection: (sel) => set({ selection: sel }),
  clearSelection: () => set({ selection: null }),

  // ── AI Panel ─────────────────────────────────────────────────────────────
  aiPanel: {
    isOpen: false,
    action: null,           // 'summarize' | 'synonyms'
    status: 'idle',         // 'idle' | 'streaming' | 'done' | 'error'
    content: '',            // accumulated streamed text
    errorMessage: '',
  },
  openAiPanel: (action) =>
    set({ aiPanel: { isOpen: true, action, status: 'streaming', content: '', errorMessage: '' } }),
  appendAiContent: (chunk) =>
    set((state) => ({ aiPanel: { ...state.aiPanel, content: state.aiPanel.content + chunk } })),
  setAiDone: () =>
    set((state) => ({ aiPanel: { ...state.aiPanel, status: 'done' } })),
  setAiError: (msg) =>
    set((state) => ({ aiPanel: { ...state.aiPanel, status: 'error', errorMessage: msg } })),
  closeAiPanel: () =>
    set({ aiPanel: { isOpen: false, action: null, status: 'idle', content: '', errorMessage: '' } }),

  // ── Highlights (in-memory, synced from server on book open) ──────────────
  highlights: [],
  setHighlights: (highlights) => set({ highlights }),
  addHighlight: (highlight) =>
    set((state) => ({ highlights: [...state.highlights, highlight] })),
  removeHighlight: (id) =>
    set((state) => ({ highlights: state.highlights.filter((h) => h.id !== id) })),

  // ── Sidebar ───────────────────────────────────────────────────────────────
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // ── Reset on book close ───────────────────────────────────────────────────
  resetReader: () =>
    set({
      currentBook: null,
      currentPage: 1,
      selection: null,
      aiPanel: { isOpen: false, action: null, status: 'idle', content: '', errorMessage: '' },
      highlights: [],
      sidebarOpen: false,
    }),
}));