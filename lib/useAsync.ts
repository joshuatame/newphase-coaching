"use client";

import { useEffect, useState } from "react";

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

/**
 * Runs an async fetcher on mount, returning a stable fallback value while
 * loading or when the request fails (keeps static-export pages resilient
 * against an empty or unavailable API).
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  deps: unknown[] = [],
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: fallback,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => {
        if (!active) return;
        const isEmptyArray = Array.isArray(data) && data.length === 0;
        setState({
          data: data == null || isEmptyArray ? fallback : data,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (!active) return;
        setState({
          data: fallback,
          loading: false,
          error: err?.message || "Failed to load",
        });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
