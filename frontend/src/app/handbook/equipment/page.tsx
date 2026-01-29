// Equipment Page - T024, T052
// Display items list with filtering by type, rarity

'use client';

import { Suspense } from 'react';
import { usePaginatedContent } from '@/hooks/handbook/useContent';
import { useFilters, ItemFilterState } from '@/hooks/handbook/useFilters';
import { ItemCard } from '@/components/handbook/ContentCard';
import { FilterPanel, ITEM_FILTER_SECTIONS } from '@/components/handbook/FilterPanel';
import { getItems } from '@/lib/handbook/api';
import type { ItemSummary } from '@/lib/handbook/types';

function EquipmentPageContent() {
  const { filters, setFilter, clearFilters } = useFilters<ItemFilterState>();

  // Build API filter params
  const apiFilters = {
    type: filters.type,
    rarity: filters.rarity,
    attunementRequired: filters.attunement,
  };

  const {
    data: items,
    isLoading,
    error,
    page,
    setPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedContent<ItemSummary>(
    `items:${JSON.stringify(apiFilters)}`,
    (page, limit) => getItems({ page, limit, ...apiFilters }),
    { initialPage: 1, limit: 20 }
  );

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading items: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white text-xl">
          Equipment
        </h2>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        sections={ITEM_FILTER_SECTIONS}
        values={filters}
        onChange={(key, value) => setFilter(key as keyof ItemFilterState, value as ItemFilterState[keyof ItemFilterState])}
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
      ) : items && items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                id={item.id}
                name={item.name}
                slug={item.slug}
                itemType={item.itemType}
                rarity={item.rarity}
                attunementRequired={item.attunementRequired}
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
          <p>No items found</p>
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

export default function EquipmentPage() {
  return (
    <Suspense fallback={<EquipmentPageSkeleton />}>
      <EquipmentPageContent />
    </Suspense>
  );
}

function EquipmentPageSkeleton() {
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
