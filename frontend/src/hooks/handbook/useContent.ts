// useContent Hook - T016
// Generic content fetching with caching pattern

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseContentOptions<T> {
  initialData?: T;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
}

export interface UseContentResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  mutate: (data?: T) => void;
  refetch: () => Promise<void>;
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache TTL

/**
 * Generate a cache key from the fetch function
 */
function getCacheKey(key: string): string {
  return `handbook:${key}`;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(key: string): boolean {
  const cached = cache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_TTL;
}

/**
 * Generic content fetching hook with caching
 */
export function useContent<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseContentOptions<T> = {}
): UseContentResult<T> {
  const {
    initialData,
    revalidateOnFocus = true,
    dedupingInterval = 2000,
  } = options;

  const [data, setData] = useState<T | undefined>(() => {
    const cacheKey = getCacheKey(key);
    if (isCacheValid(cacheKey)) {
      return cache.get(cacheKey)?.data as T;
    }
    return initialData;
  });
  const [isLoading, setIsLoading] = useState<boolean>(!data);
  const [error, setError] = useState<Error | null>(null);

  const lastFetchTime = useRef<number>(0);
  const isMounted = useRef<boolean>(true);

  const fetchData = useCallback(async () => {
    const now = Date.now();
    const cacheKey = getCacheKey(key);

    // Deduping: don't fetch if we just fetched
    if (now - lastFetchTime.current < dedupingInterval) {
      return;
    }

    // Check cache first
    if (isCacheValid(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (cached && isMounted.current) {
        setData(cached.data as T);
        setIsLoading(false);
        return;
      }
    }

    lastFetchTime.current = now;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();

      // Update cache
      cache.set(cacheKey, { data: result, timestamp: Date.now() });

      if (isMounted.current) {
        setData(result);
        setIsLoading(false);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    }
  }, [key, fetcher, dedupingInterval]);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, fetchData]);

  const mutate = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setData(newData);
      const cacheKey = getCacheKey(key);
      cache.set(cacheKey, { data: newData, timestamp: Date.now() });
    } else {
      // Invalidate cache and refetch
      cache.delete(getCacheKey(key));
      fetchData();
    }
  }, [key, fetchData]);

  const refetch = useCallback(async () => {
    cache.delete(getCacheKey(key));
    lastFetchTime.current = 0;
    await fetchData();
  }, [key, fetchData]);

  return { data, isLoading, error, mutate, refetch };
}

/**
 * Hook for paginated content
 */
export interface UsePaginatedContentResult<T> extends UseContentResult<T[]> {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function usePaginatedContent<T>(
  key: string,
  fetcher: (page: number, limit: number) => Promise<{
    data: T[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>,
  options: { initialPage?: number; limit?: number } = {}
): UsePaginatedContentResult<T> {
  const { initialPage = 1, limit = 20 } = options;
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const paginatedFetcher = useCallback(async () => {
    const result = await fetcher(page, limit);
    setTotalPages(result.pagination.totalPages);
    setTotal(result.pagination.total);
    return result.data;
  }, [fetcher, page, limit]);

  const result = useContent<T[]>(`${key}:page=${page}:limit=${limit}`, paginatedFetcher);

  return {
    ...result,
    page,
    setPage,
    totalPages,
    total,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Clear all cached data
 */
export function clearContentCache(): void {
  cache.clear();
}

/**
 * Invalidate specific cache key
 */
export function invalidateContentCache(key: string): void {
  cache.delete(getCacheKey(key));
}

export default useContent;
