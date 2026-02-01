/**
 * Class Detail Page
 * T081: Create class detail page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchClass } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ClassDetail from '@/components/content/ClassDetail';

interface ClassDetailPageProps {
  params: { slug: string };
}

export default function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { slug } = params;

  const { data: classData, isLoading, isError } = useQuery({
    queryKey: ['class', slug],
    queryFn: () => fetchClass(slug),
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <ContentSkeleton />
      </div>
    );
  }

  if (isError || !classData) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Class Not Found</h1>
        <p className="text-gray-600 mb-4">
          The class you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/classes" className="text-blue-600 hover:text-blue-800">
          ← Back to Classes
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Classes', href: '/classes' },
          { label: classData.name },
        ]}
      />

      <ClassDetail classData={classData} />
    </div>
  );
}
