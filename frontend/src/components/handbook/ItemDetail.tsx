// ItemDetail Component - T050
// Full item display with properties

'use client';

import Link from 'next/link';
import type { Item } from '@/lib/handbook/types';

interface ItemDetailProps {
  item: Item;
}

export function ItemDetail({ item }: ItemDetailProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {item.name}
            </h1>
            <p className="mt-1 text-lg text-gray-600 dark:text-gray-400 capitalize">
              {formatItemType(item.itemType)}
              {item.rarity && ` (${item.rarity})`}
            </p>
          </div>
          <div className="flex gap-2">
            {item.rarity && (
              <RarityBadge rarity={item.rarity} />
            )}
            {item.attunementRequired && (
              <Badge color="purple">Requires Attunement</Badge>
            )}
          </div>
        </div>
      </header>

      {/* Item Stats */}
      {(item.damage || item.armorClass || item.weaponProperties) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {item.damage && (
              <StatItem label="Damage" value={item.damage} />
            )}
            {item.damageType && (
              <StatItem label="Damage Type" value={item.damageType} />
            )}
            {item.armorClass && (
              <StatItem label="Armor Class" value={formatArmorClass(item)} />
            )}
            {item.weight && (
              <StatItem label="Weight" value={`${item.weight} lb.`} />
            )}
            {item.cost && (
              <StatItem label="Cost" value={item.cost} />
            )}
          </dl>

          {/* Weapon Properties */}
          {item.weaponProperties && item.weaponProperties.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Properties
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.weaponProperties.map((prop, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm capitalize"
                  >
                    {prop}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Description
        </h2>
        <div className="prose dark:prose-invert max-w-none">
          {formatDescription(item.description)}
        </div>
      </section>

      {/* Attunement Details */}
      {item.attunementRequired && item.attunementRequirements && (
        <section className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            Attunement Requirements
          </h2>
          <p className="text-yellow-800 dark:text-yellow-300">
            {item.attunementRequirements}
          </p>
        </section>
      )}

      {/* Back Link */}
      <div className="pt-4">
        <Link
          href="/handbook/equipment"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Equipment
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

function Badge({ children, color }: { children: React.ReactNode; color: 'purple' | 'blue' | 'green' }) {
  const colorClasses = {
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

function RarityBadge({ rarity }: { rarity: string }) {
  const colorByRarity: Record<string, string> = {
    common: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600',
    uncommon: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
    rare: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    very_rare: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    legendary: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700',
    artifact: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
  };

  const classes = colorByRarity[rarity] || colorByRarity.common;

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${classes}`}>
      {rarity.replace('_', ' ')}
    </span>
  );
}

function formatItemType(type: string): string {
  return type.replace(/_/g, ' ');
}

function formatArmorClass(item: Item): string {
  let ac = String(item.armorClass);
  if (item.armorType) {
    ac += ` (${item.armorType})`;
  }
  return ac;
}

function formatDescription(description: string): React.ReactNode {
  if (!description) return null;

  const paragraphs = description.split(/\n\n+/);

  return paragraphs.map((para, index) => {
    // Check for bullet points
    if (para.includes('\n- ') || para.startsWith('- ')) {
      const lines = para.split('\n');
      const items = lines.filter(line => line.startsWith('- '));
      const intro = lines.find(line => !line.startsWith('- '));

      return (
        <div key={index}>
          {intro && <p className="text-gray-700 dark:text-gray-300 mb-2">{intro}</p>}
          <ul className="list-disc list-inside my-4 space-y-1">
            {items.map((item, i) => (
              <li key={i} className="text-gray-700 dark:text-gray-300">
                {item.replace(/^- /, '')}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <p key={index} className="text-gray-700 dark:text-gray-300 mb-4">
        {para}
      </p>
    );
  });
}
