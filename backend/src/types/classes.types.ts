// Class and Subclass types for Rules Explorer
// T020: Create Class and Subclass types

import { BaseEntity, SourceCitation, toSourceCitation } from './content.types';

/**
 * Class feature by level
 */
export interface ClassFeature {
  level: number;
  name: string;
  description: string;
}

/**
 * Skill choice options for class creation
 */
export interface SkillChoices {
  count: number;
  options: string[];
}

/**
 * Class summary for lists
 */
export interface ClassSummary {
  id: string;
  name: string;
  slug: string;
  hitDie: string;
  primaryAbility: string;
  source: SourceCitation;
}

/**
 * Full class entity
 */
export interface Class extends BaseEntity {
  name: string;
  description: string;
  hitDie: string;
  primaryAbility: string;
  savingThrows: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  skillChoices: SkillChoices | null;
  features: ClassFeature[];
  subclasses?: SubclassSummary[];
}

/**
 * Subclass summary for lists
 */
export interface SubclassSummary {
  id: string;
  name: string;
  slug: string;
  classId: string;
  source: SourceCitation;
}

/**
 * Full subclass entity
 */
export interface Subclass extends BaseEntity {
  name: string;
  classId: string;
  description: string;
  features: ClassFeature[];
}

/**
 * Database row type for classes
 */
export interface ClassRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  hit_die: string;
  primary_ability: string;
  saving_throws: string[] | null;
  armor_proficiencies: string[] | null;
  weapon_proficiencies: string[] | null;
  tool_proficiencies: string[] | null;
  skill_choices: string[] | null;
  skill_count: number | null;
  features?: ClassFeature[];
  source_document: string | null;
  source_page: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Database row type for subclasses
 */
export interface SubclassRow {
  id: string;
  name: string;
  slug: string;
  class_id: string;
  description: string;
  features?: ClassFeature[];
  source_document: string | null;
  source_page: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Map database row to Class
 */
export function toClass(row: ClassRow): Class {
  // Convert skill_choices TEXT[] + skill_count to SkillChoices object
  const skillChoices: SkillChoices | null = row.skill_choices
    ? { count: row.skill_count || 2, options: row.skill_choices }
    : null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    hitDie: row.hit_die,
    primaryAbility: row.primary_ability,
    savingThrows: row.saving_throws || [],
    armorProficiencies: row.armor_proficiencies || [],
    weaponProficiencies: row.weapon_proficiencies || [],
    toolProficiencies: row.tool_proficiencies || [],
    skillChoices,
    features: row.features || [],
    source: toSourceCitation(row.source_document, row.source_page),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to ClassSummary
 */
export function toClassSummary(row: ClassRow): ClassSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    hitDie: row.hit_die,
    primaryAbility: row.primary_ability,
    source: toSourceCitation(row.source_document, row.source_page),
  };
}

/**
 * Map database row to Subclass
 */
export function toSubclass(row: SubclassRow): Subclass {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    classId: row.class_id,
    description: row.description,
    features: row.features || [],
    source: toSourceCitation(row.source_document, row.source_page),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to SubclassSummary
 */
export function toSubclassSummary(row: SubclassRow): SubclassSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    classId: row.class_id,
    source: toSourceCitation(row.source_document, row.source_page),
  };
}
