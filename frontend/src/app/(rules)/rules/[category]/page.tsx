/**
 * Rule Category Page
 * T078: Create rule category page
 */

'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchRuleCategory, fetchRuleCategoryPath } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';
import Breadcrumb from '@/components/layout/Breadcrumb';
import RuleCard from '@/components/content/RuleCard';

interface RuleCategoryPageProps {
  params: Promise<{ category: string }>;
}

export default function RuleCategoryPage({ params }: RuleCategoryPageProps) {
  const resolvedParams = use(params);
  const { category } = resolvedParams;

  const { data: categoryData, isLoading, isError } = useQuery({
    queryKey: ['ruleCategory', category],
    queryFn: () => fetchRuleCategory(category),
  });

  const { data: pathData } = useQuery({
    queryKey: ['ruleCategoryPath', category],
    queryFn: () => fetchRuleCategoryPath(category),
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <ContentSkeleton />
      </div>
    );
  }

  if (isError || !categoryData) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Category Not Found</h1>
        <p className="text-gray-600 mb-4">
          The rule category you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/rules" className="text-blue-600 hover:text-blue-800">
          ← Back to Rules
        </Link>
      </div>
    );
  }

  // Build breadcrumb items from path
  const breadcrumbItems = pathData
    ? pathData.map((cat) => ({
        label: cat.name,
        href: `/rules/${cat.slug}`,
      }))
    : [{ label: categoryData.name, href: `/rules/${categoryData.slug}` }];

  return (
    <div>
      <Breadcrumb
        items={[{ label: 'Rules', href: '/rules' }, ...breadcrumbItems]}
      />

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{categoryData.name}</h1>
      {categoryData.description && (
        <p className="text-gray-600 mb-6">{categoryData.description}</p>
      )}

      {/* Subcategories */}
      {categoryData.children && categoryData.children.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subcategories</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {categoryData.children.map((child) => (
              <Link
                key={child.id}
                href={`/rules/${child.slug}`}
                className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <h3 className="font-medium text-gray-900">{child.name}</h3>
                {child.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {child.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Rules in this category */}
      {categoryData.rules && categoryData.rules.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rules</h2>
          <div className="space-y-4">
            {categoryData.rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                categorySlug={category}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {(!categoryData.children || categoryData.children.length === 0) &&
        (!categoryData.rules || categoryData.rules.length === 0) && (
          <p className="text-gray-500 text-center py-8">
            No rules or subcategories found in this category.
          </p>
        )}
    </div>
  );
}
