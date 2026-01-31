/**
 * Item Service
 * T040: Implement ItemService
 *
 * Handles item content retrieval with filtering
 */

import { query } from '../../config/database.js';
import {
  Item,
  ItemRow,
  ItemSummary,
  ItemFilter,
  toItem,
  toItemSummary,
} from '../../types/items.types.js';
import { ListResponse } from '../../types/content.types.js';

/**
 * Get all items with filtering
 */
export async function getItems(filter: ItemFilter = {}): Promise<ListResponse<ItemSummary>> {
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'name',
    sortOrder = 'asc',
    type,
    subtype,
    rarity,
  } = filter;
  const offset = (page - 1) * pageSize;

  const allowedSortColumns = ['name', 'type', 'rarity', 'created_at'];
  const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  // Build dynamic WHERE clause
  const conditions: string[] = [];
  const params: string[] = [];
  let paramIndex = 1;

  if (type) {
    conditions.push(`LOWER(type) = LOWER($${paramIndex++})`);
    params.push(type);
  }
  if (subtype) {
    conditions.push(`LOWER(subtype) = LOWER($${paramIndex++})`);
    params.push(subtype);
  }
  if (rarity) {
    conditions.push(`LOWER(rarity) = LOWER($${paramIndex++})`);
    params.push(rarity);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query
  const countResult = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM items ${whereClause}
  `, params);

  // Data query
  const dataParams = [...params, pageSize, offset];
  const result = await query<ItemRow>(`
    SELECT id, name, slug, type, subtype, rarity, cost, weight, properties,
           damage, armor_class, description, requires_attunement,
           source_document, source_page, created_at, updated_at
    FROM items
    ${whereClause}
    ORDER BY ${sortColumn} ${order}
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `, dataParams);

  return {
    items: result.rows.map(toItemSummary),
    total: parseInt(countResult.rows[0]?.count || '0', 10),
    page,
    pageSize,
  };
}

/**
 * Get an item by slug
 */
export async function getItemBySlug(slug: string): Promise<Item | null> {
  const result = await query<ItemRow>(`
    SELECT id, name, slug, type, subtype, rarity, cost, weight, properties,
           damage, armor_class, description, requires_attunement,
           source_document, source_page, created_at, updated_at
    FROM items
    WHERE slug = $1
  `, [slug]);

  if (result.rows.length === 0) {
    return null;
  }

  return toItem(result.rows[0]);
}

/**
 * Get an item by ID
 */
export async function getItemById(id: string): Promise<Item | null> {
  const result = await query<ItemRow>(`
    SELECT id, name, slug, type, subtype, rarity, cost, weight, properties,
           damage, armor_class, description, requires_attunement,
           source_document, source_page, created_at, updated_at
    FROM items
    WHERE id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return toItem(result.rows[0]);
}

/**
 * Get items by type
 */
export async function getItemsByType(type: string): Promise<ItemSummary[]> {
  const result = await query<ItemRow>(`
    SELECT id, name, slug, type, subtype, rarity, cost, weight, properties,
           damage, armor_class, description, requires_attunement,
           source_document, source_page, created_at, updated_at
    FROM items
    WHERE LOWER(type) = LOWER($1)
    ORDER BY name
  `, [type]);

  return result.rows.map(toItemSummary);
}

/**
 * Get items by rarity
 */
export async function getItemsByRarity(rarity: string): Promise<ItemSummary[]> {
  const result = await query<ItemRow>(`
    SELECT id, name, slug, type, subtype, rarity, cost, weight, properties,
           damage, armor_class, description, requires_attunement,
           source_document, source_page, created_at, updated_at
    FROM items
    WHERE LOWER(rarity) = LOWER($1)
    ORDER BY name
  `, [rarity]);

  return result.rows.map(toItemSummary);
}

/**
 * Get all unique item types
 */
export async function getItemTypes(): Promise<string[]> {
  const result = await query<{ type: string }>(`
    SELECT DISTINCT type FROM items ORDER BY type
  `);
  return result.rows.map(r => r.type);
}

/**
 * Get all unique item rarities
 */
export async function getItemRarities(): Promise<string[]> {
  const result = await query<{ rarity: string }>(`
    SELECT DISTINCT rarity FROM items WHERE rarity IS NOT NULL ORDER BY
    CASE rarity
      WHEN 'common' THEN 1
      WHEN 'uncommon' THEN 2
      WHEN 'rare' THEN 3
      WHEN 'very rare' THEN 4
      WHEN 'legendary' THEN 5
      WHEN 'artifact' THEN 6
      ELSE 7
    END
  `);
  return result.rows.map(r => r.rarity);
}

export default {
  getItems,
  getItemBySlug,
  getItemById,
  getItemsByType,
  getItemsByRarity,
  getItemTypes,
  getItemRarities,
};
