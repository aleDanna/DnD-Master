/**
 * Rule Service
 * T035: Implement RuleService
 *
 * Handles individual rule content retrieval
 */

import { query } from '../../config/database.js';
import {
  Rule,
  RuleRow,
  RuleSummary,
  toRule,
  toRuleSummary,
} from '../../types/rules.types.js';
import { ListResponse, ListFilter } from '../../types/content.types.js';

/**
 * Get all rules with optional filtering
 */
export async function getRules(filter: ListFilter = {}): Promise<ListResponse<RuleSummary>> {
  const { page = 1, pageSize = 20, sortBy = 'title', sortOrder = 'asc' } = filter;
  const offset = (page - 1) * pageSize;

  // Validate sort column to prevent SQL injection
  const allowedSortColumns = ['title', 'created_at', 'updated_at'];
  const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'title';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const countResult = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM rules
  `);

  const result = await query<RuleRow>(`
    SELECT id, title, slug, category_id, summary, content, keywords,
           source_document, source_page, created_at, updated_at
    FROM rules
    ORDER BY ${sortColumn} ${order}
    LIMIT $1 OFFSET $2
  `, [pageSize, offset]);

  return {
    items: result.rows.map(toRuleSummary),
    total: parseInt(countResult.rows[0]?.count || '0', 10),
    page,
    pageSize,
  };
}

/**
 * Get rules by category ID
 */
export async function getRulesByCategory(
  categoryId: string,
  filter: ListFilter = {}
): Promise<ListResponse<RuleSummary>> {
  const { page = 1, pageSize = 20, sortBy = 'title', sortOrder = 'asc' } = filter;
  const offset = (page - 1) * pageSize;

  const allowedSortColumns = ['title', 'created_at', 'updated_at'];
  const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'title';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const countResult = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM rules WHERE category_id = $1
  `, [categoryId]);

  const result = await query<RuleRow>(`
    SELECT id, title, slug, category_id, summary, content, keywords,
           source_document, source_page, created_at, updated_at
    FROM rules
    WHERE category_id = $1
    ORDER BY ${sortColumn} ${order}
    LIMIT $2 OFFSET $3
  `, [categoryId, pageSize, offset]);

  return {
    items: result.rows.map(toRuleSummary),
    total: parseInt(countResult.rows[0]?.count || '0', 10),
    page,
    pageSize,
  };
}

/**
 * Get a single rule by slug
 */
export async function getRuleBySlug(slug: string): Promise<Rule | null> {
  const result = await query<RuleRow>(`
    SELECT id, title, slug, category_id, summary, content, keywords,
           source_document, source_page, created_at, updated_at
    FROM rules
    WHERE slug = $1
  `, [slug]);

  if (result.rows.length === 0) {
    return null;
  }

  return toRule(result.rows[0]);
}

/**
 * Get a single rule by ID
 */
export async function getRuleById(id: string): Promise<Rule | null> {
  const result = await query<RuleRow>(`
    SELECT id, title, slug, category_id, summary, content, keywords,
           source_document, source_page, created_at, updated_at
    FROM rules
    WHERE id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return toRule(result.rows[0]);
}

export default {
  getRules,
  getRulesByCategory,
  getRuleBySlug,
  getRuleById,
};
