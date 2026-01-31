/**
 * Recent Searches Component
 * T111: Create RecentSearches component
 */

'use client';

import { useRecentSearches, formatSearchTime } from '@/lib/hooks/useRecentSearches';
import { XMarkIcon } from '@/components/layout/Icons';

interface RecentSearchesProps {
  onSelect: (query: string) => void;
  className?: string;
}

export default function RecentSearches({
  onSelect,
  className = '',
}: RecentSearchesProps) {
  const { recentSearches, removeSearch, clearSearches } = useRecentSearches();

  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Recent Searches</h3>
        <button
          onClick={clearSearches}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear all
        </button>
      </div>

      <ul className="space-y-1">
        {recentSearches.map((search) => (
          <li key={`${search.query}-${search.timestamp}`}>
            <div className="flex items-center group">
              <button
                onClick={() => onSelect(search.query)}
                className="
                  flex-1 flex items-center gap-2 py-2 px-3
                  text-left text-sm text-gray-700
                  rounded-lg hover:bg-gray-100
                  transition-colors
                  min-h-[40px]
                "
              >
                <span className="text-gray-400">🔍</span>
                <span className="flex-1 truncate">{search.query}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatSearchTime(search.timestamp)}
                </span>
              </button>

              <button
                onClick={() => removeSearch(search.query)}
                className="
                  p-2 text-gray-400 hover:text-gray-600
                  opacity-0 group-hover:opacity-100
                  transition-opacity
                  min-w-[40px] min-h-[40px]
                  flex items-center justify-center
                "
                aria-label={`Remove "${search.query}" from recent searches`}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Compact version for sidebar
 */
export function CompactRecentSearches({
  onSelect,
  limit = 3,
  className = '',
}: {
  onSelect: (query: string) => void;
  limit?: number;
  className?: string;
}) {
  const { recentSearches } = useRecentSearches();

  const displaySearches = recentSearches.slice(0, limit);

  if (displaySearches.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <p className="text-xs text-gray-500 mb-1">Recent:</p>
      <div className="flex flex-wrap gap-1">
        {displaySearches.map((search) => (
          <button
            key={`${search.query}-${search.timestamp}`}
            onClick={() => onSelect(search.query)}
            className="
              px-2 py-1 text-xs rounded-full
              bg-gray-100 text-gray-600
              hover:bg-gray-200 transition-colors
            "
          >
            {search.query}
          </button>
        ))}
      </div>
    </div>
  );
}
