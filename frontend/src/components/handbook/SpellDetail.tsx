// SpellDetail Component - T041
// Full spell display with all attributes

'use client';

import Link from 'next/link';
import type { Spell } from '@/lib/handbook/types';

interface SpellDetailProps {
  spell: Spell;
}

export function SpellDetail({ spell }: SpellDetailProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {spell.name}
            </h1>
            <p className="mt-1 text-lg text-gray-600 dark:text-gray-400 capitalize">
              {spell.level === 0 ? `${spell.school} cantrip` : `${ordinal(spell.level)}-level ${spell.school}`}
            </p>
          </div>
          <div className="flex gap-2">
            {spell.concentration && (
              <Badge color="yellow">Concentration</Badge>
            )}
            {spell.ritual && (
              <Badge color="purple">Ritual</Badge>
            )}
          </div>
        </div>
      </header>

      {/* Spell Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem label="Casting Time" value={spell.castingTime} />
          <StatItem label="Range" value={spell.range} />
          <StatItem label="Duration" value={spell.duration} />
          <StatItem label="Components" value={formatComponents(spell.components)} />
        </dl>

        {/* Material components detail */}
        {spell.components?.includes('M') && spell.material && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Materials:</span> {spell.material}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="prose dark:prose-invert max-w-none">
          {formatDescription(spell.description)}
        </div>
      </section>

      {/* At Higher Levels */}
      {spell.higherLevels && (
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            At Higher Levels
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            {spell.higherLevels}
          </p>
        </section>
      )}

      {/* Spell Lists */}
      {spell.classes && spell.classes.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Spell Lists
          </h2>
          <div className="flex flex-wrap gap-2">
            {spell.classes.map((cls) => (
              <span
                key={cls}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm capitalize"
              >
                {cls}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Back Link */}
      <div className="pt-4">
        <Link
          href="/handbook/spells"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Spells
        </Link>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 text-gray-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: 'yellow' | 'purple' | 'blue' | 'green' }) {
  const colorClasses = {
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

function formatComponents(components: string | undefined): string {
  if (!components) return '-';
  return components;
}

function formatDescription(description: string): React.ReactNode {
  if (!description) return null;

  // Split by paragraphs and render
  const paragraphs = description.split(/\n\n+/);

  return paragraphs.map((para, index) => {
    // Check for bullet points
    if (para.includes('\n- ') || para.startsWith('- ')) {
      const items = para.split('\n').filter(line => line.startsWith('- '));
      return (
        <ul key={index} className="list-disc list-inside my-4 space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-gray-700 dark:text-gray-300">
              {item.replace(/^- /, '')}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={index} className="text-gray-700 dark:text-gray-300 mb-4">
        {para}
      </p>
    );
  });
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
