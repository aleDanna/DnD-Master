'use client';

import { useState, useCallback, useRef } from 'react';
import {
  rulesApi,
  RuleSearchResult,
} from '../lib/api';

/**
 * Hook for managing rules search state
 * Tasks: T041
 */

type SearchMode = 'fulltext' | 'semantic' | 'hybrid';

interface SearchState {
  query: string;
  mode: SearchMode;
  results: RuleSearchResult[];
  total: number;
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
}

interface SearchOptions {
  mode?: SearchMode;
  limit?: number;
  offset?: number;
  documentId?: string;
}

interface UseRulesSearchReturn extends SearchState {
  setQuery: (query: string) => void;
  setMode: (mode: SearchMode) => void;
  search: (options?: SearchOptions) => Promise<void>;
  searchDebounced: (options?: SearchOptions) => void;
  loadMore: () => Promise<void>;
  clearResults: () => void;
}

const DEFAULT_LIMIT = 20;
const DEBOUNCE_MS = 300;

export function useRulesSearch(token: string | null): UseRulesSearchReturn {
  const [state, setState] = useState<SearchState>({
    query: '',
    mode: 'hybrid',
    results: [],
    total: 0,
    loading: false,
    error: null,
    hasSearched: false,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentOffset = useRef(0);

  /**
   * Set the search query
   */
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
  }, []);

  /**
   * Set the search mode
   */
  const setMode = useCallback((mode: SearchMode) => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  /**
   * Execute search immediately
   */
  const search = useCallback(async (options?: SearchOptions) => {
    if (!token) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Authentication required',
      }));
      return;
    }

    const searchQuery = state.query.trim();
    if (searchQuery.length < 2) {
      setState(prev => ({
        ...prev,
        results: [],
        total: 0,
        error: 'Query must be at least 2 characters',
        hasSearched: true,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    currentOffset.current = options?.offset || 0;

    try {
      const response = await rulesApi.search(token, searchQuery, {
        mode: options?.mode || state.mode,
        limit: options?.limit || DEFAULT_LIMIT,
        offset: options?.offset || 0,
        documentId: options?.documentId,
      });

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          results: options?.offset && options.offset > 0
            ? [...prev.results, ...response.data!.results]
            : response.data!.results,
          total: response.data!.total,
          loading: false,
          hasSearched: true,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error?.message || 'Search failed',
          hasSearched: true,
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Search failed',
        hasSearched: true,
      }));
    }
  }, [token, state.query, state.mode]);

  /**
   * Execute search with debouncing
   */
  const searchDebounced = useCallback((options?: SearchOptions) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      search(options);
    }, DEBOUNCE_MS);
  }, [search]);

  /**
   * Load more results (pagination)
   */
  const loadMore = useCallback(async () => {
    if (state.loading || state.results.length >= state.total) {
      return;
    }

    const nextOffset = state.results.length;
    currentOffset.current = nextOffset;

    await search({ offset: nextOffset });
  }, [state.loading, state.results.length, state.total, search]);

  /**
   * Clear search results
   */
  const clearResults = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setState({
      query: '',
      mode: 'hybrid',
      results: [],
      total: 0,
      loading: false,
      error: null,
      hasSearched: false,
    });
    currentOffset.current = 0;
  }, []);

  return {
    ...state,
    setQuery,
    setMode,
    search,
    searchDebounced,
    loadMore,
    clearResults,
  };
}

export default useRulesSearch;
