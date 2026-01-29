// Spells Page - T022, T044
// Display spells list with filtering by level, school, concentration, ritual

'use client';

import { Suspense } from 'react';
import { usePaginatedContent } from '@/hooks/handbook/useContent';
import { useFilters, SpellFilterState } from '@/hooks/handbook/useFilters';
import { SpellCard } from '@/components/handbook/ContentCard';
import { FilterPanel, SPELL_FILTER_SECTIONS } from '@/components/handbook/FilterPanel';
import { getSpells } from '@/lib/handbook/api';
import type { SpellSummary } from '@/lib/handbook/types';

function SpellsPageContent() {
  const { filters, setFilter, clearFilters } = useFilters<SpellFilterState>();

  // Build API filter params
  const apiFilters = {
    level: filters.level,
    school: filters.school,
    concentration: filters.concentration,
    ritual: filters.ritual,
  };

  const {
    data: spells,
    isLoading,
    error,
    page,
    setPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedContent<SpellSummary>(
    `spells:${JSON.stringify(apiFilters)}`,
    (page, limit) => getSpells({ page, limit, ...apiFilters }),
    { initialPage: 1, limit: 20 }
  );

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading spells: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white text-xl">
          Spells
        </h2>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        sections={SPELL_FILTER_SECTIONS}
        values={filters}
        onChange={(key, value) => setFilter(key as keyof SpellFilterState, value as SpellFilterState[keyof SpellFilterState])}
        onClear={clearFilters}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : spells && spells.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spells.map((spell) => (
              <SpellCard
                key={spell.id}
                id={spell.id}
                name={spell.name}
                slug={spell.slug}
                level={spell.level}
                school={spell.school}
                castingTime={spell.castingTime}
                concentration={spell.concentration}
                ritual={spell.ritual}
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
          <p>No spells found</p>
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

export default function SpellsPage() {
  return (
    <Suspense fallback={<SpellsPageSkeleton />}>
      <SpellsPageContent />
    </Suspense>
  );
}

function SpellsPageSkeleton() {
  return (
    <div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
