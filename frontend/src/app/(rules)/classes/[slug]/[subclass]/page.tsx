/**
 * Subclass Detail Page
 * T082: Create subclass detail page
 */

'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchSubclass, fetchClass } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SourceCitation from '@/components/content/SourceCitation';

interface SubclassDetailPageProps {
  params: Promise<{ slug: string; subclass: string }>;
}

export default function SubclassDetailPage({ params }: SubclassDetailPageProps) {
  const resolvedParams = use(params);
  const { slug: classSlug, subclass: subclassSlug } = resolvedParams;

  const { data: subclass, isLoading, isError } = useQuery({
    queryKey: ['subclass', classSlug, subclassSlug],
    queryFn: () => fetchSubclass(classSlug, subclassSlug),
  });

  const { data: parentClass } = useQuery({
    queryKey: ['class', classSlug],
    queryFn: () => fetchClass(classSlug),
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <ContentSkeleton />
      </div>
    );
  }

  if (isError || !subclass) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Subclass Not Found</h1>
        <p className="text-gray-600 mb-4">
          The subclass you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href={`/classes/${classSlug}`} className="text-blue-600 hover:text-blue-800">
          ← Back to {parentClass?.name || 'Class'}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Classes', href: '/classes' },
          { label: parentClass?.name || classSlug, href: `/classes/${classSlug}` },
          { label: subclass.name },
        ]}
      />

      <article className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{subclass.name}</h1>
              <p className="mt-1 text-gray-600">
                {parentClass?.name || classSlug} Subclass
              </p>
            </div>
            <SourceCitation source={subclass.source} />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-700">{subclass.description}</p>
          </section>

          {/* Subclass Features */}
          {subclass.features && subclass.features.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subclass Features</h2>
              <div className="space-y-4">
                {subclass.features.map((feature, index) => (
                  <div key={index} className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-medium text-gray-900">
                      {feature.name}
                      <span className="ml-2 text-sm text-gray-500">
                        (Level {feature.level})
                      </span>
                    </h3>
                    <p className="mt-1 text-gray-700 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
