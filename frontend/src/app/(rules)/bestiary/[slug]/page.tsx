/**
 * Monster Detail Page
 * T088: Create monster detail page
 */

'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchMonster } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';
import Breadcrumb from '@/components/layout/Breadcrumb';
import MonsterStatBlock from '@/components/content/MonsterStatBlock';

interface MonsterDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function MonsterDetailPage({ params }: MonsterDetailPageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const { data: monster, isLoading, isError } = useQuery({
    queryKey: ['monster', slug],
    queryFn: () => fetchMonster(slug),
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <ContentSkeleton />
      </div>
    );
  }

  if (isError || !monster) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Monster Not Found</h1>
        <p className="text-gray-600 mb-4">
          The monster you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/bestiary" className="text-blue-600 hover:text-blue-800">
          ← Back to Bestiary
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Bestiary', href: '/bestiary' },
          { label: monster.name },
        ]}
      />

      <MonsterStatBlock monster={monster} showFullContent />
    </div>
  );
}
