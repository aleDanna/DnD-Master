// useSearch Hook - T057
// Search state management with debouncing and caching

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchHandbook, SearchOptions } from '@/lib/handbook/api';
import type { SearchResponse } from '@/lib/handbook/types';

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseSearchResult {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResponse | null;
  isLoading: boolean;
  error: Error | null;
  search: (query: string, options?: SearchOptions) => Promise<void>;
  clearResults: () => void;
}

// Simple in-memory cache
const searchCache = new Map<string, { data: SearchResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useSearch(options: UseSearchOptions = {}): UseSearchResult {
  const { debounceMs = 300, minQueryLength = 2 } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear stale cache entries
  const cleanCache = useCallback(() => {
    const now = Date.now();
    for (const [key, value] of searchCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        searchCache.delete(key);
      }
    }
  }, []);

  // Search function
  const search = useCallback(async (searchQuery: string, searchOptions?: SearchOptions) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (searchQuery.length < minQueryLength) {
      setResults(null);
      setError(null);
      return;
    }

    // Create cache key
    const cacheKey = JSON.stringify({ q: searchQuery, ...searchOptions });

    // Check cache
    cleanCache();
    const cached = searchCache.get(cacheKey);
    if (cached) {
      setResults(cached.data);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const data = await searchHandbook(searchQuery, searchOptions);

      // Cache the result
      searchCache.set(cacheKey, { data, timestamp: Date.now() });

      setResults(data);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      setError(err instanceof Error ? err : new Error('Search failed'));
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [minQueryLength, cleanCache]);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (query.length < minQueryLength) {
      setResults(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceTimeoutRef.current = setTimeout(() => {
      search(query);
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, debounceMs, minQueryLength, search]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const clearResults = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    search,
    clearResults,
  };
}

// Export cache utilities for testing
export function clearSearchCache() {
  searchCache.clear();
}
