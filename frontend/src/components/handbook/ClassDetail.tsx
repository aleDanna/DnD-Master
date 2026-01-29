// ClassDetail Component - T034
// Display full class information with features and subclasses

'use client';

import Link from 'next/link';
import type { Class } from '@/lib/handbook/types';

interface ClassDetailProps {
  cls: Class;
}

export function ClassDetail({ cls }: ClassDetailProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {cls.name}
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          {cls.description}
        </p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Hit Die" value={cls.hitDie} />
        <StatBox label="Primary Ability" value={cls.primaryAbility} />
        <StatBox
          label="Saving Throws"
          value={
            Array.isArray(cls.savingThrows)
              ? cls.savingThrows.join(', ')
              : String(cls.savingThrows || '-')
          }
        />
        <StatBox
          label="Subclass Level"
          value={cls.subclasses?.[0]?.subclassLevel?.toString() || '3'}
        />
      </div>

      {/* Proficiencies */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Proficiencies
        </h2>
        <ProficiencyList proficiencies={cls.proficiencies} />
      </section>

      {/* Starting Equipment */}
      {cls.equipment && (
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Starting Equipment
          </h2>
          <EquipmentList equipment={cls.equipment} />
        </section>
      )}

      {/* Class Features by Level */}
      {cls.features && cls.features.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Class Features
          </h2>
          <FeatureTable features={cls.features} />
        </section>
      )}

      {/* Subclasses */}
      {cls.subclasses && cls.subclasses.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Subclasses
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose a subclass at level {cls.subclasses[0]?.subclassLevel || 3}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {cls.subclasses.map((subclass) => (
              <SubclassCard key={subclass.id} subclass={subclass} />
            ))}
          </div>
        </section>
      )}

      {/* Back Link */}
      <div className="pt-4">
        <Link
          href="/handbook/characters?type=classes"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Classes
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

function ProficiencyList({ proficiencies }: { proficiencies: unknown }) {
  if (!proficiencies) {
    return <p className="text-gray-500">No proficiencies listed.</p>;
  }

  const prof = typeof proficiencies === 'string'
    ? JSON.parse(proficiencies)
    : proficiencies;

  if (typeof prof === 'object' && prof !== null) {
    return (
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(prof as Record<string, unknown>).map(([key, value]) => (
          <div key={key}>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
              {key.replace(/_/g, ' ')}
            </dt>
            <dd className="mt-1 text-gray-900 dark:text-white">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <p className="text-gray-900 dark:text-white">{String(prof)}</p>;
}

function EquipmentList({ equipment }: { equipment: unknown }) {
  const equip = typeof equipment === 'string'
    ? JSON.parse(equipment)
    : equipment;

  if (Array.isArray(equip)) {
    return (
      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
        {equip.map((item, index) => (
          <li key={index}>{String(item)}</li>
        ))}
      </ul>
    );
  }

  return <p className="text-gray-900 dark:text-white">{String(equip)}</p>;
}

interface Feature {
  id: string;
  name: string;
  level: number;
  description: string;
}

function FeatureTable({ features }: { features: Feature[] }) {
  // Group features by level
  const featuresByLevel = features.reduce((acc, feature) => {
    const level = feature.level;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(feature);
    return acc;
  }, {} as Record<number, Feature[]>);

  const levels = Object.keys(featuresByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400 w-20">
              Level
            </th>
            <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">
              Features
            </th>
          </tr>
        </thead>
        <tbody>
          {levels.map((level) => (
            <tr
              key={level}
              className="border-b border-gray-100 dark:border-gray-800"
            >
              <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                {level}
              </td>
              <td className="py-3 px-3">
                <div className="space-y-2">
                  {featuresByLevel[level].map((feature) => (
                    <FeatureItem key={feature.id} feature={feature} />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeatureItem({ feature }: { feature: Feature }) {
  return (
    <details className="group">
      <summary className="cursor-pointer text-gray-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400">
        {feature.name}
      </summary>
      <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm pl-4">
        {feature.description}
      </p>
    </details>
  );
}

interface Subclass {
  id: string;
  name: string;
  slug: string;
  subclassLevel: number;
  description: string;
}

function SubclassCard({ subclass }: { subclass: Subclass }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white">
        {subclass.name}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Available at level {subclass.subclassLevel}
      </p>
      {subclass.description && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {subclass.description}
        </p>
      )}
    </div>
  );
}
