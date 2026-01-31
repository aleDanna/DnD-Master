/**
 * Feat Card Component
 * T073: Create FeatCard component for displaying feat information
 */

'use client';

import Link from 'next/link';
import { Feat, FeatSummary } from '@/types/content.types';
import SourceCitation from './SourceCitation';

interface FeatCardProps {
  feat: Feat | FeatSummary;
  showFullContent?: boolean;
}

export default function FeatCard({ feat, showFullContent = false }: FeatCardProps) {
  const isFullFeat = 'description' in feat;

  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {showFullContent ? (
              feat.name
            ) : (
              <Link
                href={`/feats/${feat.slug}`}
                className="hover:text-blue-600 transition-colors"
              >
                {feat.name}
              </Link>
            )}
          </h3>
          <SourceCitation source={feat.source} compact />
        </div>

        {/* Prerequisites */}
        {feat.prerequisites && (
          <p className="text-sm text-orange-600 mb-3">
            <span className="font-medium">Prerequisite:</span> {feat.prerequisites}
          </p>
        )}

        {/* Full Details */}
        {showFullContent && isFullFeat && (
          <div className="space-y-4 mt-4">
            {/* Description */}
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>{feat.description}</p>
            </div>

            {/* Benefits */}
            {feat.benefits && (
              <div className="space-y-3">
                {/* Ability Score Increases */}
                {feat.benefits.abilityScoreIncrease &&
                  feat.benefits.abilityScoreIncrease.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Ability Score Increase
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {feat.benefits.abilityScoreIncrease.map((increase, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-green-200"
                          >
                            {increase.ability} +{increase.bonus}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Proficiencies */}
                {feat.benefits.proficiencies && feat.benefits.proficiencies.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Proficiencies</h4>
                    <div className="flex flex-wrap gap-2">
                      {feat.benefits.proficiencies.map((prof, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                        >
                          {prof}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Benefits */}
                {feat.benefits.other && feat.benefits.other.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Benefits</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {feat.benefits.other.map((benefit, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Read More Link */}
        {!showFullContent && (
          <div className="mt-4">
            <Link
              href={`/feats/${feat.slug}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View details →
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
