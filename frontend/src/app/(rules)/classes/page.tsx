/**
 * Classes List Page
 * T080: Create classes list page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchClasses } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';

export default function ClassesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['classes'],
    queryFn: () => fetchClasses({ pageSize: 50 }),
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Classes</h1>
        <ContentSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Classes</h1>
        <div className="text-red-600">Failed to load classes. Please try again.</div>
      </div>
    );
  }

  const classes = data?.items || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Classes</h1>
      <p className="text-gray-600 mb-6">
        Choose your class to define your character&apos;s abilities and role in the party.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map(cls => (
          <Link
            key={cls.id}
            href={`/classes/${cls.slug}`}
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {cls.name}
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Hit Die: {cls.hitDie}</p>
              <p>Primary: {cls.primaryAbility}</p>
            </div>
          </Link>
        ))}
      </div>

      {classes.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No classes found. Classes will be available once the database is seeded.
        </p>
      )}
    </div>
  );
}
