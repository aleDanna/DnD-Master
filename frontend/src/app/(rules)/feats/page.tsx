/**
 * Feats List Page
 * T093: Create feats list page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchFeats } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';

export default function FeatsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['feats'],
    queryFn: () => fetchFeats({ pageSize: 100 }),
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Feats</h1>
        <ContentSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Feats</h1>
        <div className="text-red-600">Failed to load feats. Please try again.</div>
      </div>
    );
  }

  const feats = data?.items || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Feats</h1>
      <p className="text-gray-600 mb-6">
        Feats represent special training and abilities that give your character unique capabilities.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {feats.map((feat) => (
          <Link
            key={feat.id}
            href={`/feats/${feat.slug}`}
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {feat.name}
            </h2>
            {feat.prerequisites && (
              <p className="text-sm text-orange-600">
                Prerequisite: {feat.prerequisites}
              </p>
            )}
          </Link>
        ))}
      </div>

      {feats.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No feats found. Feats will be available once the database is seeded.
        </p>
      )}
    </div>
  );
}
