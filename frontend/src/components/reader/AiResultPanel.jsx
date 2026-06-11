import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAiPanel, selectSelection, closeAiPanel } from '../../store/slices/readerSlice';
import Spinner from '../shared/Spinner';

// ── Typewriter cursor ──────────────────────────────────────────────────────
function Cursor() {
  return <span className="inline-block w-[2px] h-[1em] bg-ink-600 dark:bg-parchment-400 ml-0.5 align-middle animate-pulse" />;
}

// ── Synonym card grid ──────────────────────────────────────────────────────
function SynonymCards({ content }) {
  let synonyms = [];
  try {
    const clean = content.trim().replace(/^```json|```$/g, '');
    synonyms = JSON.parse(clean);
  } catch {
    return (
      <p className="text-sm text-ink-600 dark:text-ink-300 font-mono whitespace-pre-wrap leading-relaxed">
        {content}
      </p>
    );
  }

  const posBadge = {
    noun: 'badge-ink',
    verb: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 badge',
    adj:  'bg-parchment-100 text-parchment-700 badge dark:bg-parchment-800 dark:text-parchment-300',
    adv:  'badge bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      {synonyms.map((s, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-parchment-50 dark:bg-ink-700/50 border border-parchment-100 dark:border-ink-700">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-serif text-sm font-semibold text-ink-800 dark:text-parchment-100">{s.word}</span>
              {s.partOfSpeech && (
                <span className={posBadge[s.partOfSpeech] || 'badge-ink'}>{s.partOfSpeech}</span>
              )}
            </div>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 leading-relaxed">{s.definition}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────
export default function AiResultPanel() {
  const dispatch  = useDispatch();
  const aiPanel   = useSelector(selectAiPanel);
  const selection = useSelector(selectSelection);
  const { isOpen, action, status, content, errorMessage } = aiPanel;
  const bottomRef = useRef(null);

  useEffect(() => {
    if (status === 'streaming') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [content, status]);

  if (!isOpen) return null;

  const title = action === 'summarize' ? 'Summary' : 'Synonyms & Definitions';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink-900/30 lg:hidden" onClick={() => dispatch(closeAiPanel())} />

      <aside className="
        fixed right-0 top-[60px] bottom-0 z-50
        w-full max-w-sm
        bg-white dark:bg-ink-900
        border-l border-parchment-200 dark:border-ink-800
        flex flex-col animate-slide-in-right shadow-xl
      ">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-parchment-100 dark:border-ink-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              status === 'streaming' ? 'bg-green-400 animate-pulse'
              : status === 'done'   ? 'bg-parchment-400'
              : 'bg-red-400'
            }`} />
            <h2 className="font-serif text-base text-ink-800 dark:text-parchment-100">{title}</h2>
          </div>
          <button onClick={() => dispatch(closeAiPanel())} className="btn-icon btn-ghost text-ink-400">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Selected text chip */}
        {selection?.text && (
          <div className="px-5 py-3 border-b border-parchment-100 dark:border-ink-800 flex-shrink-0">
            <p className="text-[11px] font-medium text-ink-400 dark:text-ink-500 uppercase tracking-wide mb-1">Selected text</p>
            <p className="text-xs text-ink-600 dark:text-ink-300 font-serif italic line-clamp-3 leading-relaxed">
              "{selection.text}"
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {status === 'streaming' && !content && (
            <div className="flex items-center gap-2 text-ink-400 dark:text-ink-500">
              <Spinner size="sm" />
              <span className="text-sm">Thinking…</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col gap-3">
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {errorMessage}
              </div>
              <button onClick={() => dispatch(closeAiPanel())} className="btn-secondary w-full justify-center">Close</button>
            </div>
          )}

          {content && action === 'summarize' && (
            <p className="text-sm text-ink-700 dark:text-parchment-200 leading-relaxed font-serif">
              {content}
              {status === 'streaming' && <Cursor />}
            </p>
          )}

          {action === 'synonyms' && content && status === 'done' && (
            <SynonymCards content={content} />
          )}

          {action === 'synonyms' && status === 'streaming' && (
            <div className="flex items-center gap-2 text-ink-400 dark:text-ink-500">
              <Spinner size="sm" />
              <span className="text-sm">Finding synonyms…</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {status === 'done' && (
          <div className="px-5 py-3 border-t border-parchment-100 dark:border-ink-800 flex-shrink-0">
            <p className="text-[11px] text-ink-300 dark:text-ink-600 text-center">
              Highlight saved to your reading history
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
