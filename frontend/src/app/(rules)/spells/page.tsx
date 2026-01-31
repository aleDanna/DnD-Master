/**
 * Spells List Page
 * T085: Create spells list page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchSpells } from '@/lib/api/contentApi';
import { getSpellLevelText } from '@/types/content.types';
import { ContentSkeleton } from '@/components/layout/ContentPanel';

export default function SpellsPage() {
  const searchParams = useSearchParams();
  const level = searchParams.get('level');
  const school = searchParams.get('school');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['spells', level, school],
    queryFn: () => fetchSpells({
      pageSize: 50,
      level: level ? parseInt(level, 10) : undefined,
      school: school || undefined,
    }),
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Spells</h1>
        <ContentSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Spells</h1>
        <div className="text-red-600">Failed to load spells. Please try again.</div>
      </div>
    );
  }

  const spells = data?.items || [];
  const title = level !== null
    ? `${getSpellLevelText(parseInt(level, 10))} Spells`
    : school
      ? `${school} Spells`
      : 'Spells';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600 mb-6">
        Browse spells by level or school. Click on a spell to view its details.
      </p>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/spells"
          className={`px-3 py-1 text-sm rounded-full ${
            !level && !school
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </Link>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => (
          <Link
            key={lvl}
            href={`/spells?level=${lvl}`}
            className={`px-3 py-1 text-sm rounded-full ${
              level === String(lvl)
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {lvl === 0 ? 'Cantrips' : `Level ${lvl}`}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {spells.map(spell => (
          <Link
            key={spell.id}
            href={`/spells/${spell.slug}`}
            className="block p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-gray-900">{spell.name}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{spell.school}</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                  {getSpellLevelText(spell.level)}
                </span>
              </div>
            </div>
            <div className="mt-1 flex gap-3 text-xs text-gray-400">
              {spell.concentration && <span>Concentration</span>}
              {spell.ritual && <span>Ritual</span>}
            </div>
          </Link>
        ))}
      </div>

      {spells.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No spells found. Spells will be available once the database is seeded.
        </p>
      )}
    </div>
  );
}
