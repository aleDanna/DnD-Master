// Rule and RuleCategory types for Rules Explorer
// T019: Create RuleCategory and Rule types

import { BaseEntity, SourceCitation, toSourceCitation } from './content.types';

/**
 * Rule category for hierarchical organization
 */
export interface RuleCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  children?: RuleCategory[];
  rules?: RuleSummary[];
}

/**
 * Rule summary for lists and navigation
 */
export interface RuleSummary {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  summary: string | null;
  source: SourceCitation;
}

/**
 * Full rule entity with all content
 */
export interface Rule extends BaseEntity {
  title: string;
  categoryId: string;
  summary: string | null;
  content: string;
  keywords: string[];
}

/**
 * Database row type for rules
 */
export interface RuleRow {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  summary: string | null;
  content: string;
  keywords: string[] | null;
  source_document: string | null;
  source_page: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Database row type for rule_categories
 */
export interface RuleCategoryRow {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Map database row to RuleCategory
 */
export function toRuleCategory(row: RuleCategoryRow): RuleCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to Rule
 */
export function toRule(row: RuleRow): Rule {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    categoryId: row.category_id,
    summary: row.summary,
    content: row.content,
    keywords: row.keywords || [],
    source: toSourceCitation(row.source_document, row.source_page),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to RuleSummary
 */
export function toRuleSummary(row: RuleRow): RuleSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    categoryId: row.category_id,
    summary: row.summary,
    source: toSourceCitation(row.source_document, row.source_page),
  };
}
