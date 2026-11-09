import { useCallback, useState } from "react";

/**
 * Cursor pagination state for DRF CursorPagination. The server only returns
 * next/previous cursors (no total count), so we keep a stack of the cursors
 * we've visited to know the page index. Changing `resetKey` (filters, search,
 * sort) returns to the first page.
 */
export function useCursorPagination(resetKey: string) {
  const [state, setState] = useState<{ key: string; stack: (string | null)[] }>({ key: resetKey, stack: [null] });
  const stack = state.key === resetKey ? state.stack : [null];

  const next = useCallback(
    (cursor: string | null) => {
      if (!cursor) return;
      setState((s) => ({ key: resetKey, stack: [...(s.key === resetKey ? s.stack : [null]), cursor] }));
    },
    [resetKey],
  );

  const previous = useCallback(() => {
    setState((s) => ({ key: resetKey, stack: s.key === resetKey && s.stack.length > 1 ? s.stack.slice(0, -1) : [null] }));
  }, [resetKey]);

  return { cursor: stack[stack.length - 1], pageIndex: stack.length - 1, next, previous };
}
