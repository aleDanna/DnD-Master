/**
 * Rule Category Service
 * T034: Implement RuleCategoryService
 *
 * Handles rule category and rule content retrieval
 */

import { query } from '../../config/database.js';
import {
  RuleCategory,
  RuleCategoryRow,
  Rule,
  RuleRow,
  RuleSummary,
  toRuleCategory,
  toRule,
  toRuleSummary,
} from '../../types/rules.types.js';
import { ListResponse, ListFilter } from '../../types/content.types.js';

/**
 * Get all top-level rule categories
 */
export async function getRootCategories(): Promise<RuleCategory[]> {
  const result = await query<RuleCategoryRow>(`
    SELECT id, name, slug, parent_id, sort_order, description, created_at, updated_at
    FROM rule_categories
    WHERE parent_id IS NULL
    ORDER BY sort_order, name
  `);

  return result.rows.map(toRuleCategory);
}

/**
 * Get a category by slug with its children and rules
 */
export async function getCategoryBySlug(slug: string): Promise<RuleCategory | null> {
  const result = await query<RuleCategoryRow>(`
    SELECT id, name, slug, parent_id, sort_order, description, created_at, updated_at
    FROM rule_categories
    WHERE slug = $1
  `, [slug]);

  if (result.rows.length === 0) {
    return null;
  }

  const category = toRuleCategory(result.rows[0]);

  // Get children categories
  const childrenResult = await query<RuleCategoryRow>(`
    SELECT id, name, slug, parent_id, sort_order, description, created_at, updated_at
    FROM rule_categories
    WHERE parent_id = $1
    ORDER BY sort_order, name
  `, [category.id]);

  category.children = childrenResult.rows.map(toRuleCategory);

  // Get rules in this category
  const rulesResult = await query<RuleRow>(`
    SELECT id, title, slug, category_id, summary, content, keywords,
           source_document, source_page, created_at, updated_at
    FROM rules
    WHERE category_id = $1
    ORDER BY title
  `, [category.id]);

  category.rules = rulesResult.rows.map(toRuleSummary);

  return category;
}

/**
 * Get a category by ID
 */
export async function getCategoryById(id: string): Promise<RuleCategory | null> {
  const result = await query<RuleCategoryRow>(`
    SELECT id, name, slug, parent_id, sort_order, description, created_at, updated_at
    FROM rule_categories
    WHERE id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return toRuleCategory(result.rows[0]);
}

/**
 * Get full category path (for breadcrumbs)
 */
export async function getCategoryPath(slug: string): Promise<RuleCategory[]> {
  const path: RuleCategory[] = [];

  let currentSlug: string | null = slug;
  while (currentSlug) {
    const result = await query<RuleCategoryRow>(`
      SELECT rc.id, rc.name, rc.slug, rc.parent_id, rc.sort_order, rc.description,
             rc.created_at, rc.updated_at, parent.slug as parent_slug
      FROM rule_categories rc
      LEFT JOIN rule_categories parent ON rc.parent_id = parent.id
      WHERE rc.slug = $1
    `, [currentSlug]);

    if (result.rows.length === 0) break;

    const row = result.rows[0] as RuleCategoryRow & { parent_slug: string | null };
    path.unshift(toRuleCategory(row));
    currentSlug = row.parent_slug;
  }

  return path;
}

export default {
  getRootCategories,
  getCategoryBySlug,
  getCategoryById,
  getCategoryPath,
};
