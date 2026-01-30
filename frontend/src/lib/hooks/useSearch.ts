/**
 * useSearch Hook
 * T105: Create useSearch hook (query, results, loading)
 * T125: Update useSearch hook to support semantic mode
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';
import { search, SearchParams } from '@/lib/api/searchApi';
import { SearchResponse, SearchMode, ContentCategory } from '@/types/api.types';

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  mode?: SearchMode;
  categories?: ContentCategory[];
  limit?: number;
}

interface UseSearchResult {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasSearched: boolean;
  clearSearch: () => void;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchResult {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    mode = 'full-text',
    categories,
    limit = 50,
  } = options;

  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const debouncedQuery = useDebounce(query, debounceMs);

  const shouldSearch = debouncedQuery.trim().length >= minQueryLength;

  const {
    data: results,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['search', debouncedQuery, mode, categories, limit],
    queryFn: () =>
      search({
        query: debouncedQuery,
        type: mode,
        categories,
        limit,
      }),
    enabled: shouldSearch,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  useEffect(() => {
    if (shouldSearch) {
      setHasSearched(true);
    }
  }, [shouldSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setHasSearched(false);
  }, []);

  return {
    query,
    setQuery,
    results: results ?? null,
    isLoading: shouldSearch && isLoading,
    isError,
    error: error as Error | null,
    hasSearched,
    clearSearch,
  };
}

/**
 * Hook for search with manual trigger (no auto-search on query change)
 */
export function useManualSearch(options: Omit<UseSearchOptions, 'debounceMs'> = {}) {
  const { mode = 'full-text', categories, limit = 50 } = options;

  const [query, setQuery] = useState('');
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);

  const {
    data: results,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['manualSearch', searchParams],
    queryFn: () => (searchParams ? search(searchParams) : Promise.resolve(null)),
    enabled: !!searchParams,
    staleTime: 1000 * 60 * 5,
  });

  const executeSearch = useCallback(() => {
    if (query.trim().length >= 2) {
      setSearchParams({
        query,
        type: mode,
        categories,
        limit,
      });
    }
  }, [query, mode, categories, limit]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchParams(null);
  }, []);

  return {
    query,
    setQuery,
    executeSearch,
    results: results ?? null,
    isLoading,
    isError,
    error: error as Error | null,
    hasSearched: !!searchParams,
    clearSearch,
    refetch,
  };
}

export default useSearch;
