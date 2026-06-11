import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectSelection, clearSelection } from '../../store/slices/readerSlice';
import { useAiStream } from '../../hooks/useAiStream';

/**
 * Floating action bubble that appears above text selections.
 * Word count rule:
 *   - 1 word  → Synonyms only
 *   - 2+ words → Summarize only
 */
export default function AiPopover() {
  const dispatch = useDispatch();
  const selection = useSelector(selectSelection);
  const { triggerAi } = useAiStream();
  const ref = useRef(null);

  const wordCount = selection?.text
    ? selection.text.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const showSynonyms  = wordCount === 1;
  const showSummarize = wordCount > 1;

  // Dismiss on outside click
  useEffect(() => {
    if (!selection) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) dispatch(clearSelection());
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selection, dispatch]);

  if (!selection) return null;

  const { boundingRect } = selection;
  if (!boundingRect) return null;

  const left = Math.min(
    Math.max(8, boundingRect.left + boundingRect.width / 2),
    window.innerWidth - 200
  );
  const top = boundingRect.top - 56 + window.scrollY;

  return (
    <div
      ref={ref}
      className="fixed z-[60] animate-slide-up"
      style={{ left, top, transform: 'translateX(-50%)' }}
    >
      <div className="flex items-center gap-1 bg-ink-800 dark:bg-ink-900 rounded-xl shadow-xl px-2 py-1.5 border border-ink-700">
        {/* Caret */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
          style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1e1e30' }}
        />

        {showSummarize && (
          <button
            onClick={() => triggerAi('summarize')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              text-parchment-100 hover:bg-ink-700 transition-colors whitespace-nowrap"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Summarize
          </button>
        )}

        {showSynonyms && (
          <button
            onClick={() => triggerAi('synonyms')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              text-parchment-100 hover:bg-ink-700 transition-colors whitespace-nowrap"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h10"/>
            </svg>
            Synonyms
          </button>
        )}

        {(showSummarize || showSynonyms) && <div className="w-px h-4 bg-ink-600" />}

        <button
          onClick={() => dispatch(clearSelection())}
          className="p-1.5 rounded-lg text-ink-400 hover:text-ink-200 hover:bg-ink-700 transition-colors"
          aria-label="Dismiss"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
