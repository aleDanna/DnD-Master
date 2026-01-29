// MonsterStatBlock Component - T046
// D&D-style stat block layout for monsters

'use client';

import Link from 'next/link';
import type { Monster } from '@/lib/handbook/types';

interface MonsterStatBlockProps {
  monster: Monster;
}

export function MonsterStatBlock({ monster }: MonsterStatBlockProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Stat Block Container */}
      <div className="bg-amber-50 dark:bg-gray-800 border-t-4 border-b-4 border-red-800 dark:border-red-700 p-6 font-serif">
        {/* Header */}
        <header className="border-b-2 border-red-800 dark:border-red-700 pb-4 mb-4">
          <h1 className="text-3xl font-bold text-red-900 dark:text-red-400">
            {monster.name}
          </h1>
          <p className="text-sm italic text-gray-700 dark:text-gray-400">
            {monster.size} {monster.monsterType}
            {monster.alignment && `, ${monster.alignment}`}
          </p>
        </header>

        {/* Basic Stats */}
        <section className="border-b border-red-800/30 dark:border-red-700/30 pb-4 mb-4">
          <StatLine label="Armor Class" value={formatArmorClass(monster)} />
          <StatLine label="Hit Points" value={formatHitPoints(monster)} />
          <StatLine label="Speed" value={formatSpeed(monster.speed)} />
        </section>

        {/* Ability Scores */}
        <section className="border-b border-red-800/30 dark:border-red-700/30 pb-4 mb-4">
          <AbilityScoreGrid abilities={monster.abilities} />
        </section>

        {/* Secondary Stats */}
        <section className="border-b border-red-800/30 dark:border-red-700/30 pb-4 mb-4 text-sm">
          {monster.savingThrows && (
            <StatLine label="Saving Throws" value={formatSavingThrows(monster.savingThrows)} />
          )}
          {monster.skills && Object.keys(monster.skills).length > 0 && (
            <StatLine label="Skills" value={formatSkills(monster.skills)} />
          )}
          {monster.damageResistances && (
            <StatLine label="Damage Resistances" value={monster.damageResistances} />
          )}
          {monster.damageImmunities && (
            <StatLine label="Damage Immunities" value={monster.damageImmunities} />
          )}
          {monster.conditionImmunities && (
            <StatLine label="Condition Immunities" value={monster.conditionImmunities} />
          )}
          {monster.senses && (
            <StatLine label="Senses" value={monster.senses} />
          )}
          {monster.languages && (
            <StatLine label="Languages" value={monster.languages || '—'} />
          )}
          <StatLine
            label="Challenge"
            value={`${monster.challengeRating} (${formatXP(monster.challengeRating)} XP)`}
          />
        </section>

        {/* Traits */}
        {monster.traits && monster.traits.length > 0 && (
          <TraitsSection title="Traits" items={monster.traits} />
        )}

        {/* Actions */}
        {monster.actions && monster.actions.length > 0 && (
          <TraitsSection title="Actions" items={monster.actions} isAction />
        )}

        {/* Bonus Actions */}
        {monster.bonusActions && monster.bonusActions.length > 0 && (
          <TraitsSection title="Bonus Actions" items={monster.bonusActions} />
        )}

        {/* Reactions */}
        {monster.reactions && monster.reactions.length > 0 && (
          <TraitsSection title="Reactions" items={monster.reactions} />
        )}

        {/* Legendary Actions */}
        {monster.legendaryActions && monster.legendaryActions.length > 0 && (
          <LegendaryActionsSection
            monster={monster}
            actions={monster.legendaryActions}
          />
        )}

        {/* Lair Actions */}
        {monster.lairActions && monster.lairActions.length > 0 && (
          <TraitsSection title="Lair Actions" items={monster.lairActions} />
        )}
      </div>

      {/* Back Link */}
      <div className="mt-6">
        <Link
          href="/handbook/bestiary"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Bestiary
        </Link>
      </div>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-gray-800 dark:text-gray-200">
      <span className="font-bold text-red-900 dark:text-red-400">{label}</span>{' '}
      {value}
    </p>
  );
}

interface AbilityScores {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
}

