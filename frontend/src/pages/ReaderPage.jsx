import { useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import {
  selectCurrentBook,
  selectCurrentPage,
  selectHighlightSidebarOpen,
  selectAiPanel,
  setCurrentBook,
  setCurrentPage,
  setSelection,
  setHighlights,
  toggleHighlightSidebar,
  resetReader,
} from '../store/slices/readerSlice';

import { useHighlights, useUpsertProgress } from '../hooks';
import { libraryApi, personalApi } from '../api/books';
import AiPopover from '../components/reader/AiPopover';
import AiResultPanel from '../components/reader/AiResultPanel';
import HighlightSidebar from '../components/reader/HighlightSidebar';
import Spinner from '../components/shared/Spinner';

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

export default function ReaderPage({ source = 'public' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentBook        = useSelector(selectCurrentBook);
  const currentPage        = useSelector(selectCurrentPage);
  const highlightSidebarOpen = useSelector(selectHighlightSidebarOpen);
  const aiPanel            = useSelector(selectAiPanel);

  const { data: highlights = [] } = useHighlights(id);
  const { mutate: upsertProgress } = useUpsertProgress();

  // Fetch book metadata on mount
  useEffect(() => {
    const api = source === 'public' ? libraryApi : personalApi;
    api.getBook(id)
      .then((res) => dispatch(setCurrentBook(res.data.data)))
      .catch(() => {});
  }, [id, source, dispatch]);

  // Sync server highlights into Redux
  useEffect(() => {
    if (highlights.length) dispatch(setHighlights(highlights));
  }, [highlights, dispatch]);

  // Full reset when leaving reader
  useEffect(() => () => { dispatch(resetReader()); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pdfUrl = source === 'public'
    ? libraryApi.getPdfUrl(id)
    : personalApi.getPdfUrl(id);

  const debouncedProgress = useRef(
    debounce((page) => { upsertProgress({ bookId: id, lastPage: page }); }, 3000)
  ).current;

  const handlePageChange = useCallback((e) => {
    const page = e.currentPage + 1;
    dispatch(setCurrentPage(page));
    debouncedProgress(page);
  }, [dispatch, debouncedProgress]);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
    const text = sel.toString().trim();
    if (text.length < 3) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    dispatch(setSelection({
      text,
      pageNumber: currentPage,
      positionData: {
        boundingRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        pageIndex: currentPage - 1,
      },
      boundingRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    }));
  }, [currentPage, dispatch]);

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="h-screen flex flex-col bg-parchment-100 dark:bg-ink-900 overflow-hidden">
      {/* ── Reader toolbar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 h-12 bg-white dark:bg-ink-900 border-b border-parchment-200 dark:border-ink-800 flex items-center px-4 gap-3 z-20">
        <Link
          to={source === 'public' ? '/library' : '/personal'}
          className="btn-icon btn-ghost text-ink-400"
          aria-label="Back to library"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>

        {currentBook && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-800 dark:text-parchment-100 truncate">
              {currentBook.title}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => dispatch(toggleHighlightSidebar())}
            className={`btn-icon ${highlightSidebarOpen ? 'bg-parchment-100 dark:bg-ink-700 text-ink-700 dark:text-parchment-200' : 'btn-ghost text-ink-400'}`}
            aria-label="Toggle highlights"
            title="Highlights"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>

          <span className="text-xs text-ink-400 dark:text-ink-500 tabular-nums">
            Page {currentPage}
          </span>
        </div>
      </div>

      {/* ── Main viewer area ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative" onMouseUp={handleMouseUp}>
        <Worker workerUrl={new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString()}>
          <div className="h-full">
            <Viewer
              fileUrl={pdfUrl}
              plugins={[defaultLayoutPluginInstance]}
              onPageChange={handlePageChange}
              renderLoader={(pct) => (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Spinner size="lg" />
                  <div className="w-48 h-1.5 bg-parchment-200 dark:bg-ink-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ink-600 dark:bg-parchment-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(pct)}%` }}
                    />
                  </div>
                  <p className="text-sm text-ink-400">Loading PDF… {Math.round(pct)}%</p>
                </div>
              )}
              renderError={(err) => (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                  <p className="text-lg font-serif text-ink-700 dark:text-parchment-200">Could not load the PDF</p>
                  <p className="text-sm text-ink-400">{err?.message || 'The file may be unavailable.'}</p>
                  <button onClick={() => navigate(-1)} className="btn-secondary mt-2">Go back</button>
                </div>
              )}
            />
          </div>
        </Worker>

        <AiPopover />
      </div>

      <HighlightSidebar bookId={id} />
      <AiResultPanel />
    </div>
  );
}
