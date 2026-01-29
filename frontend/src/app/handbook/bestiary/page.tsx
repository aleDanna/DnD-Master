// Bestiary Page - T023
// Display monsters list with CR, size, type

'use client';

import { usePaginatedContent } from '@/hooks/handbook/useContent';
import { MonsterCard } from '@/components/handbook/ContentCard';
import { getMonsters } from '@/lib/handbook/api';
import type { MonsterSummary } from '@/lib/handbook/types';

export default function BestiaryPage() {
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
    'monsters',
    (page, limit) => getMonsters({ page, limit }),
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
        {/* Filter controls will be added in Phase 7 (US5) */}
      </div>

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
        </div>
      )}
    </div>
  );
}
