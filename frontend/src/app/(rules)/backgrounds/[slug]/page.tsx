/**
 * Background Detail Page
 * T092: Create background detail page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchBackground } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';
import Breadcrumb from '@/components/layout/Breadcrumb';
import BackgroundCard from '@/components/content/BackgroundCard';

interface BackgroundDetailPageProps {
  params: { slug: string };
}

export default function BackgroundDetailPage({ params }: BackgroundDetailPageProps) {
  const { slug } = params;

  const { data: background, isLoading, isError } = useQuery({
    queryKey: ['background', slug],
    queryFn: () => fetchBackground(slug),
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <ContentSkeleton />
      </div>
    );
  }

  if (isError || !background) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Background Not Found</h1>
        <p className="text-gray-600 mb-4">
          The background you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/backgrounds" className="text-blue-600 hover:text-blue-800">
          ← Back to Backgrounds
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Backgrounds', href: '/backgrounds' },
          { label: background.name },
        ]}
      />

      <BackgroundCard background={background} showFullContent />
    </div>
  );
}