function AbilityScoreGrid({ abilities }: { abilities: AbilityScores | undefined }) {
  const scores = abilities || {};
  const stats = [
    { key: 'str', label: 'STR' },
    { key: 'dex', label: 'DEX' },
    { key: 'con', label: 'CON' },
    { key: 'int', label: 'INT' },
    { key: 'wis', label: 'WIS' },
    { key: 'cha', label: 'CHA' },
  ];

  return (
    <div className="grid grid-cols-6 gap-2 text-center">
      {stats.map(({ key, label }) => {
        const score = scores[key as keyof AbilityScores] || 10;
        const modifier = Math.floor((score - 10) / 2);
        const modStr = modifier >= 0 ? `+${modifier}` : String(modifier);

        return (
          <div key={key}>
            <div className="font-bold text-red-900 dark:text-red-400 text-sm">
              {label}
            </div>
            <div className="text-gray-800 dark:text-gray-200">
              {score} ({modStr})
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface TraitItem {
  name?: string;
  description?: string;
}

function TraitsSection({
  title,
  items,
  isAction = false,
}: {
  title: string;
  items: TraitItem[];
  isAction?: boolean;
}) {
  return (
    <section className="mt-4">
      <h2 className="text-lg font-bold text-red-900 dark:text-red-400 border-b border-red-800/30 dark:border-red-700/30 pb-1 mb-2">
        {title}
      </h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <TraitBlock key={index} item={item} isAction={isAction} />
        ))}
      </div>
    </section>
  );
}

function TraitBlock({ item, isAction }: { item: TraitItem; isAction?: boolean }) {
  if (typeof item === 'string') {
    return <p className="text-gray-800 dark:text-gray-200">{item}</p>;
  }

  return (
    <div>
      {item.name && (
        <p className="text-gray-800 dark:text-gray-200">
          <span className="font-bold italic">{item.name}.</span>{' '}
          {item.description}
        </p>
      )}
      {!item.name && item.description && (
        <p className="text-gray-800 dark:text-gray-200">{item.description}</p>
      )}
    </div>
  );
}

function LegendaryActionsSection({
  monster,
  actions,
}: {
  monster: Monster;
  actions: TraitItem[];
}) {
  return (
    <section className="mt-4">
      <h2 className="text-lg font-bold text-red-900 dark:text-red-400 border-b border-red-800/30 dark:border-red-700/30 pb-1 mb-2">
        Legendary Actions
      </h2>
      <p className="text-gray-800 dark:text-gray-200 mb-3 text-sm italic">
        {monster.name} can take 3 legendary actions, choosing from the options below.
        Only one legendary action option can be used at a time and only at the end of
        another creature&apos;s turn. {monster.name} regains spent legendary actions at
        the start of its turn.
      </p>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <TraitBlock key={index} item={action} />
        ))}
      </div>
    </section>
  );
}

// Formatting helpers
function formatArmorClass(monster: Monster): string {
  let ac = String(monster.armorClass);
  if (monster.armorType) {
    ac += ` (${monster.armorType})`;
  }
  return ac;
}

function formatHitPoints(monster: Monster): string {
  let hp = String(monster.hitPoints);
  if (monster.hitDice) {
    hp += ` (${monster.hitDice})`;
  }
  return hp;
}

function formatSpeed(speed: unknown): string {
  if (typeof speed === 'string') return speed;
  if (typeof speed === 'number') return `${speed} ft.`;
  if (typeof speed === 'object' && speed !== null) {
    const parts: string[] = [];
    const s = speed as Record<string, number>;
    if (s.walk) parts.push(`${s.walk} ft.`);
    if (s.fly) parts.push(`fly ${s.fly} ft.`);
    if (s.swim) parts.push(`swim ${s.swim} ft.`);
    if (s.climb) parts.push(`climb ${s.climb} ft.`);
    if (s.burrow) parts.push(`burrow ${s.burrow} ft.`);
    return parts.join(', ') || '30 ft.';
  }
  return '30 ft.';
}

function formatSavingThrows(saves: Record<string, number> | string): string {
  if (typeof saves === 'string') return saves;
  return Object.entries(saves)
    .map(([stat, bonus]) => `${stat.toUpperCase()} +${bonus}`)
    .join(', ');
}

function formatSkills(skills: Record<string, number> | string): string {
  if (typeof skills === 'string') return skills;
  return Object.entries(skills)
    .map(([skill, bonus]) => `${skill} +${bonus}`)
    .join(', ');
}

function formatXP(cr: string): string {
  const xpByCR: Record<string, string> = {
    '0': '0 or 10',
    '1/8': '25',
    '1/4': '50',
    '1/2': '100',
    '1': '200',
    '2': '450',
    '3': '700',
    '4': '1,100',
    '5': '1,800',
    '6': '2,300',
    '7': '2,900',
    '8': '3,900',
    '9': '5,000',
    '10': '5,900',
    '11': '7,200',
    '12': '8,400',
    '13': '10,000',
    '14': '11,500',
    '15': '13,000',
    '16': '15,000',
    '17': '18,000',
    '18': '20,000',
    '19': '22,000',
    '20': '25,000',
    '21': '33,000',
    '22': '41,000',
    '23': '50,000',
    '24': '62,000',
    '25': '75,000',
    '26': '90,000',
    '27': '105,000',
    '28': '120,000',
    '29': '135,000',
    '30': '155,000',
  };
  return xpByCR[cr] || '???';
}
