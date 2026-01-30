// Monster types for Rules Explorer
// T023: Create Monster types

import { BaseEntity, SourceCitation, toSourceCitation } from './content.types';

/**
 * Ability scores for a creature
 */
export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

/**
 * Speed by movement type
 */
export interface Speed {
  walk?: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
  hover?: boolean;
}

/**
 * Special senses
 */
export interface Senses {
  darkvision?: number;
  blindsight?: number;
  tremorsense?: number;
  truesight?: number;
  passivePerception?: number;
}

/**
 * Monster trait or ability
 */
export interface MonsterTrait {
  name: string;
  description: string;
}

/**
 * Monster action
 */
export interface MonsterAction {
  name: string;
  description: string;
  attackBonus?: number;
  damage?: string;
}

/**
 * Monster summary for lists
 */
export interface MonsterSummary {
  id: string;
  name: string;
  slug: string;
  size: string;
  type: string;
  challengeRating: string;
  source: SourceCitation;
}

/**
 * Full monster entity (stat block)
 */
export interface Monster extends BaseEntity {
  name: string;
  size: string;
  type: string;
  subtype: string | null;
  alignment: string | null;
  armorClass: number;
  armorType: string | null;
  hitPoints: number;
  hitDice: string;
  speed: Speed;
  abilityScores: AbilityScores;
  savingThrows: Record<string, number> | null;
  skills: Record<string, number> | null;
  damageVulnerabilities: string[];
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  senses: Senses | null;
  languages: string[];
  challengeRating: string;
  challengeRatingNumeric: number;
  experiencePoints: number;
  traits: MonsterTrait[] | null;
  actions: MonsterAction[];
  reactions: MonsterTrait[] | null;
  legendaryActions: MonsterTrait[] | null;
  lairActions: MonsterTrait[] | null;
  description: string | null;
}

/**
 * Monster filter options
 */
export interface MonsterFilter {
  type?: string;
  minCr?: number;
  maxCr?: number;
  size?: string;
}

/**
 * Database row type for monsters
 */
export interface MonsterRow {
  id: string;
  name: string;
  slug: string;
  size: string;
  type: string;
  subtype: string | null;
  alignment: string | null;
  armor_class: number;
  armor_type: string | null;
  hit_points: number;
  hit_dice: string;
  speed: Speed;
  ability_scores: AbilityScores;
  saving_throws: Record<string, number> | null;
  skills: Record<string, number> | null;
  damage_vulnerabilities: string[] | null;
  damage_resistances: string[] | null;
  damage_immunities: string[] | null;
  condition_immunities: string[] | null;
  senses: Senses | null;
  languages: string[] | null;
  challenge_rating: string;
  challenge_rating_numeric: number;
  experience_points: number;
  traits: MonsterTrait[] | null;
  actions: MonsterAction[];
  reactions: MonsterTrait[] | null;
  legendary_actions: MonsterTrait[] | null;
  lair_actions: MonsterTrait[] | null;
  description: string | null;
  source_document: string | null;
  source_page: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Map database row to Monster
 */
export function toMonster(row: MonsterRow): Monster {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    size: row.size,
    type: row.type,
    subtype: row.subtype,
    alignment: row.alignment,
    armorClass: row.armor_class,
    armorType: row.armor_type,
    hitPoints: row.hit_points,
    hitDice: row.hit_dice,
    speed: row.speed,
    abilityScores: row.ability_scores,
    savingThrows: row.saving_throws,
    skills: row.skills,
    damageVulnerabilities: row.damage_vulnerabilities || [],
    damageResistances: row.damage_resistances || [],
    damageImmunities: row.damage_immunities || [],
    conditionImmunities: row.condition_immunities || [],
    senses: row.senses,
    languages: row.languages || [],
    challengeRating: row.challenge_rating,
    challengeRatingNumeric: row.challenge_rating_numeric,
    experiencePoints: row.experience_points,
    traits: row.traits,
    actions: row.actions,
    reactions: row.reactions,
    legendaryActions: row.legendary_actions,
    lairActions: row.lair_actions,
    description: row.description,
    source: toSourceCitation(row.source_document, row.source_page),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to MonsterSummary
 */
export function toMonsterSummary(row: MonsterRow): MonsterSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    size: row.size,
    type: row.type,
    challengeRating: row.challenge_rating,
    source: toSourceCitation(row.source_document, row.source_page),
  };
}

/**
 * Get ability modifier from score
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Format ability modifier for display
 */
export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}
