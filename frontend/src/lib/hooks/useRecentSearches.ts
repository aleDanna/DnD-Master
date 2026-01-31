/**
 * useRecentSearches Hook
 * T106: Create useRecentSearches hook (localStorage)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RecentSearch,
  SearchMode,
  MAX_RECENT_SEARCHES,
  RECENT_SEARCHES_KEY,
} from '@/types/api.types';

interface UseRecentSearchesResult {
  recentSearches: RecentSearch[];
  addSearch: (query: string, mode: SearchMode) => void;
  removeSearch: (query: string) => void;
  clearSearches: () => void;
}

export function useRecentSearches(): UseRecentSearchesResult {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[];
        setRecentSearches(parsed);
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  // Save to localStorage whenever searches change
  const saveSearches = useCallback((searches: RecentSearch[]) => {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error('Failed to save recent searches:', error);
    }
  }, []);

  const addSearch = useCallback(
    (query: string, mode: SearchMode) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;

      setRecentSearches((prev) => {
        // Remove existing entry with same query
        const filtered = prev.filter(
          (s) => s.query.toLowerCase() !== trimmedQuery.toLowerCase()
        );

        // Add new entry at the beginning
        const newSearch: RecentSearch = {
          query: trimmedQuery,
          mode,
          timestamp: Date.now(),
        };

        const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        saveSearches(updated);
        return updated;
      });
    },
    [saveSearches]
  );

  const removeSearch = useCallback(
    (query: string) => {
      setRecentSearches((prev) => {
        const updated = prev.filter(
          (s) => s.query.toLowerCase() !== query.toLowerCase()
        );
        saveSearches(updated);
        return updated;
      });
    },
    [saveSearches]
  );

  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
  };
}

/**
 * Format timestamp for display
 */
export function formatSearchTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

export default useRecentSearches;
