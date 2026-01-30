/**
 * Search Page
 * Full search interface with results
 */

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useRecentSearches } from '@/lib/hooks/useRecentSearches';
import { search } from '@/lib/api/searchApi';
import { SearchMode } from '@/types/api.types';
import SearchBar from '@/components/search/SearchBar';
import SearchResults, { SearchResultsSkeleton } from '@/components/search/SearchResults';
import RecentSearches from '@/components/search/RecentSearches';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const initialMode = (searchParams.get('mode') as SearchMode) || 'full-text';

  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>(initialMode);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 400);
  const shouldSearch = debouncedQuery.trim().length >= 2;

  const {
    data: results,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['search', debouncedQuery, searchMode],
    queryFn: () =>
      search({
        query: debouncedQuery,
        type: searchMode,
        limit: 50,
      }),
    enabled: shouldSearch,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const { addSearch } = useRecentSearches();

  // Initialize query from URL
  useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery);
    }
  }, [initialQuery, query]);

  // Update URL when query or mode changes
  useEffect(() => {
    if (query) {
      const params = new URLSearchParams();
      params.set('q', query);
      if (searchMode !== 'full-text') {
        params.set('mode', searchMode);
      }
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }
  }, [query, searchMode, router]);

  // Track when search has happened
  useEffect(() => {
    if (shouldSearch) {
      setHasSearched(true);
    }
  }, [shouldSearch]);

  // Save to recent searches when results are shown
  useEffect(() => {
    if (results && results.totalResults > 0) {
      addSearch(query, searchMode);
    }
  }, [results, query, searchMode, addSearch]);

  const handleRecentSearchSelect = (selectedQuery: string) => {
    setQuery(selectedQuery);
  };

  return (
    <div>
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Search</h1>
        <SearchBar
          value={query}
          onChange={setQuery}
          isLoading={shouldSearch && isLoading}
          autoFocus={!initialQuery}
          className="max-w-2xl"
          searchMode={searchMode}
          onSearchModeChange={setSearchMode}
          showModeToggle
        />
      </div>

      {/* Recent Searches (when no query) */}
      {!hasSearched && (
        <RecentSearches
          onSelect={handleRecentSearchSelect}
          className="max-w-2xl mb-8"
        />
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-700">
            An error occurred while searching. Please try again.
          </p>
        </div>
      )}

      {/* Results */}
      {hasSearched && results && (
        <SearchResults
          results={results}
          query={query}
          isLoading={isLoading}
        />
      )}

      {/* Initial Loading State */}
      {isLoading && !results && <SearchResultsSkeleton />}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchResultsSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}
