/**
 * No Results Component
 * T112: Create NoResults component with suggestions
 */

'use client';

import Link from 'next/link';
import { SearchIcon } from '@/components/layout/Icons';

interface NoResultsProps {
  query: string;
  suggestions?: string[];
}

export default function NoResults({ query, suggestions }: NoResultsProps) {
  const popularSearches = [
    { label: 'Fireball', path: '/spells/fireball' },
    { label: 'Fighter', path: '/classes/fighter' },
    { label: 'Dragon', path: '/bestiary' },
    { label: 'Grappling', path: '/rules' },
  ];

  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6">
        <SearchIcon className="w-8 h-8 text-gray-400" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        No results found
      </h2>

      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        We couldn&apos;t find any content matching &ldquo;
        <span className="font-medium">{query}</span>&rdquo;.
        Try adjusting your search terms.
      </p>

      {/* Suggestions from API */}
      {suggestions && suggestions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Suggestions</h3>
          <ul className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-gray-600">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Popular Searches */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          Popular Searches
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {popularSearches.map((item) => (
            <Link
              key={item.label}
              href={item.path}
              className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Search Tips */}
      <div className="mt-8 text-left max-w-md mx-auto bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Search Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use specific terms like &ldquo;sneak attack&rdquo; or &ldquo;healing word&rdquo;</li>
          <li>• Try searching by category: spells, monsters, items</li>
          <li>• Check your spelling</li>
          <li>• Use fewer, more general keywords</li>
        </ul>
      </div>
    </div>
  );
}
