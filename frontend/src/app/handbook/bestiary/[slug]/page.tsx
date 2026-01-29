// Monster Detail Page - T047
// Display full monster stat block

'use client';

import { useParams } from 'next/navigation';
import { useContent } from '@/hooks/handbook/useContent';
import { getMonster } from '@/lib/handbook/api';
import { MonsterStatBlock } from '@/components/handbook/MonsterStatBlock';
import type { Monster } from '@/lib/handbook/types';

export default function MonsterDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const {
    data: monster,
    isLoading,
    error,
  } = useContent<Monster>(`monster:${slug}`, () => getMonster(slug));

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading monster: {error.message}</p>
      </div>
    );
  }

  if (isLoading || !monster) {
    return <MonsterDetailSkeleton />;
  }

  return <MonsterStatBlock monster={monster} />;
}

function MonsterDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="bg-amber-50 dark:bg-gray-800 border-t-4 border-b-4 border-red-800/50 dark:border-red-700/50 p-6">
        {/* Header */}
        <div className="border-b-2 border-red-800/30 pb-4 mb-4">
          <div className="h-10 bg-red-200 dark:bg-red-900/30 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
        </div>

        {/* Basic Stats */}
        <div className="space-y-2 mb-4">
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
        </div>

        {/* Ability Scores */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-4 bg-red-200 dark:bg-red-900/30 rounded w-full mb-1" />
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}
