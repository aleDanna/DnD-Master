/**
 * Feat Service
 * T042: Implement FeatService
 *
 * Handles character feat content retrieval
 */

import { query } from '../../config/database.js';
import {
  Feat,
  FeatRow,
  FeatSummary,
  toFeat,
  toFeatSummary,
} from '../../types/misc.types.js';
import { ListResponse, ListFilter } from '../../types/content.types.js';

/**
 * Get all feats
 */
export async function getFeats(filter: ListFilter = {}): Promise<ListResponse<FeatSummary>> {
  const { page = 1, pageSize = 20, sortBy = 'name', sortOrder = 'asc' } = filter;
  const offset = (page - 1) * pageSize;

  const allowedSortColumns = ['name', 'created_at'];
  const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const countResult = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM feats
  `);

  const result = await query<FeatRow>(`
    SELECT id, name, slug, prerequisites, description, benefits,
           source_document, source_page, created_at, updated_at
    FROM feats
    ORDER BY ${sortColumn} ${order}
    LIMIT $1 OFFSET $2
  `, [pageSize, offset]);

  return {
    items: result.rows.map(toFeatSummary),
    total: parseInt(countResult.rows[0]?.count || '0', 10),
    page,
    pageSize,
  };
}

/**
 * Get a feat by slug
 */
export async function getFeatBySlug(slug: string): Promise<Feat | null> {
  const result = await query<FeatRow>(`
    SELECT id, name, slug, prerequisites, description, benefits,
           source_document, source_page, created_at, updated_at
    FROM feats
    WHERE slug = $1
  `, [slug]);

  if (result.rows.length === 0) {
    return null;
  }

  return toFeat(result.rows[0]);
}

/**
 * Get a feat by ID
 */
export async function getFeatById(id: string): Promise<Feat | null> {
  const result = await query<FeatRow>(`
    SELECT id, name, slug, prerequisites, description, benefits,
           source_document, source_page, created_at, updated_at
    FROM feats
    WHERE id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return toFeat(result.rows[0]);
}

/**
 * Get feats with no prerequisites
 */
export async function getFeatsWithoutPrerequisites(): Promise<FeatSummary[]> {
  const result = await query<FeatRow>(`
    SELECT id, name, slug, prerequisites, description, benefits,
           source_document, source_page, created_at, updated_at
    FROM feats
    WHERE prerequisites IS NULL OR prerequisites = ''
    ORDER BY name
  `);

  return result.rows.map(toFeatSummary);
}

export default {
  getFeats,
  getFeatBySlug,
  getFeatById,
  getFeatsWithoutPrerequisites,
};
