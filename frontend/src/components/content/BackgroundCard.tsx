/**
 * Background Card Component
 * T072: Create BackgroundCard component for displaying background information
 */

'use client';

import Link from 'next/link';
import { Background, BackgroundSummary } from '@/types/content.types';
import SourceCitation from './SourceCitation';

interface BackgroundCardProps {
  background: Background | BackgroundSummary;
  showFullContent?: boolean;
}

export default function BackgroundCard({
  background,
  showFullContent = false,
}: BackgroundCardProps) {
  const isFullBackground = 'description' in background;

  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {showFullContent ? (
              background.name
            ) : (
              <Link
                href={`/backgrounds/${background.slug}`}
                className="hover:text-blue-600 transition-colors"
              >
                {background.name}
              </Link>
            )}
          </h3>
          <SourceCitation source={background.source} compact />
        </div>

        {/* Skill Proficiencies */}
        <div className="mb-3">
          <span className="text-sm text-gray-600">
            <span className="font-medium">Skills:</span>{' '}
            {background.skillProficiencies.join(', ')}
          </span>
        </div>

        {/* Full Details */}
        {showFullContent && isFullBackground && (
          <div className="space-y-4 mt-4">
            {/* Description */}
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>{background.description}</p>
            </div>

            {/* Proficiencies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {background.toolProficiencies.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-1">Tool Proficiencies</h4>
                  <p className="text-sm text-gray-700">
                    {background.toolProficiencies.join(', ')}
                  </p>
                </div>
              )}

              {background.languages !== null && background.languages > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-1">Languages</h4>
                  <p className="text-sm text-gray-700">
                    {background.languages} of your choice
                  </p>
                </div>
              )}
            </div>

            {/* Equipment */}
            <div className="bg-amber-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-1">Equipment</h4>
              <p className="text-sm text-gray-700">{background.equipment}</p>
            </div>

            {/* Feature */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-gray-900">{background.featureName}</h4>
              <p className="mt-1 text-sm text-gray-700">{background.featureDescription}</p>
            </div>

            {/* Suggested Characteristics */}
            {background.suggestedCharacteristics && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Suggested Characteristics</h4>

                {background.suggestedCharacteristics.personalityTraits.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Personality Traits
                    </h5>
                    <ul className="space-y-1">
                      {background.suggestedCharacteristics.personalityTraits.map(
                        (trait, index) => (
                          <li key={index} className="text-sm text-gray-600 pl-4 relative">
                            <span className="absolute left-0">{index + 1}.</span>
                            {trait}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {background.suggestedCharacteristics.ideals.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Ideals</h5>
                    <ul className="space-y-1">
                      {background.suggestedCharacteristics.ideals.map((ideal, index) => (
                        <li key={index} className="text-sm text-gray-600 pl-4 relative">
                          <span className="absolute left-0">{index + 1}.</span>
                          {ideal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {background.suggestedCharacteristics.bonds.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Bonds</h5>
                    <ul className="space-y-1">
                      {background.suggestedCharacteristics.bonds.map((bond, index) => (
                        <li key={index} className="text-sm text-gray-600 pl-4 relative">
                          <span className="absolute left-0">{index + 1}.</span>
                          {bond}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {background.suggestedCharacteristics.flaws.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Flaws</h5>
                    <ul className="space-y-1">
                      {background.suggestedCharacteristics.flaws.map((flaw, index) => (
                        <li key={index} className="text-sm text-gray-600 pl-4 relative">
                          <span className="absolute left-0">{index + 1}.</span>
                          {flaw}
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
              href={`/backgrounds/${background.slug}`}
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
