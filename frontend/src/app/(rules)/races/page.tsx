/**
 * Races List Page
 * T083: Create races list page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchRaces } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';

export default function RacesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['races'],
    queryFn: () => fetchRaces({ pageSize: 50 }),
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Races</h1>
        <ContentSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Races</h1>
        <div className="text-red-600">Failed to load races. Please try again.</div>
      </div>
    );
  }

  const races = data?.items || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Races</h1>
      <p className="text-gray-600 mb-6">
        Choose your race to define your character&apos;s heritage, abilities, and cultural background.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {races.map(race => (
          <Link
            key={race.id}
            href={`/races/${race.slug}`}
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {race.name}
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Size: {race.size}</p>
              <p>Speed: {race.speed} ft.</p>
            </div>
          </Link>
        ))}
      </div>

      {races.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No races found. Races will be available once the database is seeded.
        </p>
      )}
    </div>
  );
}
