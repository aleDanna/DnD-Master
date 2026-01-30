/**
 * Bestiary List Page
 * T087: Create bestiary list page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchMonsters } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';

export default function BestiaryPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const minCr = searchParams.get('minCr');
  const maxCr = searchParams.get('maxCr');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['monsters', type, minCr, maxCr],
    queryFn: () => fetchMonsters({
      pageSize: 50,
      type: type || undefined,
      minCr: minCr ? parseFloat(minCr) : undefined,
      maxCr: maxCr ? parseFloat(maxCr) : undefined,
    }),
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Bestiary</h1>
        <ContentSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Bestiary</h1>
        <div className="text-red-600">Failed to load monsters. Please try again.</div>
      </div>
    );
  }

  const monsters = data?.items || [];
  let title = 'Bestiary';
  if (type) title = `${type} Creatures`;
  if (minCr && maxCr) title = `CR ${minCr}-${maxCr} Creatures`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600 mb-6">
        Browse creatures by type or challenge rating.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {monsters.map(monster => (
          <Link
            key={monster.id}
            href={`/bestiary/${monster.slug}`}
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{monster.name}</h2>
                <p className="text-sm text-gray-600">
                  {monster.size} {monster.type}
                </p>
              </div>
              <span className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded font-medium">
                CR {monster.challengeRating}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {monsters.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No monsters found. Monsters will be available once the database is seeded.
        </p>
      )}
    </div>
  );
}
