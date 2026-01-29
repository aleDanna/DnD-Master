// Bestiary Page - T023, T048
// Display monsters list with filtering by CR, size, type

'use client';

import { Suspense } from 'react';
import { usePaginatedContent } from '@/hooks/handbook/useContent';
import { useFilters, MonsterFilterState } from '@/hooks/handbook/useFilters';
import { MonsterCard } from '@/components/handbook/ContentCard';
import { FilterPanel, MONSTER_FILTER_SECTIONS } from '@/components/handbook/FilterPanel';
import { getMonsters } from '@/lib/handbook/api';
import type { MonsterSummary } from '@/lib/handbook/types';

function BestiaryPageContent() {
  const { filters, setFilter, clearFilters } = useFilters<MonsterFilterState>();

  // Build API filter params
  const apiFilters = {
    challengeRatingMin: filters.crMin,
    challengeRatingMax: filters.crMax,
    size: filters.size,
    type: filters.type,
  };

  const {
    data: monsters,
    isLoading,
    error,
    page,
    setPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedContent<MonsterSummary>(
    `monsters:${JSON.stringify(apiFilters)}`,
    (page, limit) => getMonsters({ page, limit, ...apiFilters }),
    { initialPage: 1, limit: 20 }
  );

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading monsters: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white text-xl">
          Bestiary
        </h2>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        sections={MONSTER_FILTER_SECTIONS}
        values={filters}
        onChange={(key, value) => setFilter(key as keyof MonsterFilterState, value as MonsterFilterState[keyof MonsterFilterState])}
        onClear={clearFilters}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : monsters && monsters.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monsters.map((monster) => (
              <MonsterCard
                key={monster.id}
                id={monster.id}
                name={monster.name}
                slug={monster.slug}
                challengeRating={monster.challengeRating}
                size={monster.size}
                monsterType={monster.monsterType}
                armorClass={monster.armorClass}
                hitPoints={monster.hitPoints}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!hasPrevPage}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasNextPage}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No monsters found</p>
          {Object.keys(filters).length > 0 && (
            <button
              onClick={clearFilters}
              className="mt-2 text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function BestiaryPage() {
  return (
    <Suspense fallback={<BestiaryPageSkeleton />}>
      <BestiaryPageContent />
    </Suspense>
  );
}

function BestiaryPageSkeleton() {
  return (
    <div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
