// Item Detail Page - T051
// Display full item information

'use client';

import { useParams } from 'next/navigation';
import { useContent } from '@/hooks/handbook/useContent';
import { getItem } from '@/lib/handbook/api';
import { ItemDetail } from '@/components/handbook/ItemDetail';
import type { Item } from '@/lib/handbook/types';

export default function ItemDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const {
    data: item,
    isLoading,
    error,
  } = useContent<Item>(`item:${slug}`, () => getItem(slug));

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading item: {error.message}</p>
      </div>
    );
  }

  if (isLoading || !item) {
    return <ItemDetailSkeleton />;
  }

  return <ItemDetail item={item} />;
}

function ItemDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}
