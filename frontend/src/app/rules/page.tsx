'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/ui/AuthProvider';
import { useRulesSearch } from '@/hooks/useRulesSearch';
import { RulesBrowser } from '@/components/rules/RulesBrowser';
import { RulesSearch } from '@/components/rules/RulesSearch';
import { SearchResults } from '@/components/rules/SearchResults';
import { RuleDetail } from '@/components/rules/RuleDetail';
import { RuleEntry, RuleSearchResult } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * Rules Explorer Main Page
 * Task: T048
 * Layout: Sidebar (RulesBrowser), main area (search/results or entry detail)
 */

type ViewMode = 'search' | 'detail';

export default function RulesExplorerPage() {
  const { session } = useAuth();
  const router = useRouter();
  const token = session?.access_token || null;

  // Search state
  const {
    query,
    mode,
    results,
    total,
    loading: searchLoading,
    error: searchError,
    hasSearched,
    setQuery,
    setMode,
    search,
    loadMore,
    clearResults,
  } = useRulesSearch(token);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle entry selection from browser
  const handleEntrySelect = useCallback((entry: RuleEntry) => {
    setSelectedEntryId(entry.id);
    setViewMode('detail');
  }, []);

  // Handle search result click
  const handleResultClick = useCallback((result: RuleSearchResult) => {
    setSelectedEntryId(result.entry.id);
    setViewMode('detail');
  }, []);

  // Handle back to search
  const handleBackToSearch = useCallback(() => {
    setViewMode('search');
    setSelectedEntryId(null);
  }, []);

  // Handle navigation to rule detail page
  const handleViewFullRule = useCallback((entryId: string) => {
    router.push(`/rules/${entryId}`);
  }, [router]);

  const hasMore = results.length < total;

  return (
    <div className="h-full flex">
      {/* Sidebar - Rules Browser */}
      <aside
        className={cn(
          'bg-surface border-r border-border transition-all duration-300 flex flex-col',
          sidebarCollapsed ? 'w-12' : 'w-72'
        )}
      >
        {/* Sidebar header */}
        <div className="h-12 border-b border-border flex items-center justify-between px-3">
          {!sidebarCollapsed && (
            <h2 className="font-semibold text-foreground text-sm">Browse Rules</h2>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 text-muted hover:text-foreground transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={cn('h-5 w-5 transition-transform', sidebarCollapsed && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* Sidebar content */}
        {!sidebarCollapsed && (
          <RulesBrowser
            token={token}
            onEntrySelect={handleEntrySelect}
            className="flex-1 overflow-auto"
          />
        )}
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search header */}
        <div className="bg-surface border-b border-border p-4">
          <RulesSearch
            query={query}
            mode={mode}
            loading={searchLoading}
            onQueryChange={setQuery}
            onModeChange={setMode}
            onSearch={search}
            autoFocus={viewMode === 'search'}
          />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-4">
          {viewMode === 'detail' && selectedEntryId ? (
            <div className="max-w-4xl mx-auto">
              {/* Back button */}
              <button
                onClick={handleBackToSearch}
                className="mb-4 flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Search
              </button>

              {/* Rule detail */}
              <RuleDetail
                entryId={selectedEntryId}
                token={token}
                onClose={handleBackToSearch}
              />

              {/* View full page link */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => handleViewFullRule(selectedEntryId)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Open in Full Page View
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Show search results or welcome message */}
              {hasSearched ? (
                <>
                  {searchError ? (
                    <div className="text-center py-8">
                      <p className="text-danger mb-4">{searchError}</p>
                      <button
                        onClick={() => search()}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        Try again
                      </button>
                    </div>
                  ) : (
                    <SearchResults
                      results={results}
                      total={total}
                      loading={searchLoading}
                      hasMore={hasMore}
                      onResultClick={handleResultClick}
                      onLoadMore={loadMore}
                    />
                  )}
                </>
              ) : (
                <WelcomeMessage onClearResults={clearResults} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Welcome message shown before first search
 */
function WelcomeMessage({ onClearResults }: { onClearResults: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-20 w-20 mx-auto text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-4">
        Rules Explorer
      </h2>
      <p className="text-muted mb-6 max-w-md mx-auto">
        Search for D&D rules using keyword or semantic search, or browse the rules
        hierarchy in the sidebar.
      </p>
      <div className="space-y-2 text-sm text-muted max-w-sm mx-auto text-left">
        <p className="flex items-center gap-2">
          <span className="text-primary">Hybrid:</span>
          Best of both keyword and semantic matching
        </p>
        <p className="flex items-center gap-2">
          <span className="text-primary">Keyword:</span>
          Exact text matching for precise searches
        </p>
        <p className="flex items-center gap-2">
          <span className="text-primary">Semantic:</span>
          AI-powered search that understands meaning
        </p>
      </div>
      <p className="mt-6 text-xs text-muted">
        Tip: Press <kbd className="px-1 py-0.5 bg-background rounded">Ctrl+K</kbd> to focus the search bar
      </p>
    </div>
  );
}
