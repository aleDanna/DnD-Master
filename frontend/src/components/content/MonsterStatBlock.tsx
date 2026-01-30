/**
 * Monster Stat Block Component
 * T070: Create MonsterStatBlock component for displaying monster information
 */

'use client';

import Link from 'next/link';
import { Monster, MonsterSummary, getAbilityModifier, formatModifier } from '@/types/content.types';
import SourceCitation from './SourceCitation';

interface MonsterStatBlockProps {
  monster: Monster | MonsterSummary;
  showFullContent?: boolean;
}

function formatSpeed(speed: Monster['speed']): string {
  const parts: string[] = [];
  if (speed.walk) parts.push(`${speed.walk} ft.`);
  if (speed.fly) parts.push(`fly ${speed.fly} ft.${speed.hover ? ' (hover)' : ''}`);
  if (speed.swim) parts.push(`swim ${speed.swim} ft.`);
  if (speed.climb) parts.push(`climb ${speed.climb} ft.`);
  if (speed.burrow) parts.push(`burrow ${speed.burrow} ft.`);
  return parts.join(', ') || '0 ft.';
}

function formatSenses(senses: Monster['senses']): string {
  if (!senses) return 'passive Perception 10';
  const parts: string[] = [];
  if (senses.darkvision) parts.push(`darkvision ${senses.darkvision} ft.`);
  if (senses.blindsight) parts.push(`blindsight ${senses.blindsight} ft.`);
  if (senses.tremorsense) parts.push(`tremorsense ${senses.tremorsense} ft.`);
  if (senses.truesight) parts.push(`truesight ${senses.truesight} ft.`);
  parts.push(`passive Perception ${senses.passivePerception || 10}`);
  return parts.join(', ');
}

const ABILITY_NAMES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

