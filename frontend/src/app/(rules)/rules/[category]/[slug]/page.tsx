/**
 * Rule Detail Page
 * T079: Create rule detail page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchRule, fetchRuleCategoryPath } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';
import Breadcrumb from '@/components/layout/Breadcrumb';
import RuleCard from '@/components/content/RuleCard';

interface RuleDetailPageProps {
  params: { category: string; slug: string };
}

export default function RuleDetailPage({ params }: RuleDetailPageProps) {
  const { category, slug } = params;

  const { data: rule, isLoading, isError } = useQuery({
    queryKey: ['rule', slug],
    queryFn: () => fetchRule(slug),
  });

  const { data: pathData } = useQuery({
    queryKey: ['ruleCategoryPath', category],
    queryFn: () => fetchRuleCategoryPath(category),
    enabled: !!category,
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <ContentSkeleton />
      </div>
    );
  }

  if (isError || !rule) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Rule Not Found</h1>
        <p className="text-gray-600 mb-4">
          The rule you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/rules" className="text-blue-600 hover:text-blue-800">
          ← Back to Rules
        </Link>
      </div>
    );
  }

  // Build breadcrumb items from path
  const categoryItems = pathData
    ? pathData.map((cat) => ({
        label: cat.name,
        href: `/rules/${cat.slug}`,
      }))
    : [{ label: 'Category', href: `/rules/${category}` }];

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Rules', href: '/rules' },
          ...categoryItems,
          { label: rule.title },
        ]}
      />

      <RuleCard rule={rule} categorySlug={category} showFullContent />
    </div>
  );
}
