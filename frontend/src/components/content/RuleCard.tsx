/**
 * Rule Card Component
 * T066: Create RuleCard component for displaying rule content
 */

'use client';

import Link from 'next/link';
import { Rule, RuleSummary } from '@/types/content.types';
import SourceCitation from './SourceCitation';

interface RuleCardProps {
  rule: Rule | RuleSummary;
  categorySlug: string;
  showFullContent?: boolean;
}

export default function RuleCard({
  rule,
  categorySlug,
  showFullContent = false,
}: RuleCardProps) {
  const isFullRule = 'content' in rule;

  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {showFullContent ? (
              rule.title
            ) : (
              <Link
                href={`/rules/${categorySlug}/${rule.slug}`}
                className="hover:text-blue-600 transition-colors"
              >
                {rule.title}
              </Link>
            )}
          </h3>
          <SourceCitation source={rule.source} compact />
        </div>

        {/* Summary */}
        {rule.summary && (
          <p className="text-gray-600 text-sm mb-4">{rule.summary}</p>
        )}

        {/* Full Content */}
        {showFullContent && isFullRule && (
          <div className="prose prose-sm max-w-none text-gray-700">
            <div dangerouslySetInnerHTML={{ __html: rule.content }} />
          </div>
        )}

        {/* Keywords */}
        {isFullRule && rule.keywords && rule.keywords.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {rule.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Read More Link */}
        {!showFullContent && (
          <div className="mt-4">
            <Link
              href={`/rules/${categorySlug}/${rule.slug}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Read more →
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
