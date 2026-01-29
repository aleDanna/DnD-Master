// RaceDetail Component - T035
// Display full race information with traits and subraces

'use client';

import Link from 'next/link';
import type { Race } from '@/lib/handbook/types';

interface RaceDetailProps {
  race: Race;
}

export function RaceDetail({ race }: RaceDetailProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {race.name}
        </h1>
        {race.description && (
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            {race.description}
          </p>
        )}
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Size" value={race.size} />
        <StatBox label="Speed" value={`${race.speed} ft`} />
        <StatBox
          label="Languages"
          value={formatLanguages(race.languages)}
        />
        <StatBox
          label="Subraces"
          value={race.subraces?.length?.toString() || '0'}
        />
      </div>

      {/* Ability Score Increase */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Ability Score Increase
        </h2>
        <AbilityScoreDisplay abilityScores={race.abilityScoreIncrease} />
      </section>

      {/* Racial Traits */}
      {race.traits && (
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Racial Traits
          </h2>
          <TraitsList traits={race.traits} />
        </section>
      )}

      {/* Subraces */}
      {race.subraces && race.subraces.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Subraces
          </h2>
          <div className="space-y-6">
            {race.subraces.map((subrace) => (
              <SubraceCard key={subrace.id} subrace={subrace} />
            ))}
          </div>
        </section>
      )}

      {/* Back Link */}
      <div className="pt-4">
        <Link
          href="/handbook/characters?type=races"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Races
        </Link>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function formatLanguages(languages: unknown): string {
  if (!languages) return '-';
  if (Array.isArray(languages)) {
    return languages.length.toString();
  }
  if (typeof languages === 'string') {
    try {
      const parsed = JSON.parse(languages);
      if (Array.isArray(parsed)) {
        return parsed.length.toString();
      }
    } catch {
      return languages;
    }
  }
  return String(languages);
}

function AbilityScoreDisplay({ abilityScores }: { abilityScores: unknown }) {
  if (!abilityScores) {
    return <p className="text-gray-500">No ability score increases.</p>;
  }

  const scores = typeof abilityScores === 'string'
    ? JSON.parse(abilityScores)
    : abilityScores;

  if (typeof scores === 'object' && scores !== null) {
    const entries = Object.entries(scores as Record<string, number>);
    return (
      <div className="flex flex-wrap gap-3">
        {entries.map(([ability, bonus]) => (
          <div
            key={ability}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <span className="font-medium text-blue-800 dark:text-blue-200 uppercase">
              {ability}
            </span>
            <span className="ml-2 text-blue-600 dark:text-blue-300">
              +{bonus}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-gray-900 dark:text-white">{String(scores)}</p>;
}

function TraitsList({ traits }: { traits: unknown }) {
  const traitData = typeof traits === 'string'
    ? JSON.parse(traits)
    : traits;

  if (Array.isArray(traitData)) {
    return (
      <div className="space-y-4">
        {traitData.map((trait, index) => (
          <TraitItem key={index} trait={trait} />
        ))}
      </div>
    );
  }

  if (typeof traitData === 'object' && traitData !== null) {
    return (
      <div className="space-y-4">
        {Object.entries(traitData as Record<string, unknown>).map(([name, description]) => (
          <TraitItem key={name} trait={{ name, description }} />
        ))}
      </div>
    );
  }

  return <p className="text-gray-900 dark:text-white">{String(traitData)}</p>;
}

interface Trait {
  name?: string;
  description?: unknown;
}

function TraitItem({ trait }: { trait: Trait | string }) {
  if (typeof trait === 'string') {
    return (
      <div className="text-gray-700 dark:text-gray-300">
        {trait}
      </div>
    );
  }

  return (
    <div>
      {trait.name && (
        <h3 className="font-medium text-gray-900 dark:text-white">
          {trait.name}
        </h3>
      )}
      {trait.description && (
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {String(trait.description)}
        </p>
      )}
    </div>
  );
}

interface Subrace {
  id: string;
  name: string;
  slug: string;
  abilityScoreIncrease: unknown;
  traits: unknown;
}

function SubraceCard({ subrace }: { subrace: Subrace }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {subrace.name}
      </h3>

      {/* Subrace Ability Scores */}
      {subrace.abilityScoreIncrease && (
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Additional Ability Score Increase
          </h4>
          <AbilityScoreDisplay abilityScores={subrace.abilityScoreIncrease} />
        </div>
      )}

      {/* Subrace Traits */}
      {subrace.traits && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Subrace Traits
          </h4>
          <TraitsList traits={subrace.traits} />
        </div>
      )}
    </div>
  );
}
