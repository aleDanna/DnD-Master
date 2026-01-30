/**
 * Item Card Component
 * T071: Create ItemCard component for displaying item information
 */

'use client';

import Link from 'next/link';
import { Item, ItemSummary, formatCost, formatWeight } from '@/types/content.types';
import SourceCitation from './SourceCitation';

interface ItemCardProps {
  item: Item | ItemSummary;
  showFullContent?: boolean;
}

function getRarityColor(rarity: string | null): string {
  const colors: Record<string, string> = {
    common: 'bg-gray-100 text-gray-800',
    uncommon: 'bg-green-100 text-green-800',
    rare: 'bg-blue-100 text-blue-800',
    'very rare': 'bg-purple-100 text-purple-800',
    legendary: 'bg-orange-100 text-orange-800',
    artifact: 'bg-red-100 text-red-800',
  };
  return colors[rarity?.toLowerCase() || ''] || 'bg-gray-100 text-gray-800';
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    weapon: '⚔️',
    armor: '🛡️',
    potion: '🧪',
    scroll: '📜',
    wand: '🪄',
    ring: '💍',
    wondrous: '✨',
    tool: '🔧',
    adventuring: '🎒',
  };
  return icons[type.toLowerCase()] || '📦';
}

export default function ItemCard({ item, showFullContent = false }: ItemCardProps) {
  const isFullItem = 'description' in item;

  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getTypeIcon(item.type)}</span>
            <h3 className="text-lg font-semibold text-gray-900">
              {showFullContent ? (
                item.name
              ) : (
                <Link
                  href={`/items/${item.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </h3>
          </div>
          <SourceCitation source={item.source} compact />
        </div>

        {/* Type and Rarity */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-sm text-gray-600 capitalize">{item.type}</span>
          {item.rarity && (
            <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${getRarityColor(item.rarity)}`}>
              {item.rarity}
            </span>
          )}
        </div>

        {/* Cost */}
        {item.cost && (
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Cost:</span> {formatCost(item.cost)}
          </p>
        )}

        {/* Full Details */}
        {showFullContent && isFullItem && (
          <div className="space-y-4 mt-4">
            {/* Weight and Subtype */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {item.weight !== null && (
                <div>
                  <span className="font-medium text-gray-900">Weight:</span>
                  <span className="ml-2 text-gray-700">{formatWeight(item.weight)}</span>
                </div>
              )}
              {item.subtype && (
                <div>
                  <span className="font-medium text-gray-900">Subtype:</span>
                  <span className="ml-2 text-gray-700 capitalize">{item.subtype}</span>
                </div>
              )}
            </div>

            {/* Weapon Damage */}
            {item.damage && (
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-1">Damage</h4>
                <p className="text-gray-700">
                  {item.damage.dice} {item.damage.type}
                </p>
              </div>
            )}

            {/* Armor Class */}
            {item.armorClass && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-1">Armor Class</h4>
                <p className="text-gray-700">
                  {item.armorClass.base}
                  {item.armorClass.dexBonus && (
                    <>
                      {' '}+ Dex modifier
                      {item.armorClass.maxDexBonus !== undefined && (
                        <span> (max {item.armorClass.maxDexBonus})</span>
                      )}
                    </>
                  )}
                </p>
                {item.armorClass.stealthDisadvantage && (
                  <p className="text-sm text-orange-600 mt-1">Disadvantage on Stealth checks</p>
                )}
                {item.armorClass.strengthRequirement && (
                  <p className="text-sm text-gray-600 mt-1">
                    Requires Strength {item.armorClass.strengthRequirement}
                  </p>
                )}
              </div>
            )}

            {/* Properties */}
            {item.properties && item.properties.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Properties</h4>
                <div className="flex flex-wrap gap-2">
                  {item.properties.map((prop) => (
                    <span
                      key={prop}
                      className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                    >
                      {prop}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attunement */}
            {item.requiresAttunement && (
              <p className="text-sm text-purple-600 font-medium">
                Requires Attunement
              </p>
            )}

            {/* Description */}
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>{item.description}</p>
            </div>
          </div>
        )}

        {/* Read More Link */}
        {!showFullContent && (
          <div className="mt-4">
            <Link
              href={`/items/${item.slug}`}
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
