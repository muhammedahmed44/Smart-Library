import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectSelection,
  selectCurrentBook,
  selectCurrentPage,
  openAiPanel,
  appendAiContent,
  setAiDone,
  setAiError,
  clearSelection,
} from '../store/slices/readerSlice';

/**
 * Returns a triggerAi(action) function.
 * Reads the current selection from Redux, opens the AI panel,
 * calls the streaming SSE endpoint, and appends tokens as they arrive.
 * Highlights are persisted server-side before streaming begins.
 */
export function useAiStream() {
  const dispatch = useDispatch();
  const selection   = useSelector(selectSelection);
  const currentBook = useSelector(selectCurrentBook);
  const currentPage = useSelector(selectCurrentPage);

  const triggerAi = useCallback(
    async (action) => {
      if (!selection?.text?.trim()) return;

      // Capture values BEFORE clearSelection() zeroes them out in Redux
      const capturedText     = selection.text;
      const capturedPage     = selection.pageNumber;
      const capturedPosition = selection.positionData;

      dispatch(openAiPanel(action));
      dispatch(clearSelection());

      const endpoint = action === 'summarize' ? '/api/ai/summarize' : '/api/ai/synonyms';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: capturedText,
            bookId: currentBook?.id,
            pageNumber: capturedPage,
            positionData: capturedPosition,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          dispatch(setAiError(err.message || 'AI request failed'));
          return;
        }

        // Read SSE stream
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();

            if (payload === '[DONE]') {
              dispatch(setAiDone());
              // Highlights are persisted server-side before streaming — no duplicate needed here
              return;
            }
            if (payload === '[ERROR]') {
              dispatch(setAiError('The AI service returned an error. Please try again.'));
              return;
            }
            try {
              const { token } = JSON.parse(payload);
              if (token) dispatch(appendAiContent(token));
            } catch {
              // malformed chunk — skip
            }
          }
        }
      } catch (err) {
        dispatch(setAiError(err.message || 'Network error. Please try again.'));
      }
    },
    [dispatch, selection, currentBook, currentPage]
  );

  return { triggerAi };
}
