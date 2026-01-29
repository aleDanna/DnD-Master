'use client';

import { RuleSearchResult } from '@/lib/api';
import { RuleCard, RuleCardSkeleton } from './RuleCard';
import { cn } from '@/lib/utils';

/**
 * SearchResults - Display search results with highlighting and pagination
 * Task: T047
 */

interface SearchResultsProps {
  results: RuleSearchResult[];
  total: number;
  loading?: boolean;
  hasMore?: boolean;
  onResultClick?: (result: RuleSearchResult) => void;
  onLoadMore?: () => void;
  className?: string;
}

export function SearchResults({
  results,
  total,
  loading,
  hasMore,
  onResultClick,
  onLoadMore,
  className,
}: SearchResultsProps) {
  // Loading state - initial load
  if (loading && results.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <SearchResultsSkeleton count={5} />
      </div>
    );
  }

  // Empty state
  if (!loading && results.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-5xl mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No results found
        </h3>
        <p className="text-muted text-sm">
          Try a different search query or search mode
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Showing {results.length} of {total} result{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Results list */}
      <div className="space-y-3">
        {results.map((result) => (
          <SearchResultItem
            key={result.entry.id}
            result={result}
            onClick={() => onResultClick?.(result)}
          />
        ))}
      </div>

      {/* Loading more indicator */}
      {loading && results.length > 0 && (
        <div className="space-y-3">
          <SearchResultsSkeleton count={3} />
        </div>
      )}

      {/* Load more button */}
      {!loading && hasMore && onLoadMore && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            className={cn(
              'px-6 py-2 text-sm rounded-lg transition-colors',
              'bg-background text-foreground',
              'hover:bg-muted/20 border border-border'
            )}
          >
            Load More Results
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * SearchResultItem - Individual search result
 */
interface SearchResultItemProps {
  result: RuleSearchResult;
  onClick?: () => void;
}

function SearchResultItem({ result, onClick }: SearchResultItemProps) {
  const { entry, relevance, matchType, highlights } = result;

  return (
    <div className="relative">
      {/* Match type and relevance badge */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <MatchTypeBadge type={matchType} />
        <RelevanceBadge relevance={relevance} />
      </div>

      <RuleCard
        entry={entry}
        highlights={highlights}
        onClick={onClick}
        showSource={true}
      />
    </div>
  );
}

/**
 * MatchTypeBadge - Indicates how the result was matched
 */
interface MatchTypeBadgeProps {
  type: 'fulltext' | 'semantic' | 'hybrid';
}

function MatchTypeBadge({ type }: MatchTypeBadgeProps) {
  const config = {
    fulltext: {
      label: 'Keyword',
      className: 'bg-blue-500/10 text-blue-500',
    },
    semantic: {
      label: 'Semantic',
      className: 'bg-purple-500/10 text-purple-500',
    },
    hybrid: {
      label: 'Both',
      className: 'bg-green-500/10 text-green-500',
    },
  };

  const { label, className: badgeClass } = config[type];

  return (
    <span
      className={cn(
        'text-xs px-2 py-0.5 rounded-full',
        badgeClass
      )}
    >
      {label}
    </span>
  );
}

/**
 * RelevanceBadge - Shows relevance score
 */
interface RelevanceBadgeProps {
  relevance: number;
}

function RelevanceBadge({ relevance }: RelevanceBadgeProps) {
  const percentage = Math.round(relevance * 100);

  // Color based on relevance
  let colorClass = 'text-muted';
  if (percentage >= 80) {
    colorClass = 'text-success';
  } else if (percentage >= 60) {
    colorClass = 'text-warning';
  }

  return (
    <span className={cn('text-xs', colorClass)} title="Relevance score">
      {percentage}%
    </span>
  );
}

/**
 * SearchResultsSkeleton - Loading placeholder for results
 */
interface SearchResultsSkeletonProps {
  count?: number;
}

export function SearchResultsSkeleton({ count = 3 }: SearchResultsSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <RuleCardSkeleton key={i} />
      ))}
    </>
  );
}

/**
 * SearchResultsEmpty - Empty state component
 */
interface SearchResultsEmptyProps {
  message?: string;
  suggestion?: string;
}

export function SearchResultsEmpty({
  message = 'No results found',
  suggestion = 'Try different keywords or search mode',
}: SearchResultsEmptyProps) {
  return (
    <div className="text-center py-12">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 mx-auto text-muted mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <h3 className="text-lg font-medium text-foreground mb-2">{message}</h3>
      <p className="text-sm text-muted">{suggestion}</p>
    </div>
  );
}

export default SearchResults;
