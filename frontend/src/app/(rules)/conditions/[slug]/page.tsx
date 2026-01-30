/**
 * Condition Detail Page
 * T096: Create condition detail page
 */

'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchCondition } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ConditionCard from '@/components/content/ConditionCard';

interface ConditionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function ConditionDetailPage({ params }: ConditionDetailPageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const { data: condition, isLoading, isError } = useQuery({
    queryKey: ['condition', slug],
    queryFn: () => fetchCondition(slug),
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <ContentSkeleton />
      </div>
    );
  }

  if (isError || !condition) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Condition Not Found</h1>
        <p className="text-gray-600 mb-4">
          The condition you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/conditions" className="text-blue-600 hover:text-blue-800">
          ← Back to Conditions
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Conditions', href: '/conditions' },
          { label: condition.name },
        ]}
      />

      <ConditionCard condition={condition} showFullContent />
    </div>
  );
}
