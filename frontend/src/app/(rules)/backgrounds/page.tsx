/**
 * Backgrounds List Page
 * T091: Create backgrounds list page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchBackgrounds } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';

export default function BackgroundsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['backgrounds'],
    queryFn: () => fetchBackgrounds({ pageSize: 50 }),
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Backgrounds</h1>
        <ContentSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Backgrounds</h1>
        <div className="text-red-600">Failed to load backgrounds. Please try again.</div>
      </div>
    );
  }

  const backgrounds = data?.items || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Backgrounds</h1>
      <p className="text-gray-600 mb-6">
        Choose a background to define your character&apos;s history before becoming an adventurer.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {backgrounds.map((bg) => (
          <Link
            key={bg.id}
            href={`/backgrounds/${bg.slug}`}
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {bg.name}
            </h2>
            <p className="text-sm text-gray-600">
              Skills: {bg.skillProficiencies.join(', ')}
            </p>
          </Link>
        ))}
      </div>

      {backgrounds.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No backgrounds found. Backgrounds will be available once the database is seeded.
        </p>
      )}
    </div>
  );
}
