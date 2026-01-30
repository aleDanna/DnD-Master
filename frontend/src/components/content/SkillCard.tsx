/**
 * Skill Card Component
 * T075: Create SkillCard component for displaying skill information
 */

'use client';

import Link from 'next/link';
import { Skill, SkillSummary } from '@/types/content.types';
import SourceCitation from './SourceCitation';

interface SkillCardProps {
  skill: Skill | SkillSummary;
  showFullContent?: boolean;
}

function getAbilityColor(ability: string): string {
  const colors: Record<string, string> = {
    Strength: 'bg-red-100 text-red-800',
    Dexterity: 'bg-green-100 text-green-800',
    Constitution: 'bg-orange-100 text-orange-800',
    Intelligence: 'bg-blue-100 text-blue-800',
    Wisdom: 'bg-purple-100 text-purple-800',
    Charisma: 'bg-pink-100 text-pink-800',
  };
  return colors[ability] || 'bg-gray-100 text-gray-800';
}

function getAbilityAbbr(ability: string): string {
  const abbrs: Record<string, string> = {
    Strength: 'STR',
    Dexterity: 'DEX',
    Constitution: 'CON',
    Intelligence: 'INT',
    Wisdom: 'WIS',
    Charisma: 'CHA',
  };
  return abbrs[ability] || ability.slice(0, 3).toUpperCase();
}

export default function SkillCard({ skill, showFullContent = false }: SkillCardProps) {
  const isFullSkill = 'description' in skill;

  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {showFullContent ? (
                skill.name
              ) : (
                <Link
                  href={`/skills/${skill.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {skill.name}
                </Link>
              )}
            </h3>
            <span
              className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getAbilityColor(
                skill.ability
              )}`}
            >
              {getAbilityAbbr(skill.ability)}
            </span>
          </div>
          <SourceCitation source={skill.source} compact />
        </div>

        {/* Full Details */}
        {showFullContent && isFullSkill && (
          <div className="mt-4">
            {/* Ability Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Associated Ability:</span> {skill.ability}
              </p>
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>{skill.description}</p>
            </div>
          </div>
        )}

        {/* Read More Link */}
        {!showFullContent && (
          <div className="mt-4">
            <Link
              href={`/skills/${skill.slug}`}
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
