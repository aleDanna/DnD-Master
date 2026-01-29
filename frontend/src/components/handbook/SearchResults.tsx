// SearchResults Component - T056
// Grouped results by type with counts

'use client';

import Link from 'next/link';
import type { SearchResponse, SearchResult } from '@/lib/handbook/types';

interface SearchResultsProps {
  results: SearchResponse;
  onResultClick?: () => void;
}

export function SearchResults({ results, onResultClick }: SearchResultsProps) {
  if (results.total === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No results found for &quot;{results.query}&quot;</p>
        <p className="mt-2 text-sm">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto">
      {/* Results count */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Found {results.total} result{results.total !== 1 ? 's' : ''} for &quot;{results.query}&quot;
        </p>
      </div>

      {/* Grouped results */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {results.groups.map((group) => (
          <ResultGroup
            key={group.type}
            type={group.type}
            count={group.count}
            results={group.results}
            onResultClick={onResultClick}
          />
        ))}
      </div>
    </div>
  );
}

interface ResultGroupProps {
  type: string;
  count: number;
  results: SearchResult[];
  onResultClick?: () => void;
}

function ResultGroup({ type, count, results, onResultClick }: ResultGroupProps) {
  const typeConfig = getTypeConfig(type);

  return (
    <div className="py-3">
      {/* Group header */}
      <div className="px-4 py-2 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${typeConfig.color}`} />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
          {typeConfig.label}
        </h3>
        <span className="text-xs text-gray-500">({count})</span>
      </div>

      {/* Results */}
      <div className="space-y-1 px-2">
        {results.map((result) => (
          <ResultItem
            key={`${result.type}-${result.id}`}
            result={result}
            onClick={onResultClick}
          />
        ))}
      </div>
    </div>
  );
}

interface ResultItemProps {
  result: SearchResult;
  onClick?: () => void;
}

function ResultItem({ result, onClick }: ResultItemProps) {
  const href = getResultHref(result);
  const typeConfig = getTypeConfig(result.type);

  return (
    <Link
      href={href}
      onClick={onClick}
      className="
        block px-3 py-2 rounded-lg
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition-colors duration-150
      "
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {result.name}
          </h4>
          {result.excerpt && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {result.excerpt}
            </p>
          )}
        </div>
        <span className={`
          px-2 py-0.5 text-xs rounded-full shrink-0
          ${typeConfig.badgeColor}
        `}>
          {typeConfig.shortLabel}
        </span>
      </div>

      {/* Type-specific attributes */}
      {result.attributes && Object.keys(result.attributes).length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {formatAttributes(result).map((attr, i) => (
            <span
              key={i}
              className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
            >
              {attr}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

// Type configuration
interface TypeConfig {
  label: string;
  shortLabel: string;
  color: string;
  badgeColor: string;
}

function getTypeConfig(type: string): TypeConfig {
  const configs: Record<string, TypeConfig> = {
    spell: {
      label: 'Spells',
      shortLabel: 'Spell',
      color: 'bg-purple-500',
      badgeColor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    },
    monster: {
      label: 'Monsters',
      shortLabel: 'Monster',
      color: 'bg-red-500',
      badgeColor: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    },
    item: {
      label: 'Items',
      shortLabel: 'Item',
      color: 'bg-amber-500',
      badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
    },
    class: {
      label: 'Classes',
      shortLabel: 'Class',
      color: 'bg-blue-500',
      badgeColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    },
    race: {
      label: 'Races',
      shortLabel: 'Race',
      color: 'bg-green-500',
      badgeColor: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    },
    rule: {
      label: 'Rules',
      shortLabel: 'Rule',
      color: 'bg-gray-500',
      badgeColor: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    },
    feat: {
      label: 'Feats',
      shortLabel: 'Feat',
      color: 'bg-indigo-500',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200',
    },
    background: {
      label: 'Backgrounds',
      shortLabel: 'Background',
      color: 'bg-teal-500',
      badgeColor: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200',
    },
    condition: {
      label: 'Conditions',
      shortLabel: 'Condition',
      color: 'bg-orange-500',
      badgeColor: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
    },
  };

  return configs[type] || {
    label: type.charAt(0).toUpperCase() + type.slice(1) + 's',
    shortLabel: type.charAt(0).toUpperCase() + type.slice(1),
    color: 'bg-gray-500',
    badgeColor: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  };
}

function getResultHref(result: SearchResult): string {
  switch (result.type) {
    case 'spell':
      return `/handbook/spells/${result.slug}`;
    case 'monster':
      return `/handbook/bestiary/${result.slug}`;
    case 'item':
      return `/handbook/equipment/${result.slug}`;
    case 'class':
      return `/handbook/characters/classes/${result.slug}`;
    case 'race':
      return `/handbook/characters/races/${result.slug}`;
    case 'feat':
      return `/handbook/characters/feats/${result.slug}`;
    case 'background':
      return `/handbook/characters/backgrounds/${result.slug}`;
    case 'rule':
      return `/handbook/rules/${result.slug}`;
    case 'condition':
      return `/handbook/conditions/${result.slug}`;
    default:
      return `/handbook`;
  }
}

function formatAttributes(result: SearchResult): string[] {
  const attrs: string[] = [];
  const a = result.attributes;

  if (!a) return attrs;

  // Spell attributes
  if (result.type === 'spell') {
    if (a.level !== undefined) {
      attrs.push(a.level === 0 ? 'Cantrip' : `Level ${a.level}`);
    }
    if (a.school) attrs.push(String(a.school));
    if (a.concentration) attrs.push('Concentration');
    if (a.ritual) attrs.push('Ritual');
  }

  // Monster attributes
  if (result.type === 'monster') {
    if (a.challengeRating) attrs.push(`CR ${a.challengeRating}`);
    if (a.size) attrs.push(String(a.size));
    if (a.monsterType) attrs.push(String(a.monsterType));
  }

  // Item attributes
  if (result.type === 'item') {
    if (a.rarity) attrs.push(String(a.rarity).replace('_', ' '));
    if (a.itemType) attrs.push(String(a.itemType).replace('_', ' '));
    if (a.attunementRequired) attrs.push('Attunement');
  }

  // Class attributes
  if (result.type === 'class') {
    if (a.hitDie) attrs.push(String(a.hitDie));
    if (a.primaryAbility) attrs.push(String(a.primaryAbility));
  }

  // Race attributes
  if (result.type === 'race') {
    if (a.size) attrs.push(String(a.size));
    if (a.speed) attrs.push(`${a.speed} ft`);
  }

  return attrs;
}

// Compact version for overlay
export function SearchResultsCompact({ results, onResultClick }: SearchResultsProps) {
  if (results.total === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No results found
      </div>
    );
  }

  // Flatten all results for compact view
  const allResults = results.groups.flatMap((g) => g.results).slice(0, 10);

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {allResults.map((result) => (
          <ResultItem
            key={`${result.type}-${result.id}`}
            result={result}
            onClick={onResultClick}
          />
        ))}
      </div>
      {results.total > 10 && (
        <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500">
            +{results.total - 10} more results
          </span>
        </div>
      )}
    </div>
  );
}
