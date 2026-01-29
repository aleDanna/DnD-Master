// Handbook Layout - T019, T058
// Main layout for handbook pages with tab navigation and search

'use client';

import { useState, useCallback } from 'react';
import { TabNavigation } from '@/components/handbook/TabNavigation';
import { SearchBar } from '@/components/handbook/SearchBar';
import { SearchResultsCompact } from '@/components/handbook/SearchResults';
import { useSearch } from '@/hooks/handbook/useSearch';

export default function HandbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { query, setQuery, results, isLoading, clearResults } = useSearch();

  const handleResultClick = useCallback(() => {
    clearResults();
    setIsSearchFocused(false);
  }, [clearResults]);

  const showResults = query.length >= 2 && (results || isLoading);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Rules & Handbook
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and search D&D 5th Edition content
          </p>
        </header>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div
            onFocus={() => setIsSearchFocused(true)}
            onBlur={(e) => {
              // Don't close if clicking within the results
              if (!e.currentTarget.contains(e.relatedTarget)) {
                // Delay to allow click events to fire
                setTimeout(() => setIsSearchFocused(false), 200);
              }
            }}
          >
            <SearchBar
              value={query}
              onChange={setQuery}
              isLoading={isLoading}
              onClear={clearResults}
            />

            {/* Search Results Overlay */}
            {showResults && isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {isLoading && !results ? (
                    <div className="p-4 text-center">
                      <SearchLoadingIndicator />
                    </div>
                  ) : results ? (
                    <SearchResultsCompact
                      results={results}
                      onResultClick={handleResultClick}
                    />
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        <TabNavigation className="mb-6" />

        <main>{children}</main>
      </div>

      {/* Overlay backdrop when searching */}
      {showResults && isSearchFocused && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
          onClick={() => {
            clearResults();
            setIsSearchFocused(false);
          }}
        />
      )}
    </div>
  );
}

function SearchLoadingIndicator() {
  return (
    <div className="flex items-center justify-center gap-2 text-gray-500">
      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="text-sm">Searching...</span>
    </div>
  );
}
