/**
 * Conditions List Page
 * T095: Create conditions list page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchConditions } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';

function getConditionIcon(name: string): string {
  const icons: Record<string, string> = {
    blinded: '👁️',
    charmed: '💕',
    deafened: '👂',
    exhaustion: '😴',
    frightened: '😨',
    grappled: '🤝',
    incapacitated: '🚫',
    invisible: '👻',
    paralyzed: '⚡',
    petrified: '🗿',
    poisoned: '☠️',
    prone: '⬇️',
    restrained: '⛓️',
    stunned: '💫',
    unconscious: '💤',
  };
  return icons[name.toLowerCase()] || '⚠️';
}

export default function ConditionsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['conditions'],
    queryFn: () => fetchConditions({ pageSize: 50 }),
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Conditions</h1>
        <ContentSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Conditions</h1>
        <div className="text-red-600">Failed to load conditions. Please try again.</div>
      </div>
    );
  }

  const conditions = data?.items || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Conditions</h1>
      <p className="text-gray-600 mb-6">
        Conditions alter a creature&apos;s capabilities in various ways and can arise from spells, class features, monster attacks, or other effects.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {conditions.map((condition) => (
          <Link
            key={condition.id}
            href={`/conditions/${condition.slug}`}
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <span className="text-2xl">{getConditionIcon(condition.name)}</span>
            <h2 className="text-lg font-semibold text-gray-900">
              {condition.name}
            </h2>
          </Link>
        ))}
      </div>

      {conditions.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No conditions found. Conditions will be available once the database is seeded.
        </p>
      )}
    </div>
  );
}