export default function MonsterStatBlock({
  monster,
  showFullContent = false,
}: MonsterStatBlockProps) {
  const isFullMonster = 'abilityScores' in monster;

  // Summary view for list pages
  if (!showFullContent || !isFullMonster) {
    return (
      <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                <Link
                  href={`/bestiary/${monster.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {monster.name}
                </Link>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {monster.size} {monster.type}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-1 text-sm font-medium bg-red-100 text-red-800 rounded">
                CR {monster.challengeRating}
              </span>
              <SourceCitation source={monster.source} compact className="mt-1" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              href={`/bestiary/${monster.slug}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View stat block →
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // Full stat block view
  return (
    <article className="bg-amber-50 rounded-lg border-2 border-amber-600 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b-2 border-amber-600 bg-amber-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-amber-900">{monster.name}</h1>
            <p className="text-amber-800 italic">
              {monster.size} {monster.type}
              {monster.subtype && ` (${monster.subtype})`}
              {monster.alignment && `, ${monster.alignment}`}
            </p>
          </div>
          <SourceCitation source={monster.source} />
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Basic Stats */}
        <div className="space-y-1 text-sm border-b-2 border-amber-600 pb-4">
          <p>
            <span className="font-bold text-amber-900">Armor Class</span>{' '}
            {monster.armorClass}
            {monster.armorType && ` (${monster.armorType})`}
          </p>
          <p>
            <span className="font-bold text-amber-900">Hit Points</span>{' '}
            {monster.hitPoints} ({monster.hitDice})
          </p>
          <p>
            <span className="font-bold text-amber-900">Speed</span>{' '}
            {formatSpeed(monster.speed)}
          </p>
        </div>

        {/* Ability Scores */}
        <div className="grid grid-cols-6 gap-2 text-center border-b-2 border-amber-600 pb-4">
          {ABILITY_NAMES.map((name, index) => {
            const key = ABILITY_KEYS[index];
            const score = monster.abilityScores[key];
            const mod = getAbilityModifier(score);
            return (
              <div key={name}>
                <div className="font-bold text-amber-900 text-sm">{name}</div>
                <div className="text-sm">
                  {score} ({formatModifier(mod)})
                </div>
              </div>
            );
          })}
        </div>

        {/* Defenses and Senses */}
        <div className="space-y-1 text-sm border-b-2 border-amber-600 pb-4">
          {monster.savingThrows && Object.keys(monster.savingThrows).length > 0 && (
            <p>
              <span className="font-bold text-amber-900">Saving Throws</span>{' '}
              {Object.entries(monster.savingThrows)
                .map(([ability, bonus]) => `${ability.charAt(0).toUpperCase() + ability.slice(1)} ${formatModifier(bonus as number)}`)
                .join(', ')}
            </p>
          )}
          {monster.skills && Object.keys(monster.skills).length > 0 && (
            <p>
              <span className="font-bold text-amber-900">Skills</span>{' '}
              {Object.entries(monster.skills)
                .map(([skill, bonus]) => `${skill} ${formatModifier(bonus as number)}`)
                .join(', ')}
            </p>
          )}
          {monster.damageVulnerabilities.length > 0 && (
            <p>
              <span className="font-bold text-amber-900">Damage Vulnerabilities</span>{' '}
              {monster.damageVulnerabilities.join(', ')}
            </p>
          )}
          {monster.damageResistances.length > 0 && (
            <p>
              <span className="font-bold text-amber-900">Damage Resistances</span>{' '}
              {monster.damageResistances.join(', ')}
            </p>
          )}
          {monster.damageImmunities.length > 0 && (
            <p>
              <span className="font-bold text-amber-900">Damage Immunities</span>{' '}
              {monster.damageImmunities.join(', ')}
            </p>
          )}
          {monster.conditionImmunities.length > 0 && (
            <p>
              <span className="font-bold text-amber-900">Condition Immunities</span>{' '}
              {monster.conditionImmunities.join(', ')}
            </p>
          )}
          <p>
            <span className="font-bold text-amber-900">Senses</span>{' '}
            {formatSenses(monster.senses)}
          </p>
          <p>
            <span className="font-bold text-amber-900">Languages</span>{' '}
            {monster.languages.length > 0 ? monster.languages.join(', ') : '—'}
          </p>
          <p>
            <span className="font-bold text-amber-900">Challenge</span>{' '}
            {monster.challengeRating} ({monster.experiencePoints.toLocaleString()} XP)
          </p>
        </div>

        {/* Traits */}
        {monster.traits && monster.traits.length > 0 && (
          <div className="space-y-3 border-b-2 border-amber-600 pb-4">
            {monster.traits.map((trait, index) => (
              <div key={index}>
                <span className="font-bold text-amber-900 italic">{trait.name}.</span>{' '}
                <span className="text-sm">{trait.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {monster.actions && monster.actions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-amber-900 border-b border-amber-600 pb-1">
              Actions
            </h3>
            {monster.actions.map((action, index) => (
              <div key={index}>
                <span className="font-bold text-amber-900 italic">{action.name}.</span>{' '}
                <span className="text-sm">{action.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {monster.reactions && monster.reactions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-amber-900 border-b border-amber-600 pb-1">
              Reactions
            </h3>
            {monster.reactions.map((reaction, index) => (
              <div key={index}>
                <span className="font-bold text-amber-900 italic">{reaction.name}.</span>{' '}
                <span className="text-sm">{reaction.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Legendary Actions */}
        {monster.legendaryActions && monster.legendaryActions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-amber-900 border-b border-amber-600 pb-1">
              Legendary Actions
            </h3>
            <p className="text-sm text-gray-700">
              The {monster.name.toLowerCase()} can take 3 legendary actions, choosing from the
              options below. Only one legendary action option can be used at a time and only
              at the end of another creature&apos;s turn. The {monster.name.toLowerCase()}{' '}
              regains spent legendary actions at the start of its turn.
            </p>
            {monster.legendaryActions.map((action, index) => (
              <div key={index}>
                <span className="font-bold text-amber-900 italic">{action.name}.</span>{' '}
                <span className="text-sm">{action.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Lair Actions */}
        {monster.lairActions && monster.lairActions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-amber-900 border-b border-amber-600 pb-1">
              Lair Actions
            </h3>
            {monster.lairActions.map((action, index) => (
              <div key={index}>
                <span className="font-bold text-amber-900 italic">{action.name}.</span>{' '}
                <span className="text-sm">{action.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        {monster.description && (
          <div className="bg-amber-100 rounded-lg p-4 mt-4">
            <p className="text-sm text-amber-900 italic">{monster.description}</p>
          </div>
        )}
      </div>
    </article>
  );
}
