/**
 * Condition Card Component
 * T074: Create ConditionCard component for displaying condition information
 */

'use client';

import Link from 'next/link';
import { Condition, ConditionSummary } from '@/types/content.types';
import SourceCitation from './SourceCitation';

interface ConditionCardProps {
  condition: Condition | ConditionSummary;
  showFullContent?: boolean;
}

function getConditionIcon(name: string): string {
  const icons: Record<string, string> = {
    blinded: '👁️',
    charmed: '💕',
    deafened: '👂',
    exhaustion: '😴',
    frightened: '😨',
    grappled: '🤝',
    incapacitated: '🚫',
    invisible: '👻',
    paralyzed: '⚡',
    petrified: '🗿',
    poisoned: '☠️',
    prone: '⬇️',
    restrained: '⛓️',
    stunned: '💫',
    unconscious: '💤',
  };
  return icons[name.toLowerCase()] || '⚠️';
}

export default function ConditionCard({
  condition,
  showFullContent = false,
}: ConditionCardProps) {
  const isFullCondition = 'description' in condition;

  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getConditionIcon(condition.name)}</span>
            <h3 className="text-lg font-semibold text-gray-900">
              {showFullContent ? (
                condition.name
              ) : (
                <Link
                  href={`/conditions/${condition.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {condition.name}
                </Link>
              )}
            </h3>
          </div>
          <SourceCitation source={condition.source} compact />
        </div>

        {/* Full Details */}
        {showFullContent && isFullCondition && (
          <div className="mt-4">
            {/* Description */}
            <div className="prose prose-sm max-w-none text-gray-700">
              <div
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: condition.description.replace(/\n/g, '<br/>'),
                }}
              />
            </div>
          </div>
        )}

        {/* Read More Link */}
        {!showFullContent && (
          <div className="mt-4">
            <Link
              href={`/conditions/${condition.slug}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View effects →
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
