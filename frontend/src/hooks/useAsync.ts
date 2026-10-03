import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "../services/api";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  setData: (value: T | null) => void;
}

/**
 * Minimal data-fetching hook. It re-runs whenever `deps` change, ignores
 * results from stale requests, and exposes a friendly error string.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const requestId = useRef(0);

  // The caller supplies the dependency list, which the rule cannot verify as a
  // literal, so both hooks rules are silenced for this single call.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  const memoLoader = useCallback(loader, deps);

  useEffect(() => {
    const id = requestId.current + 1;
    requestId.current = id;
    // Starting a request is a legitimate effect: it mirrors an external system
    // (the API) into local state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    memoLoader()
      .then((result) => {
        if (requestId.current !== id) return;
        setData(result);
      })
      .catch((err) => {
        if (requestId.current !== id) return;
        setError(errorMessage(err, "We could not load this right now"));
      })
      .finally(() => {
        if (requestId.current !== id) return;
        setLoading(false);
      });
  }, [memoLoader, nonce]);

  return {
    data,
    loading,
    error,
    reload: useCallback(() => setNonce((value) => value + 1), []),
    setData,
  };
}

/** Debounce a rapidly changing value (search inputs, resize handlers). */
export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Track a media query, e.g. `useMediaQuery("(max-width: 720px)")`. */
export function useMediaQuery(query: string) {
  const read = (target: string) =>
    typeof window === "undefined" ? false : window.matchMedia(target).matches;

  const [state, setState] = useState(() => ({ query, matches: read(query) }));
  const current = state.query === query ? state.matches : read(query);
  if (state.query !== query) setState({ query, matches: current });

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setState({ query, matches: event.matches });
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return current;
}

/** Close on outside click — used by the search suggestions and menus. */
export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

/** Lock body scroll while an overlay is open. */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}
