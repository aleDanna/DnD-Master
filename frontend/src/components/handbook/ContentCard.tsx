// ContentCard Component - T018
// Generic summary card for handbook content

'use client';

import Link from 'next/link';
import type { ContentType } from '@/lib/handbook/types';

export interface ContentCardProps {
  id: string;
  name: string;
  slug: string;
  type: ContentType;
  href?: string;
  attributes?: {
    label: string;
    value: string | number | boolean;
  }[];
  badges?: {
    label: string;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  }[];
  excerpt?: string;
  onClick?: () => void;
  className?: string;
}

const BADGE_COLORS = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const TYPE_ICONS: Record<ContentType, string> = {
  spell: '✨',
  monster: '🐉',
  item: '⚔️',
  class: '🎭',
  race: '👤',
  rule: '📜',
  feat: '💪',
  background: '📖',
  condition: '⚠️',
  subclass: '🎭',
  subrace: '👤',
};

export function ContentCard({
  id,
  name,
  slug,
  type,
  href,
  attributes = [],
  badges = [],
  excerpt,
  onClick,
  className = '',
}: ContentCardProps) {
  const defaultHref = getDefaultHref(type, slug);
  const cardHref = href || defaultHref;

  const CardWrapper = cardHref ? Link : 'div';
  const cardProps = cardHref
    ? { href: cardHref }
    : { onClick, role: onClick ? 'button' : undefined, tabIndex: onClick ? 0 : undefined };

  return (
    <CardWrapper
      {...(cardProps as any)}
      className={`
        block p-4 bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg shadow-sm
        hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600
        transition-all duration-200
        cursor-pointer
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label={type}>
            {TYPE_ICONS[type] || '📄'}
          </span>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {name}
          </h3>
        </div>
        {badges.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {badges.map((badge, index) => (
              <span
                key={index}
                className={`
                  px-2 py-0.5 text-xs font-medium rounded-full
                  ${BADGE_COLORS[badge.color || 'gray']}
                `}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {attributes.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
          {attributes.map((attr, index) => (
            <span key={index}>
              <span className="font-medium">{attr.label}:</span>{' '}
              {formatAttributeValue(attr.value)}
            </span>
          ))}
        </div>
      )}

      {excerpt && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {excerpt}
        </p>
      )}
    </CardWrapper>
  );
}

function getDefaultHref(type: ContentType, slug: string): string {
  switch (type) {
    case 'spell':
      return `/handbook/spells/${slug}`;
    case 'monster':
      return `/handbook/bestiary/${slug}`;
    case 'item':
      return `/handbook/equipment/${slug}`;
    case 'class':
      return `/handbook/characters/classes/${slug}`;
    case 'race':
      return `/handbook/characters/races/${slug}`;
    case 'rule':
      return `/handbook/rules/${slug}`;
    case 'feat':
      return `/handbook/characters/feats/${slug}`;
    case 'background':
      return `/handbook/characters/backgrounds/${slug}`;
    case 'condition':
      return `/handbook/reference/conditions/${slug}`;
    case 'subclass':
      return `/handbook/characters/subclasses/${slug}`;
    case 'subrace':
      return `/handbook/characters/subraces/${slug}`;
    default:
      return `/handbook/${type}/${slug}`;
  }
}

function formatAttributeValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

// Specialized card variants for common content types

export interface SpellCardProps {
  id: string;
  name: string;
  slug: string;
  level: number;
  school: string;
  castingTime: string;
  concentration: boolean;
  ritual?: boolean;
  className?: string;
}

export function SpellCard({
  id,
  name,
  slug,
  level,
  school,
  castingTime,
  concentration,
  ritual,
  className,
}: SpellCardProps) {
  const badges = [];
  if (concentration) badges.push({ label: 'C', color: 'blue' as const });
  if (ritual) badges.push({ label: 'R', color: 'purple' as const });

  return (
    <ContentCard
      id={id}
      name={name}
      slug={slug}
      type="spell"
      badges={[
        { label: level === 0 ? 'Cantrip' : `Level ${level}`, color: 'blue' },
        { label: school, color: 'purple' },
        ...badges,
      ]}
      attributes={[{ label: 'Cast', value: castingTime }]}
      className={className}
    />
  );
}

export interface MonsterCardProps {
  id: string;
  name: string;
  slug: string;
  challengeRating: string;
  size: string;
  monsterType: string;
  armorClass: number;
  hitPoints: number;
  className?: string;
}

export function MonsterCard({
  id,
  name,
  slug,
  challengeRating,
  size,
  monsterType,
  armorClass,
  hitPoints,
  className,
}: MonsterCardProps) {
  return (
    <ContentCard
      id={id}
      name={name}
      slug={slug}
      type="monster"
      badges={[
        { label: `CR ${challengeRating}`, color: 'red' },
        { label: size, color: 'gray' },
      ]}
      attributes={[
        { label: 'Type', value: monsterType },
        { label: 'AC', value: armorClass },
        { label: 'HP', value: hitPoints },
      ]}
      className={className}
    />
  );
}

export interface ItemCardProps {
  id: string;
  name: string;
  slug: string;
  itemType: string;
  rarity: string | null;
  attunementRequired: boolean;
  className?: string;
}

export function ItemCard({
  id,
  name,
  slug,
  itemType,
  rarity,
  attunementRequired,
  className,
}: ItemCardProps) {
  const badges = [];
  if (rarity) {
    const rarityColors: Record<string, 'gray' | 'green' | 'blue' | 'purple' | 'yellow' | 'red'> = {
      common: 'gray',
      uncommon: 'green',
      rare: 'blue',
      very_rare: 'purple',
      legendary: 'yellow',
      artifact: 'red',
    };
    badges.push({ label: rarity.replace('_', ' '), color: rarityColors[rarity] || 'gray' });
  }
  if (attunementRequired) badges.push({ label: 'Attunement', color: 'purple' as const });

  return (
    <ContentCard
      id={id}
      name={name}
      slug={slug}
      type="item"
      badges={badges}
      attributes={[{ label: 'Type', value: itemType.replace('_', ' ') }]}
      className={className}
    />
  );
}

export default ContentCard;
