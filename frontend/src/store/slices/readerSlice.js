import { createSlice } from '@reduxjs/toolkit';

const AI_PANEL_CLOSED = {
  isOpen: false,
  action: null,       // 'summarize' | 'synonyms'
  status: 'idle',     // 'idle' | 'streaming' | 'done' | 'error'
  content: '',
  errorMessage: '',
};

const initialState = {
  // ── Current book ──────────────────────────────────────────────────────────
  currentBook: null,
  currentPage: 1,

  // ── Text selection ────────────────────────────────────────────────────────
  // { text, pageNumber, positionData, boundingRect }
  selection: null,

  // ── AI panel ──────────────────────────────────────────────────────────────
  aiPanel: AI_PANEL_CLOSED,

  // ── Highlights (in-memory, synced from server on book open) ───────────────
  highlights: [],

  // ── Highlight sidebar (inside reader) ─────────────────────────────────────
  highlightSidebarOpen: false,

  // ── Nav sidebar (Dashboard / Library etc.) ────────────────────────────────
  // Force-collapsed when reader mode is active
  navSidebarCollapsed: false,
};

const readerSlice = createSlice({
  name: 'reader',
  initialState,
  reducers: {
    // ── Book ────────────────────────────────────────────────────────────────
    setCurrentBook(state, action) {
      state.currentBook = action.payload;
    },
    setCurrentPage(state, action) {
      state.currentPage = action.payload;
    },

    // ── Selection ───────────────────────────────────────────────────────────
    setSelection(state, action) {
      state.selection = action.payload;
    },
    clearSelection(state) {
      state.selection = null;
    },

    // ── AI panel ────────────────────────────────────────────────────────────
    openAiPanel(state, action) {
      state.aiPanel = {
        isOpen: true,
        action: action.payload,  // 'summarize' | 'synonyms'
        status: 'streaming',
        content: '',
        errorMessage: '',
      };
    },
    appendAiContent(state, action) {
      state.aiPanel.content += action.payload;
    },
    setAiDone(state) {
      state.aiPanel.status = 'done';
    },
    setAiError(state, action) {
      state.aiPanel.status = 'error';
      state.aiPanel.errorMessage = action.payload;
    },
    closeAiPanel(state) {
      state.aiPanel = AI_PANEL_CLOSED;
    },

    // ── Highlights ──────────────────────────────────────────────────────────
    setHighlights(state, action) {
      state.highlights = action.payload;
    },
    addHighlight(state, action) {
      state.highlights.push(action.payload);
    },
    removeHighlight(state, action) {
      state.highlights = state.highlights.filter((h) => h.id !== action.payload);
    },

    // ── Highlight sidebar ───────────────────────────────────────────────────
    toggleHighlightSidebar(state) {
      state.highlightSidebarOpen = !state.highlightSidebarOpen;
    },
    closeHighlightSidebar(state) {
      state.highlightSidebarOpen = false;
    },

    // ── Nav sidebar collapse ────────────────────────────────────────────────
    collapseNavSidebar(state) {
      state.navSidebarCollapsed = true;
    },
    expandNavSidebar(state) {
      state.navSidebarCollapsed = false;
    },
    toggleNavSidebar(state) {
      state.navSidebarCollapsed = !state.navSidebarCollapsed;
    },

    // ── Full reset on book close ────────────────────────────────────────────
    resetReader(state) {
      state.currentBook = null;
      state.currentPage = 1;
      state.selection = null;
      state.aiPanel = AI_PANEL_CLOSED;
      state.highlights = [];
      state.highlightSidebarOpen = false;
      // Restore the nav sidebar when leaving reader mode
      state.navSidebarCollapsed = false;
    },
  },
});

export const {
  setCurrentBook,
  setCurrentPage,
  setSelection,
  clearSelection,
  openAiPanel,
  appendAiContent,
  setAiDone,
  setAiError,
  closeAiPanel,
  setHighlights,
  addHighlight,
  removeHighlight,
  toggleHighlightSidebar,
  closeHighlightSidebar,
  collapseNavSidebar,
  expandNavSidebar,
  toggleNavSidebar,
  resetReader,
} = readerSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────
export const selectCurrentBook          = (state) => state.reader.currentBook;
export const selectCurrentPage          = (state) => state.reader.currentPage;
export const selectSelection            = (state) => state.reader.selection;
export const selectAiPanel              = (state) => state.reader.aiPanel;
export const selectHighlights           = (state) => state.reader.highlights;
export const selectHighlightSidebarOpen = (state) => state.reader.highlightSidebarOpen;
export const selectNavSidebarCollapsed  = (state) => state.reader.navSidebarCollapsed;

export default readerSlice.reducer;
