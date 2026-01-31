// Spell types for Rules Explorer
// T022: Create Spell types

import { BaseEntity, SourceCitation, toSourceCitation } from './content.types';

/**
 * Spell component requirements
 */
export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  materialDescription?: string;
}

/**
 * Magic school names
 */
export type MagicSchool =
  | 'Abjuration'
  | 'Conjuration'
  | 'Divination'
  | 'Enchantment'
  | 'Evocation'
  | 'Illusion'
  | 'Necromancy'
  | 'Transmutation';

/**
 * Spell summary for lists
 */
export interface SpellSummary {
  id: string;
  name: string;
  slug: string;
  level: number;
  school: string;
  concentration: boolean;
  ritual: boolean;
  source: SourceCitation;
}

/**
 * Full spell entity
 */
export interface Spell extends BaseEntity {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: SpellComponents;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevels: string | null;
  classes?: string[];
}

/**
 * Spell filter options
 */
export interface SpellFilter {
  level?: number;
  school?: string;
  classSlug?: string;
  concentration?: boolean;
  ritual?: boolean;
}

/**
 * Database row type for spells
 */
export interface SpellRow {
  id: string;
  name: string;
  slug: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: SpellComponents;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higher_levels: string | null;
  source_document: string | null;
  source_page: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Map database row to Spell
 */
export function toSpell(row: SpellRow): Spell {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    level: row.level,
    school: row.school,
    castingTime: row.casting_time,
    range: row.range,
    components: row.components,
    duration: row.duration,
    concentration: row.concentration,
    ritual: row.ritual,
    description: row.description,
    higherLevels: row.higher_levels,
    source: toSourceCitation(row.source_document, row.source_page),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to SpellSummary
 */
export function toSpellSummary(row: SpellRow): SpellSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    level: row.level,
    school: row.school,
    concentration: row.concentration,
    ritual: row.ritual,
    source: toSourceCitation(row.source_document, row.source_page),
  };
}

/**
 * Get spell level display text
 */
export function getSpellLevelText(level: number): string {
  if (level === 0) return 'Cantrip';
  return `${level}${getOrdinalSuffix(level)} Level`;
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
