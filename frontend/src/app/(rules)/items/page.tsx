/**
 * Items List Page
 * T089: Create items list page
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchItems, fetchItemTypes } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';
import { formatCost } from '@/types/content.types';

export default function ItemsPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { data: typesData } = useQuery({
    queryKey: ['itemTypes'],
    queryFn: fetchItemTypes,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['items', selectedType],
    queryFn: () => fetchItems({ pageSize: 100, type: selectedType || undefined }),
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Items</h1>
        <ContentSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Items</h1>
        <div className="text-red-600">Failed to load items. Please try again.</div>
      </div>
    );
  }

  const items = data?.items || [];
  const types = typesData || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Items</h1>
      <p className="text-gray-600 mb-6">
        Browse equipment, weapons, armor, and magical items.
      </p>

      {/* Type Filter */}
      {types.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedType === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/items/${item.slug}`}
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {item.name}
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="capitalize">{item.type}</p>
              {item.rarity && (
                <p className="capitalize text-purple-600">{item.rarity}</p>
              )}
              {item.cost && <p>{formatCost(item.cost)}</p>}
            </div>
          </Link>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No items found. Items will be available once the database is seeded.
        </p>
      )}
    </div>
  );
}
