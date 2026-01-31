/**
 * Race Detail Page
 * T084: Create race detail page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchRace } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';
import Breadcrumb from '@/components/layout/Breadcrumb';
import RaceDetail from '@/components/content/RaceDetail';

interface RaceDetailPageProps {
  params: { slug: string };
}

export default function RaceDetailPage({ params }: RaceDetailPageProps) {
  const { slug } = params;

  const { data: race, isLoading, isError } = useQuery({
    queryKey: ['race', slug],
    queryFn: () => fetchRace(slug),
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <ContentSkeleton />
      </div>
    );
  }

  if (isError || !race) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Race Not Found</h1>
        <p className="text-gray-600 mb-4">
          The race you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/races" className="text-blue-600 hover:text-blue-800">
          ← Back to Races
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Races', href: '/races' },
          { label: race.name },
        ]}
      />

      <RaceDetail race={race} />
    </div>
  );
}
