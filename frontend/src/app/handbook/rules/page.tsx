// Rules Page - T021
// Display rule categories and rules list

'use client';

import { useState } from 'react';
import { useContent, usePaginatedContent } from '@/hooks/handbook/useContent';
import { ContentCard } from '@/components/handbook/ContentCard';
import { getRuleCategories, getRules } from '@/lib/handbook/api';
import type { RuleCategory, RuleSummary } from '@/lib/handbook/types';

export default function RulesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useContent<RuleCategory[]>('rule-categories', getRuleCategories);

  // Fetch rules with pagination
  const {
    data: rules,
    isLoading: rulesLoading,
    error: rulesError,
    page,
    setPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedContent<RuleSummary>(
    `rules${selectedCategory ? `:category=${selectedCategory}` : ''}`,
    (page, limit) =>
      getRules({ page, limit, categoryId: selectedCategory || undefined }),
    { initialPage: 1, limit: 20 }
  );

  if (categoriesError || rulesError) {
    return (
      <div className="text-red-500 p-4">
        Error loading rules: {(categoriesError || rulesError)?.message}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Categories Sidebar */}
      <aside className="lg:col-span-1">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
          Categories
        </h2>
        {categoriesLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              />
            ))}
          </div>
        ) : (
          <nav className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`
                w-full text-left px-3 py-2 rounded-lg text-sm
                transition-colors duration-200
                ${
                  !selectedCategory
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              All Rules
            </button>
            {categories?.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm
                  transition-colors duration-200
                  ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <span className="block font-medium">{category.name}</span>
                {category.childCount !== undefined && category.childCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {category.childCount} subcategories
                  </span>
                )}
              </button>
            ))}
          </nav>
        )}
      </aside>

      {/* Rules List */}
      <div className="lg:col-span-3">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {selectedCategory
              ? categories?.find((c) => c.id === selectedCategory)?.name || 'Rules'
              : 'All Rules'}
          </h2>
        </div>

        {rulesLoading ? (
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : rules && rules.length > 0 ? (
          <>
            <div className="grid gap-4">
              {rules.map((rule) => (
                <ContentCard
                  key={rule.id}
                  id={rule.id}
                  name={rule.title}
                  slug={rule.slug}
                  type="rule"
                  excerpt={rule.summary}
                  badges={
                    rule.categoryPath.length > 0
                      ? [{ label: rule.categoryPath[rule.categoryPath.length - 1], color: 'gray' }]
                      : []
                  }
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!hasPrevPage}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!hasNextPage}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No rules found</p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="mt-2 text-blue-600 hover:underline"
              >
                View all rules
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
