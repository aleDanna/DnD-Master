// Miscellaneous content types for Rules Explorer
// T025: Create Background, Feat, Condition, Skill types

import { BaseEntity, SourceCitation, toSourceCitation } from './content.types';

// ============================================
// Background Types
// ============================================

/**
 * Suggested characteristics for backgrounds
 */
export interface SuggestedCharacteristics {
  personalityTraits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
}

/**
 * Background summary for lists
 */
export interface BackgroundSummary {
  id: string;
  name: string;
  slug: string;
  skillProficiencies: string[];
  source: SourceCitation;
}

/**
 * Full background entity
 */
export interface Background extends BaseEntity {
  name: string;
  description: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number | null;
  equipment: string;
  featureName: string;
  featureDescription: string;
  suggestedCharacteristics: SuggestedCharacteristics | null;
}

/**
 * Database row type for backgrounds
 */
export interface BackgroundRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  skill_proficiencies: string[];
  tool_proficiencies: string[] | null;
  languages: number | null;
  equipment: string;
  feature_name: string;
  feature_description: string;
  suggested_characteristics: SuggestedCharacteristics | null;
  source_document: string | null;
  source_page: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Map database row to Background
 */
export function toBackground(row: BackgroundRow): Background {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    skillProficiencies: row.skill_proficiencies,
    toolProficiencies: row.tool_proficiencies || [],
    languages: row.languages,
    equipment: row.equipment,
    featureName: row.feature_name,
    featureDescription: row.feature_description,
    suggestedCharacteristics: row.suggested_characteristics,
    source: toSourceCitation(row.source_document, row.source_page),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to BackgroundSummary
 */
export function toBackgroundSummary(row: BackgroundRow): BackgroundSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    skillProficiencies: row.skill_proficiencies,
    source: toSourceCitation(row.source_document, row.source_page),
  };
}

// ============================================
// Feat Types
// ============================================

/**
 * Structured feat benefit
 */
export interface FeatBenefit {
  abilityScoreIncrease?: { ability: string; bonus: number }[];
  proficiencies?: string[];
  other?: string[];
}

/**
 * Feat summary for lists
 */
export interface FeatSummary {
  id: string;
  name: string;
  slug: string;
  prerequisites: string | null;
  source: SourceCitation;
}

/**
 * Full feat entity
 */
export interface Feat extends BaseEntity {
  name: string;
  prerequisites: string | null;
  description: string;
  benefits: FeatBenefit | null;
}

/**
 * Database row type for feats
 */
export interface FeatRow {
  id: string;
  name: string;
  slug: string;
  prerequisites: string | null;
  description: string;
  benefits: FeatBenefit | null;
  source_document: string | null;
  source_page: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Map database row to Feat
 */
export function toFeat(row: FeatRow): Feat {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    prerequisites: row.prerequisites,
    description: row.description,
    benefits: row.benefits,
    source: toSourceCitation(row.source_document, row.source_page),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to FeatSummary
 */
export function toFeatSummary(row: FeatRow): FeatSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    prerequisites: row.prerequisites,
    source: toSourceCitation(row.source_document, row.source_page),
  };
}

// ============================================
// Condition Types
// ============================================

/**
 * Condition summary for lists
 */
export interface ConditionSummary {
  id: string;
  name: string;
  slug: string;
  source: SourceCitation;
}

/**
 * Full condition entity
 */
export interface Condition extends BaseEntity {
  name: string;
  description: string;
}

/**
 * Database row type for conditions
 */
export interface ConditionRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  source_document: string | null;
  source_page: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Map database row to Condition
 */
export function toCondition(row: ConditionRow): Condition {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    source: toSourceCitation(row.source_document, row.source_page),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to ConditionSummary
 */
export function toConditionSummary(row: ConditionRow): ConditionSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    source: toSourceCitation(row.source_document, row.source_page),
  };
}

// ============================================
// Skill Types
// ============================================

/**
 * Ability score names
 */
export type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

/**
 * Skill summary for lists
 */
export interface SkillSummary {
  id: string;
  name: string;
  slug: string;
  ability: string;
  source: SourceCitation;
}

/**
 * Full skill entity
 */
export interface Skill extends BaseEntity {
  name: string;
  ability: string;
  description: string;
}

/**
 * Database row type for skills
 */
export interface SkillRow {
  id: string;
  name: string;
  slug: string;
  ability: string;
  description: string;
  source_document: string | null;
  source_page: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Map database row to Skill
 */
export function toSkill(row: SkillRow): Skill {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ability: row.ability,
    description: row.description,
    source: toSourceCitation(row.source_document, row.source_page),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to SkillSummary
 */
export function toSkillSummary(row: SkillRow): SkillSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ability: row.ability,
    source: toSourceCitation(row.source_document, row.source_page),
  };
}
