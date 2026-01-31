/**
 * Condition Service
 * T043: Implement ConditionService
 *
 * Handles status condition content retrieval
 */

import { query } from '../../config/database.js';
import {
  Condition,
  ConditionRow,
  ConditionSummary,
  toCondition,
  toConditionSummary,
} from '../../types/misc.types.js';
import { ListResponse, ListFilter } from '../../types/content.types.js';

/**
 * Get all conditions
 */
export async function getConditions(filter: ListFilter = {}): Promise<ListResponse<ConditionSummary>> {
  const { page = 1, pageSize = 50, sortBy = 'name', sortOrder = 'asc' } = filter;
  const offset = (page - 1) * pageSize;

  const allowedSortColumns = ['name', 'created_at'];
  const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const countResult = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM conditions
  `);

  const result = await query<ConditionRow>(`
    SELECT id, name, slug, description, source_document, source_page,
           created_at, updated_at
    FROM conditions
    ORDER BY ${sortColumn} ${order}
    LIMIT $1 OFFSET $2
  `, [pageSize, offset]);

  return {
    items: result.rows.map(toConditionSummary),
    total: parseInt(countResult.rows[0]?.count || '0', 10),
    page,
    pageSize,
  };
}

/**
 * Get a condition by slug
 */
export async function getConditionBySlug(slug: string): Promise<Condition | null> {
  const result = await query<ConditionRow>(`
    SELECT id, name, slug, description, source_document, source_page,
           created_at, updated_at
    FROM conditions
    WHERE slug = $1
  `, [slug]);

  if (result.rows.length === 0) {
    return null;
  }

  return toCondition(result.rows[0]);
}

/**
 * Get a condition by ID
 */
export async function getConditionById(id: string): Promise<Condition | null> {
  const result = await query<ConditionRow>(`
    SELECT id, name, slug, description, source_document, source_page,
           created_at, updated_at
    FROM conditions
    WHERE id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return toCondition(result.rows[0]);
}

/**
 * Get all conditions (no pagination, typically small set)
 */
export async function getAllConditions(): Promise<Condition[]> {
  const result = await query<ConditionRow>(`
    SELECT id, name, slug, description, source_document, source_page,
           created_at, updated_at
    FROM conditions
    ORDER BY name
  `);

  return result.rows.map(toCondition);
}

export default {
  getConditions,
  getConditionBySlug,
  getConditionById,
  getAllConditions,
};
