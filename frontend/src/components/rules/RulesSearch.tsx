'use client';

import { useCallback, useEffect } from 'react';
import { Input } from '../ui/Input';
import { cn } from '@/lib/utils';

/**
 * RulesSearch - Search input with mode toggle
 * Task: T046
 */

type SearchMode = 'fulltext' | 'semantic' | 'hybrid';

interface RulesSearchProps {
  query: string;
  mode: SearchMode;
  loading?: boolean;
  onQueryChange: (query: string) => void;
  onModeChange: (mode: SearchMode) => void;
  onSearch: () => void;
  className?: string;
  autoFocus?: boolean;
}

const modeOptions: { value: SearchMode; label: string; description: string }[] = [
  {
    value: 'hybrid',
    label: 'Hybrid',
    description: 'Best of both: combines keyword and semantic matching',
  },
  {
    value: 'fulltext',
    label: 'Keyword',
    description: 'Exact keyword matching for precise searches',
  },
  {
    value: 'semantic',
    label: 'Semantic',
    description: 'AI-powered search that understands meaning',
  },
];

export function RulesSearch({
  query,
  mode,
  loading,
  onQueryChange,
  onModeChange,
  onSearch,
  className,
  autoFocus,
}: RulesSearchProps) {
  // Handle search on Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSearch();
      }
    },
    [onSearch]
  );

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('rules-search-input');
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search input */}
      <div className="relative">
        <Input
          id="rules-search-input"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search rules... (Ctrl+K)"
          autoFocus={autoFocus}
          className="pr-24"
        />

        {/* Search button */}
        <button
          onClick={onSearch}
          disabled={loading || query.trim().length < 2}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5',
            'bg-primary text-white text-sm rounded',
            'hover:bg-primary/90 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center gap-2'
          )}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
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
              <span className="sr-only">Searching...</span>
            </>
          ) : (
            <>
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search
            </>
          )}
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex flex-wrap gap-2">
        {modeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onModeChange(option.value)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-full transition-colors',
              mode === option.value
                ? 'bg-primary text-white'
                : 'bg-background text-muted hover:text-foreground hover:bg-muted/20'
            )}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Mode description */}
      <p className="text-xs text-muted">
        {modeOptions.find((o) => o.value === mode)?.description}
      </p>
    </div>
  );
}

/**
 * SearchModeSelector - Standalone mode selector
 */
interface SearchModeSelectorProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  className?: string;
}

export function SearchModeSelector({
  mode,
  onModeChange,
  className,
}: SearchModeSelectorProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-background rounded-lg', className)}>
      {modeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onModeChange(option.value)}
          className={cn(
            'flex-1 px-3 py-1.5 text-sm rounded transition-colors',
            mode === option.value
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-muted hover:text-foreground'
          )}
          title={option.description}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default RulesSearch;
