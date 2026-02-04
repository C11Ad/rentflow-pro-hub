import { useState, useEffect, useCallback, useRef } from "react";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
}

interface FetchOptions {
  /** Cache duration in milliseconds (default: 5 minutes) */
  cacheTime?: number;
  /** Stale time in milliseconds (default: 30 seconds) */
  staleTime?: number;
  /** Whether to refetch on window focus (default: true) */
  refetchOnFocus?: boolean;
  /** Whether to refetch on reconnect (default: true) */
  refetchOnReconnect?: boolean;
  /** Skip initial fetch if true */
  skip?: boolean;
  /** Dependencies that trigger refetch */
  deps?: unknown[];
}

const cache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * Custom hook for data fetching with caching, deduplication, and smart refetching
 * Provides a robust solution for data management without external libraries
 */
export function useDataFetching<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: FetchOptions = {}
): FetchState<T> & { refetch: () => Promise<void>; clearCache: () => void } {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 30 * 1000, // 30 seconds
    refetchOnFocus = true,
    refetchOnReconnect = true,
    skip = false,
    deps = [],
  } = options;

  const [state, setState] = useState<FetchState<T>>(() => {
    // Check cache for initial data
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return {
        data: cached.data as T,
        loading: false,
        error: null,
        isStale: Date.now() - cached.timestamp > staleTime,
      };
    }
    return { data: null, loading: !skip, error: null, isStale: false };
  });

  const isMountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    // Prevent duplicate fetches
    if (fetchingRef.current && !force) return;
    if (skip) return;

    // Check cache validity
    const cached = cache.get(key);
    if (!force && cached && Date.now() - cached.timestamp < staleTime) {
      setState(prev => ({
        ...prev,
        data: cached.data as T,
        loading: false,
        isStale: false,
      }));
      return;
    }

    fetchingRef.current = true;
    setState(prev => ({ ...prev, loading: prev.data === null, error: null }));

    try {
      const data = await fetchFn();
      
      // Update cache
      cache.set(key, { data, timestamp: Date.now() });
      
      if (isMountedRef.current) {
        setState({ data, loading: false, error: null, isStale: false });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error("Fetch failed"),
        }));
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [key, fetchFn, staleTime, skip]);

  const clearCache = useCallback(() => {
    cache.delete(key);
    setState({ data: null, loading: false, error: null, isStale: false });
  }, [key]);

  // Initial fetch and dependency-based refetch
  useEffect(() => {
    fetchData();
  }, [key, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      const cached = cache.get(key);
      if (!cached || Date.now() - cached.timestamp > staleTime) {
        fetchData(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [key, fetchData, refetchOnFocus, staleTime]);

  // Refetch on reconnect
  useEffect(() => {
    if (!refetchOnReconnect) return;

    const handleOnline = () => fetchData(true);

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [fetchData, refetchOnReconnect]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Cache cleanup
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      cache.forEach((value, cacheKey) => {
        if (now - value.timestamp > cacheTime) {
          cache.delete(cacheKey);
        }
      });
    }, cacheTime);

    return () => clearInterval(cleanup);
  }, [cacheTime]);

  return {
    ...state,
    refetch: () => fetchData(true),
    clearCache,
  };
}

/**
 * Hook for paginated data fetching with cursor-based or offset-based pagination
 */
export function usePaginatedData<T>(
  key: string,
  fetchFn: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>,
  pageSize = 20
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPage = useCallback(async (pageNum: number, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await fetchFn(pageNum, pageSize);
      
      if (isLoadMore) {
        setItems(prev => [...prev, ...result.data]);
      } else {
        setItems(result.data);
      }
      
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Fetch failed"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fetchFn, pageSize]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    fetchPage(page + 1, true);
  }, [fetchPage, hasMore, loadingMore, page]);

  const refresh = useCallback(() => {
    fetchPage(1);
  }, [fetchPage]);

  useEffect(() => {
    fetchPage(1);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
