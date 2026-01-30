/**
 * Background Service
 * T041: Implement BackgroundService
 *
 * Handles character background content retrieval
 */

import { query } from '../../config/database.js';
import {
  Background,
  BackgroundRow,
  BackgroundSummary,
  toBackground,
  toBackgroundSummary,
} from '../../types/misc.types.js';
import { ListResponse, ListFilter } from '../../types/content.types.js';

/**
 * Get all backgrounds
 */
export async function getBackgrounds(filter: ListFilter = {}): Promise<ListResponse<BackgroundSummary>> {
  const { page = 1, pageSize = 20, sortBy = 'name', sortOrder = 'asc' } = filter;
  const offset = (page - 1) * pageSize;

  const allowedSortColumns = ['name', 'created_at'];
  const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const countResult = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM backgrounds
  `);

  const result = await query<BackgroundRow>(`
    SELECT id, name, slug, description, skill_proficiencies, tool_proficiencies,
           languages, equipment, feature_name, feature_description,
           suggested_characteristics, source_document, source_page,
           created_at, updated_at
    FROM backgrounds
    ORDER BY ${sortColumn} ${order}
    LIMIT $1 OFFSET $2
  `, [pageSize, offset]);

  return {
    items: result.rows.map(toBackgroundSummary),
    total: parseInt(countResult.rows[0]?.count || '0', 10),
    page,
    pageSize,
  };
}

/**
 * Get a background by slug
 */
export async function getBackgroundBySlug(slug: string): Promise<Background | null> {
  const result = await query<BackgroundRow>(`
    SELECT id, name, slug, description, skill_proficiencies, tool_proficiencies,
           languages, equipment, feature_name, feature_description,
           suggested_characteristics, source_document, source_page,
           created_at, updated_at
    FROM backgrounds
    WHERE slug = $1
  `, [slug]);

  if (result.rows.length === 0) {
    return null;
  }

  return toBackground(result.rows[0]);
}

/**
 * Get a background by ID
 */
export async function getBackgroundById(id: string): Promise<Background | null> {
  const result = await query<BackgroundRow>(`
    SELECT id, name, slug, description, skill_proficiencies, tool_proficiencies,
           languages, equipment, feature_name, feature_description,
           suggested_characteristics, source_document, source_page,
           created_at, updated_at
    FROM backgrounds
    WHERE id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return toBackground(result.rows[0]);
}

export default {
  getBackgrounds,
  getBackgroundBySlug,
  getBackgroundById,
};
