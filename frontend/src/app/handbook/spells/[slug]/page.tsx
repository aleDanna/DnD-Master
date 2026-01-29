// Spell Detail Page - T043
// Display full spell information

'use client';

import { useParams } from 'next/navigation';
import { useContent } from '@/hooks/handbook/useContent';
import { getSpell } from '@/lib/handbook/api';
import { SpellDetail } from '@/components/handbook/SpellDetail';
import type { Spell } from '@/lib/handbook/types';

export default function SpellDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const {
    data: spell,
    isLoading,
    error,
  } = useContent<Spell>(`spell:${slug}`, () => getSpell(slug));

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading spell: {error.message}</p>
      </div>
    );
  }

  if (isLoading || !spell) {
    return <SpellDetailSkeleton />;
  }

  return <SpellDetail spell={spell} />;
}

function SpellDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}
