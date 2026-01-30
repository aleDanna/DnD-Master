/**
 * Search Results Component
 * T109: Create SearchResults component (grouped display)
 * T126: Add AI-powered indicator to search results
 */

'use client';

import { SearchResponse, SearchResultGroup } from '@/types/api.types';
import SearchResultItem from './SearchResultItem';
import NoResults from './NoResults';

interface SearchResultsProps {
  results: SearchResponse;
  query: string;
  isLoading?: boolean;
}

export default function SearchResults({
  results,
  query,
  isLoading = false,
}: SearchResultsProps) {
  if (isLoading) {
    return <SearchResultsSkeleton />;
  }

  if (results.totalResults === 0) {
    return <NoResults query={query} suggestions={results.suggestions} />;
  }

  return (
    <div className="space-y-8">
      {/* AI-Powered Banner */}
      {results.mode === 'semantic' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
          <span className="text-lg">✨</span>
          <div>
            <span className="font-medium text-purple-900">AI-Powered Search</span>
            <span className="text-purple-700 text-sm ml-2">
              Results are ranked by semantic similarity
            </span>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Found <span className="font-medium">{results.totalResults}</span> results
          for &ldquo;<span className="font-medium">{query}</span>&rdquo;
        </p>
        {results.mode === 'semantic' && (
          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
            AI-Powered
          </span>
        )}
      </div>

      {/* Grouped Results */}
      {results.groups.map((group) => (
        <SearchResultGroupSection key={group.category} group={group} query={query} />
      ))}
    </div>
  );
}

interface SearchResultGroupSectionProps {
  group: SearchResultGroup;
  query: string;
}

function SearchResultGroupSection({ group, query }: SearchResultGroupSectionProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {group.categoryLabel}
        </h2>
        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
          {group.totalCount}
        </span>
      </div>

      <div className="space-y-3">
        {group.items.map((item) => (
          <SearchResultItem key={item.id} item={item} query={query} />
        ))}
      </div>
    </section>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Summary skeleton */}
      <div className="h-5 w-48 bg-gray-200 rounded" />

      {/* Group skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="space-y-3">
            {[1, 2].map((j) => (
              <div
                key={j}
                className="p-4 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-40 bg-gray-200 rounded" />
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                    <div className="h-4 w-full bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { SearchResultsSkeleton };
