/**
 * Search Result Item Component
 * T110: Create SearchResultItem component (with snippet highlight)
 */

'use client';

import Link from 'next/link';
import { SearchResultItem as SearchResultItemType } from '@/types/api.types';
import SourceCitation from '@/components/content/SourceCitation';

interface SearchResultItemProps {
  item: SearchResultItemType;
  query?: string;
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    rule: '📜',
    class: '⚔️',
    subclass: '🛡️',
    race: '🧝',
    subrace: '🧬',
    spell: '✨',
    monster: '🐉',
    item: '🎒',
    background: '📖',
    feat: '🏆',
    condition: '💫',
    skill: '🎯',
  };
  return icons[type] || '📄';
}

function getCategoryPath(category: string, slug: string): string {
  return `/${category}/${slug}`;
}

function highlightText(text: string, query?: string): React.ReactNode {
  if (!query || !text) return text;

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return text;

  // Create a regex pattern that matches any of the search terms
  const pattern = new RegExp(`(${terms.map(t => escapeRegex(t)).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = terms.some(
      term => part.toLowerCase() === term.toLowerCase()
    );
    if (isMatch) {
      return (
        <mark key={index} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
          {part}
        </mark>
      );
    }
    return part;
  });
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function SearchResultItem({ item, query }: SearchResultItemProps) {
  const path = getCategoryPath(item.category, item.slug);

  return (
    <Link
      href={path}
      className="
        block p-4 rounded-lg border border-gray-200
        bg-white hover:border-blue-300 hover:shadow-md
        transition-all duration-150
        min-h-[44px]
      "
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <span className="text-xl flex-shrink-0" aria-hidden="true">
          {getTypeIcon(item.type)}
        </span>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-medium text-gray-900 truncate">
            {highlightText(item.title, query)}
          </h3>

          {/* Type badge */}
          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 capitalize">
            {item.type}
          </span>

          {/* Snippet */}
          {item.snippet && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {highlightText(item.snippet, query)}
            </p>
          )}

          {/* Source */}
          <div className="mt-2">
            <SourceCitation source={item.source} compact />
          </div>
        </div>

        {/* Rank indicator (for debugging, can be removed) */}
        {process.env.NODE_ENV === 'development' && (
          <span className="text-xs text-gray-400 flex-shrink-0">
            {item.rank.toFixed(3)}
          </span>
        )}
      </div>
    </Link>
  );
}
