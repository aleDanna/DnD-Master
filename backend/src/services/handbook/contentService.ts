// Content Service - T007
// Base content retrieval patterns for handbook entities

import { query } from '../../config/database.js';
import { buildPagination } from './filterService.js';

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Generic paginated query helper
 */
export async function paginatedQuery<T>(
  baseQuery: string,
  countQuery: string,
  params: unknown[],
  page: number = 1,
  limit: number = 20
): Promise<PaginationResult<T>> {
  const { offset, limit: safeLimit } = buildPagination(page, limit);

  // Get total count
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].count, 10);

  // Get paginated data
  const paginatedParams = [...params, safeLimit, offset];
  const dataQueryStr = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const dataResult = await query(dataQueryStr, paginatedParams);

  return {
    data: dataResult.rows as T[],
    pagination: {
      page,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Get entity by slug
 */
export async function getBySlug<T>(
  table: string,
  slug: string,
  selectFields: string = '*'
): Promise<T | null> {
  const sql = `SELECT ${selectFields} FROM ${table} WHERE slug = $1`;
  const result = await query(sql, [slug]);
  return result.rows[0] || null;
}

/**
 * Get entity by ID
 */
export async function getById<T>(
  table: string,
  id: string,
  selectFields: string = '*'
): Promise<T | null> {
  const sql = `SELECT ${selectFields} FROM ${table} WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

/**
 * Get all entities from a table (with optional ordering)
 */
export async function getAll<T>(
  table: string,
  selectFields: string = '*',
  orderBy: string = 'name ASC'
): Promise<T[]> {
  const sql = `SELECT ${selectFields} FROM ${table} ORDER BY ${orderBy}`;
  const result = await query(sql);
  return result.rows as T[];
}

/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Convert snake_case database columns to camelCase
 */
export function toCamelCase<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * Convert array of rows to camelCase
 */
export function rowsToCamelCase<T extends Record<string, unknown>>(rows: T[]): Record<string, unknown>[] {
  return rows.map(toCamelCase);
}

/**
 * Build category path array from a hierarchical category
 */
export async function buildCategoryPath(categoryId: string): Promise<string[]> {
  const sql = `
    WITH RECURSIVE category_path AS (
      SELECT id, name, parent_id, 1 as depth
      FROM rule_categories WHERE id = $1
      UNION ALL
      SELECT c.id, c.name, c.parent_id, cp.depth + 1
      FROM rule_categories c
      JOIN category_path cp ON c.id = cp.parent_id
    )
    SELECT name FROM category_path ORDER BY depth DESC
  `;
  const result = await query(sql, [categoryId]);
  return result.rows.map((row: { name: string }) => row.name);
}

/**
 * Get children of a hierarchical category
 */
export async function getCategoryChildren(parentId: string | null): Promise<unknown[]> {
  const sql = parentId
    ? `SELECT * FROM rule_categories WHERE parent_id = $1 ORDER BY sort_order, name`
    : `SELECT * FROM rule_categories WHERE parent_id IS NULL ORDER BY sort_order, name`;

  const params = parentId ? [parentId] : [];
  const result = await query(sql, params);
  return rowsToCamelCase(result.rows);
}

/**
 * Count children in a category
 */
export async function countCategoryChildren(categoryId: string): Promise<number> {
  const sql = `SELECT COUNT(*) FROM rule_categories WHERE parent_id = $1`;
  const result = await query(sql, [categoryId]);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Check if entity exists
 */
export async function exists(table: string, id: string): Promise<boolean> {
  const sql = `SELECT 1 FROM ${table} WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows.length > 0;
}
