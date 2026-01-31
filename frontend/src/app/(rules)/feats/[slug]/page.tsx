/**
 * Feat Detail Page
 * T094: Create feat detail page
 */

'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchFeat } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';
import Breadcrumb from '@/components/layout/Breadcrumb';
import FeatCard from '@/components/content/FeatCard';

interface FeatDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function FeatDetailPage({ params }: FeatDetailPageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const { data: feat, isLoading, isError } = useQuery({
    queryKey: ['feat', slug],
    queryFn: () => fetchFeat(slug),
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <ContentSkeleton />
      </div>
    );
  }

  if (isError || !feat) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Feat Not Found</h1>
        <p className="text-gray-600 mb-4">
          The feat you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/feats" className="text-blue-600 hover:text-blue-800">
          ← Back to Feats
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Feats', href: '/feats' },
          { label: feat.name },
        ]}
      />

      <FeatCard feat={feat} showFullContent />
    </div>
  );
}
