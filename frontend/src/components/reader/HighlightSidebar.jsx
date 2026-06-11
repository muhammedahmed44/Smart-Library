import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectHighlights,
  selectHighlightSidebarOpen,
  toggleHighlightSidebar,
  removeHighlight,
} from '../../store/slices/readerSlice';
import { useDeleteHighlight } from '../../hooks';

// ── Synonym result renderer ────────────────────────────────────────────────
function SynonymResult({ content }) {
  let synonyms = [];
  try {
    synonyms = JSON.parse(content);
  } catch {
    return <p className="text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed">{content}</p>;
  }

  if (!Array.isArray(synonyms) || synonyms.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      {synonyms.map((s, i) => (
        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-parchment-50 dark:bg-ink-700/50 border border-parchment-100 dark:border-ink-700">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold font-serif text-ink-800 dark:text-parchment-100">{s.word}</span>
              {s.partOfSpeech && (
                <span className="badge-ink text-[9px]">{s.partOfSpeech}</span>
              )}
            </div>
            {s.definition && (
              <p className="text-[10px] text-ink-500 dark:text-ink-400 mt-0.5 leading-relaxed">{s.definition}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Single highlight card ──────────────────────────────────────────────────
function HighlightItem({ highlight, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const isSummarize = highlight.ai_action === 'summarize';
  const actionLabel = isSummarize ? 'Summary' : 'Synonyms';
  const actionColor = isSummarize
    ? 'bg-parchment-100 text-parchment-700 dark:bg-parchment-800 dark:text-parchment-300'
    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';

  const hasResponse = !!highlight.ai_result;

  return (
    <div className="group relative rounded-xl border border-parchment-100 dark:border-ink-700 bg-parchment-50/50 dark:bg-ink-800/50 hover:border-parchment-300 dark:hover:border-ink-600 transition-colors overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className={`badge text-[10px] ${actionColor}`}>{actionLabel}</span>
        <span className="text-[10px] text-ink-300 dark:text-ink-600">Page {highlight.page_number}</span>
        <button
          onClick={() => onDelete(highlight.id)}
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-red-400 hover:text-red-500"
          aria-label="Delete highlight"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
          </svg>
        </button>
      </div>

      {/* Selected text */}
      <div className="px-3 pb-2">
        <p className="text-xs font-serif italic text-ink-600 dark:text-ink-400 leading-relaxed">
          "{highlight.selected_text}"
        </p>
      </div>

      {/* AI response section */}
      {hasResponse && (
        <div className="border-t border-parchment-100 dark:border-ink-700">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-medium text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300 transition-colors"
          >
            <span>AI Response</span>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {expanded && (
            <div className="px-3 pb-3">
              {isSummarize ? (
                <p className="text-[11px] text-ink-600 dark:text-ink-300 leading-relaxed font-serif">
                  {highlight.ai_result}
                </p>
              ) : (
                <SynonymResult content={highlight.ai_result} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main sidebar ───────────────────────────────────────────────────────────
export default function HighlightSidebar({ bookId }) {
  const dispatch = useDispatch();
  const highlights  = useSelector(selectHighlights);
  const sidebarOpen = useSelector(selectHighlightSidebarOpen);
  const { mutate: deleteHighlight } = useDeleteHighlight();

  const handleDelete = (id) => {
    deleteHighlight({ id, bookId });
    dispatch(removeHighlight(id));
  };

  if (!sidebarOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-ink-900/20 lg:hidden"
        onClick={() => dispatch(toggleHighlightSidebar())}
      />
      <aside className="
        fixed left-0 top-[60px] bottom-0 z-40
        w-72
        bg-white dark:bg-ink-900
        border-r border-parchment-200 dark:border-ink-800
        flex flex-col shadow-xl animate-slide-in-right
      ">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-parchment-100 dark:border-ink-800">
          <h2 className="font-serif text-base text-ink-800 dark:text-parchment-100">
            Highlights
            {highlights.length > 0 && (
              <span className="ml-2 badge-ink">{highlights.length}</span>
            )}
          </h2>
          <button
            onClick={() => dispatch(toggleHighlightSidebar())}
            className="btn-icon btn-ghost text-ink-400"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {highlights.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"
                className="text-parchment-300 dark:text-ink-600">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              <p className="text-sm text-ink-400 dark:text-ink-500 leading-relaxed">
                Highlights appear here after you use AI actions on selected text.
              </p>
            </div>
          ) : (
            highlights.map((h) => (
              <HighlightItem key={h.id} highlight={h} onDelete={handleDelete} />
            ))
          )}
        </div>
      </aside>
    </>
  );
}
