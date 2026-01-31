/**
 * Race Detail Component
 * T068: Create RaceDetail component for displaying race information
 */

'use client';

import Link from 'next/link';
import { Race } from '@/types/content.types';
import SourceCitation from './SourceCitation';

interface RaceDetailProps {
  race: Race;
}

export default function RaceDetail({ race }: RaceDetailProps) {
  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{race.name}</h1>
            <p className="mt-1 text-gray-600">
              Size: <span className="font-medium">{race.size}</span>
              {' · '}
              Speed: <span className="font-medium">{race.speed} ft.</span>
            </p>
          </div>
          <SourceCitation source={race.source} />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Description */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
          <p className="text-gray-700">{race.description}</p>
        </section>

        {/* Ability Score Increases */}
        {race.abilityScoreIncrease && race.abilityScoreIncrease.length > 0 && (
          <section className="bg-green-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Ability Score Increase</h3>
            <div className="flex flex-wrap gap-3">
              {race.abilityScoreIncrease.map((increase, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-green-200"
                >
                  {increase.ability} +{increase.bonus}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Core Traits */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {race.ageDescription && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Age</h3>
              <p className="text-gray-700 text-sm">{race.ageDescription}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Languages</h3>
            <p className="text-gray-700 text-sm">
              {race.languages.length > 0 ? race.languages.join(', ') : 'None'}
            </p>
          </div>
        </section>

        {/* Racial Traits */}
        {race.traits && race.traits.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Racial Traits</h2>
            <div className="space-y-4">
              {race.traits.map((trait, index) => (
                <div key={index} className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-gray-900">{trait.name}</h3>
                  <p className="mt-1 text-gray-700 text-sm">{trait.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Subraces */}
        {race.subraces && race.subraces.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subraces</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {race.subraces.map((subrace) => (
                <Link
                  key={subrace.id}
                  href={`/races/${race.slug}/${subrace.slug}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">{subrace.name}</h3>
                  <SourceCitation source={subrace.source} compact className="mt-1" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
