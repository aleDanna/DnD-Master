// Spells Page - T022
// Display spells list with level, school, casting time

'use client';

import { usePaginatedContent } from '@/hooks/handbook/useContent';
import { SpellCard } from '@/components/handbook/ContentCard';
import { getSpells } from '@/lib/handbook/api';
import type { SpellSummary } from '@/lib/handbook/types';

export default function SpellsPage() {
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
    'spells',
    (page, limit) => getSpells({ page, limit }),
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
        {/* Filter controls will be added in Phase 6 (US4) */}
      </div>

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
        </div>
      )}
    </div>
  );
}
