// Rule Detail Page - T029
// Display full rule content with breadcrumb and cross-references

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useContent } from '@/hooks/handbook/useContent';
import { getRule } from '@/lib/handbook/api';
import type { Rule } from '@/lib/handbook/types';

export default function RuleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const {
    data: rule,
    isLoading,
    error,
  } = useContent<Rule>(`rule:${slug}`, () => getRule(slug));

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading rule: {error.message}
      </div>
    );
  }

  if (isLoading || !rule) {
    return <RuleDetailSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link
              href="/handbook/rules"
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              Rules
            </Link>
          </li>
          {rule.categoryPath?.map((category, index) => (
            <li key={index} className="flex items-center">
              <ChevronRight />
              <span className="ml-2">{category}</span>
            </li>
          ))}
          <li className="flex items-center">
            <ChevronRight />
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {rule.title}
            </span>
          </li>
        </ol>
      </nav>

      {/* Rule Content */}
      <article className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {rule.title}
        </h1>

        {rule.summary && (
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 italic">
            {rule.summary}
          </p>
        )}

        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: formatRuleContent(rule.content) }}
        />
      </article>

      {/* Related Rules (T030) */}
      {rule.relatedRules && rule.relatedRules.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Related Rules
          </h2>
          <div className="grid gap-3">
            {rule.relatedRules.map((related) => (
              <Link
                key={related.id}
                href={`/handbook/rules/${related.slug}`}
                className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {related.title}
                </h3>
                {related.summary && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {related.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back link */}
      <div className="mt-8">
        <Link
          href="/handbook/rules"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
        >
          ← Back to Rules
        </Link>
      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg
      className="w-4 h-4 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function RuleDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4" />
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}

// Format rule content for display
function formatRuleContent(content: string): string {
  if (!content) return '';

  // Basic markdown-style formatting
  return content
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4">')
    // Wrap in paragraph
    .replace(/^/, '<p class="mb-4">')
    .replace(/$/, '</p>');
}
