/**
 * Search Page
 * Full search interface with results
 */

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { useSearch } from '@/lib/hooks/useSearch';
import { useRecentSearches } from '@/lib/hooks/useRecentSearches';
import SearchBar from '@/components/search/SearchBar';
import SearchResults, { SearchResultsSkeleton } from '@/components/search/SearchResults';
import RecentSearches from '@/components/search/RecentSearches';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const {
    query,
    setQuery,
    results,
    isLoading,
    isError,
    hasSearched,
  } = useSearch({
    debounceMs: 400,
  });

  const { addSearch } = useRecentSearches();

  // Initialize query from URL
  useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery);
    }
  }, [initialQuery, query, setQuery]);

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
    }
  }, [query, router]);

  // Save to recent searches when results are shown
  useEffect(() => {
    if (results && results.totalResults > 0) {
      addSearch(query, 'full-text');
    }
  }, [results, query, addSearch]);

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
          isLoading={isLoading}
          autoFocus={!initialQuery}
          className="max-w-2xl"
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
