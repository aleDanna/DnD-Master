// Race and Subrace types for Rules Explorer
// T021: Create Race and Subrace types

import { BaseEntity, SourceCitation, toSourceCitation } from './content.types';

/**
 * Ability score increase modifier
 */
export interface AbilityScoreIncrease {
  ability: string;
  bonus: number;
}

/**
 * Racial trait
 */
export interface RacialTrait {
  name: string;
  description: string;
}

/**
 * Race summary for lists
 */
export interface RaceSummary {
  id: string;
  name: string;
  slug: string;
  size: string;
  speed: number;
  source: SourceCitation;
}

/**
 * Full race entity
 */
export interface Race extends BaseEntity {
  name: string;
  description: string;
  abilityScoreIncrease: AbilityScoreIncrease[];
  ageDescription: string | null;
  size: string;
  speed: number;
  languages: string[];
  traits: RacialTrait[];
  subraces?: SubraceSummary[];
}

/**
 * Subrace summary for lists
 */
export interface SubraceSummary {
  id: string;
  name: string;
  slug: string;
  raceId: string;
  source: SourceCitation;
}

/**
 * Full subrace entity
 */
export interface Subrace extends BaseEntity {
  name: string;
  raceId: string;
  description: string | null;
  abilityScoreIncrease: AbilityScoreIncrease[] | null;
  traits: RacialTrait[] | null;
}

/**
 * Database row type for races
 */
export interface RaceRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  ability_score_increase: AbilityScoreIncrease[];
  age_description: string | null;
  size: string;
  speed: number;
  languages: string[];
  traits: RacialTrait[];
  source_document: string | null;
  source_page: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Database row type for subraces
 */
export interface SubraceRow {
  id: string;
  name: string;
  slug: string;
  race_id: string;
  description: string | null;
  ability_score_increase: AbilityScoreIncrease[] | null;
  traits: RacialTrait[] | null;
  source_document: string | null;
  source_page: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Map database row to Race
 */
export function toRace(row: RaceRow): Race {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    abilityScoreIncrease: row.ability_score_increase,
    ageDescription: row.age_description,
    size: row.size,
    speed: row.speed,
    languages: row.languages,
    traits: row.traits,
    source: toSourceCitation(row.source_document, row.source_page),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to RaceSummary
 */
export function toRaceSummary(row: RaceRow): RaceSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    size: row.size,
    speed: row.speed,
    source: toSourceCitation(row.source_document, row.source_page),
  };
}

/**
 * Map database row to Subrace
 */
export function toSubrace(row: SubraceRow): Subrace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    raceId: row.race_id,
    description: row.description,
    abilityScoreIncrease: row.ability_score_increase,
    traits: row.traits,
    source: toSourceCitation(row.source_document, row.source_page),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to SubraceSummary
 */
export function toSubraceSummary(row: SubraceRow): SubraceSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    raceId: row.race_id,
    source: toSourceCitation(row.source_document, row.source_page),
  };
}
