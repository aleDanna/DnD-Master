// Item types for Rules Explorer
// T024: Create Item types

import { BaseEntity, SourceCitation, toSourceCitation } from './content.types';

/**
 * Item cost in currency
 */
export interface ItemCost {
  amount: number;
  currency: 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
}

/**
 * Weapon damage
 */
export interface WeaponDamage {
  dice: string;
  type: string;
}

/**
 * Armor class bonus
 */
export interface ArmorClassBonus {
  base: number;
  dexBonus?: boolean;
  maxDexBonus?: number;
  stealthDisadvantage?: boolean;
  strengthRequirement?: number;
}

/**
 * Item type categories
 */
export type ItemType = 'weapon' | 'armor' | 'gear' | 'magic' | 'tool' | 'mount' | 'vehicle';

/**
 * Item rarity levels
 */
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary' | 'artifact';

/**
 * Item summary for lists
 */
export interface ItemSummary {
  id: string;
  name: string;
  slug: string;
  type: string;
  rarity: string | null;
  cost: ItemCost | null;
  source: SourceCitation;
}

/**
 * Full item entity
 */
export interface Item extends BaseEntity {
  name: string;
  type: string;
  subtype: string | null;
  rarity: string | null;
  cost: ItemCost | null;
  weight: number | null;
  properties: string[];
  damage: WeaponDamage | null;
  armorClass: ArmorClassBonus | null;
  description: string;
  requiresAttunement: boolean | null;
}

/**
 * Item filter options
 */
export interface ItemFilter {
  type?: string;
  subtype?: string;
  rarity?: string;
  minCost?: number;
  maxCost?: number;
}

/**
 * Database row type for items
 */
export interface ItemRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  subtype: string | null;
  rarity: string | null;
  cost: ItemCost | null;
  weight: number | null;
  properties: string[] | null;
  damage: WeaponDamage | null;
  armor_class: ArmorClassBonus | null;
  description: string;
  requires_attunement: boolean | null;
  source_document: string | null;
  source_page: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Map database row to Item
 */
export function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type,
    subtype: row.subtype,
    rarity: row.rarity,
    cost: row.cost,
    weight: row.weight,
    properties: row.properties || [],
    damage: row.damage,
    armorClass: row.armor_class,
    description: row.description,
    requiresAttunement: row.requires_attunement,
    source: toSourceCitation(row.source_document, row.source_page),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to ItemSummary
 */
export function toItemSummary(row: ItemRow): ItemSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type,
    rarity: row.rarity,
    cost: row.cost,
    source: toSourceCitation(row.source_document, row.source_page),
  };
}

/**
 * Format item cost for display
 */
export function formatCost(cost: ItemCost | null): string {
  if (!cost) return '-';
  return `${cost.amount} ${cost.currency}`;
}

/**
 * Format weight for display
 */
export function formatWeight(weight: number | null): string {
  if (weight === null) return '-';
  return `${weight} lb${weight !== 1 ? 's' : ''}`;
}
