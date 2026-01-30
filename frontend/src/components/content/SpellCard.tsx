/**
 * Spell Card Component
 * T069: Create SpellCard component for displaying spell information
 */

'use client';

import Link from 'next/link';
import { Spell, SpellSummary, getSpellLevelText } from '@/types/content.types';
import SourceCitation from './SourceCitation';

interface SpellCardProps {
  spell: Spell | SpellSummary;
  showFullContent?: boolean;
}

function getSchoolColor(school: string): string {
  const colors: Record<string, string> = {
    Abjuration: 'bg-blue-100 text-blue-800',
    Conjuration: 'bg-yellow-100 text-yellow-800',
    Divination: 'bg-purple-100 text-purple-800',
    Enchantment: 'bg-pink-100 text-pink-800',
    Evocation: 'bg-red-100 text-red-800',
    Illusion: 'bg-indigo-100 text-indigo-800',
    Necromancy: 'bg-gray-800 text-gray-100',
    Transmutation: 'bg-green-100 text-green-800',
  };
  return colors[school] || 'bg-gray-100 text-gray-800';
}

export default function SpellCard({ spell, showFullContent = false }: SpellCardProps) {
  const isFullSpell = 'description' in spell;
  const levelText = getSpellLevelText(spell.level);

  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {showFullContent ? (
              spell.name
            ) : (
              <Link
                href={`/spells/${spell.slug}`}
                className="hover:text-blue-600 transition-colors"
              >
                {spell.name}
              </Link>
            )}
          </h3>
          <SourceCitation source={spell.source} compact />
        </div>

        {/* Level and School */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">{levelText}</span>
          <span className={`px-2 py-0.5 text-xs rounded-full ${getSchoolColor(spell.school)}`}>
            {spell.school}
          </span>
          {spell.concentration && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800">
              Concentration
            </span>
          )}
          {spell.ritual && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-800">
              Ritual
            </span>
          )}
        </div>
      </div>

      {/* Spell Details */}
      {showFullContent && isFullSpell && (
        <div className="p-4 sm:p-6 space-y-4">
          {/* Casting Properties */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-900">Casting Time:</span>
              <span className="ml-2 text-gray-700">{spell.castingTime}</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Range:</span>
              <span className="ml-2 text-gray-700">{spell.range}</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Components:</span>
              <span className="ml-2 text-gray-700">
                {[
                  spell.components.verbal && 'V',
                  spell.components.somatic && 'S',
                  spell.components.material && 'M',
                ]
                  .filter(Boolean)
                  .join(', ')}
                {spell.components.materialDescription && (
                  <span className="text-gray-500">
                    {' '}
                    ({spell.components.materialDescription})
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Duration:</span>
              <span className="ml-2 text-gray-700">{spell.duration}</span>
            </div>
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none text-gray-700">
            <p>{spell.description}</p>
          </div>

          {/* At Higher Levels */}
          {spell.higherLevels && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-1">At Higher Levels</h4>
              <p className="text-sm text-gray-700">{spell.higherLevels}</p>
            </div>
          )}

          {/* Classes */}
          {spell.classes && spell.classes.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <span className="font-medium text-gray-900 text-sm">Spell Lists:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {spell.classes.map((className) => (
                  <Link
                    key={className}
                    href={`/classes/${className.toLowerCase()}`}
                    className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {className}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Read More Link */}
      {!showFullContent && (
        <div className="px-4 sm:px-6 pb-4">
          <Link
            href={`/spells/${spell.slug}`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View spell →
          </Link>
        </div>
      )}
    </article>
  );
}
