/**
 * Monster Service
 * T039: Implement MonsterService
 *
 * Handles monster/bestiary content retrieval with filtering
 */

import { query } from '../../config/database.js';
import {
  Monster,
  MonsterRow,
  MonsterSummary,
  MonsterFilter,
  toMonster,
  toMonsterSummary,
} from '../../types/monsters.types.js';
import { ListResponse } from '../../types/content.types.js';

/**
 * Get all monsters with filtering
 */
export async function getMonsters(filter: MonsterFilter = {}): Promise<ListResponse<MonsterSummary>> {
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'name',
    sortOrder = 'asc',
    type,
    minCr,
    maxCr,
    size,
  } = filter;
  const offset = (page - 1) * pageSize;

  const allowedSortColumns = ['name', 'challenge_rating_numeric', 'type', 'size', 'created_at'];
  const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  // Build dynamic WHERE clause
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (type) {
    conditions.push(`LOWER(type) = LOWER($${paramIndex++})`);
    params.push(type);
  }
  if (minCr !== undefined) {
    conditions.push(`challenge_rating_numeric >= $${paramIndex++}`);
    params.push(minCr);
  }
  if (maxCr !== undefined) {
    conditions.push(`challenge_rating_numeric <= $${paramIndex++}`);
    params.push(maxCr);
  }
  if (size) {
    conditions.push(`LOWER(size) = LOWER($${paramIndex++})`);
    params.push(size);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query
  const countResult = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM monsters ${whereClause}
  `, params);

  // Data query
  const dataParams = [...params, pageSize, offset];
  const result = await query<MonsterRow>(`
    SELECT id, name, slug, size, type, subtype, alignment, armor_class, armor_type,
           hit_points, hit_dice, speed, ability_scores, saving_throws, skills,
           damage_vulnerabilities, damage_resistances, damage_immunities,
           condition_immunities, senses, languages, challenge_rating,
           challenge_rating_numeric, experience_points, traits, actions,
           reactions, legendary_actions, lair_actions, description,
           source_document, source_page, created_at, updated_at
    FROM monsters
    ${whereClause}
    ORDER BY ${sortColumn} ${order}
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `, dataParams);

  return {
    items: result.rows.map(toMonsterSummary),
    total: parseInt(countResult.rows[0]?.count || '0', 10),
    page,
    pageSize,
  };
}

/**
 * Get a monster by slug
 */
export async function getMonsterBySlug(slug: string): Promise<Monster | null> {
  const result = await query<MonsterRow>(`
    SELECT id, name, slug, size, type, subtype, alignment, armor_class, armor_type,
           hit_points, hit_dice, speed, ability_scores, saving_throws, skills,
           damage_vulnerabilities, damage_resistances, damage_immunities,
           condition_immunities, senses, languages, challenge_rating,
           challenge_rating_numeric, experience_points, traits, actions,
           reactions, legendary_actions, lair_actions, description,
           source_document, source_page, created_at, updated_at
    FROM monsters
    WHERE slug = $1
  `, [slug]);

  if (result.rows.length === 0) {
    return null;
  }

  return toMonster(result.rows[0]);
}

/**
 * Get a monster by ID
 */
export async function getMonsterById(id: string): Promise<Monster | null> {
  const result = await query<MonsterRow>(`
    SELECT id, name, slug, size, type, subtype, alignment, armor_class, armor_type,
           hit_points, hit_dice, speed, ability_scores, saving_throws, skills,
           damage_vulnerabilities, damage_resistances, damage_immunities,
           condition_immunities, senses, languages, challenge_rating,
           challenge_rating_numeric, experience_points, traits, actions,
           reactions, legendary_actions, lair_actions, description,
           source_document, source_page, created_at, updated_at
    FROM monsters
    WHERE id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return toMonster(result.rows[0]);
}

/**
 * Get monsters by type
 */
export async function getMonstersByType(type: string): Promise<MonsterSummary[]> {
  const result = await query<MonsterRow>(`
    SELECT id, name, slug, size, type, subtype, alignment, armor_class, armor_type,
           hit_points, hit_dice, speed, ability_scores, saving_throws, skills,
           damage_vulnerabilities, damage_resistances, damage_immunities,
           condition_immunities, senses, languages, challenge_rating,
           challenge_rating_numeric, experience_points, traits, actions,
           reactions, legendary_actions, lair_actions, description,
           source_document, source_page, created_at, updated_at
    FROM monsters
    WHERE LOWER(type) = LOWER($1)
    ORDER BY challenge_rating_numeric, name
  `, [type]);

  return result.rows.map(toMonsterSummary);
}

/**
 * Get monsters by challenge rating range
 */
export async function getMonstersByCR(
  minCr: number,
  maxCr: number
): Promise<MonsterSummary[]> {
  const result = await query<MonsterRow>(`
    SELECT id, name, slug, size, type, subtype, alignment, armor_class, armor_type,
           hit_points, hit_dice, speed, ability_scores, saving_throws, skills,
           damage_vulnerabilities, damage_resistances, damage_immunities,
           condition_immunities, senses, languages, challenge_rating,
           challenge_rating_numeric, experience_points, traits, actions,
           reactions, legendary_actions, lair_actions, description,
           source_document, source_page, created_at, updated_at
    FROM monsters
    WHERE challenge_rating_numeric >= $1 AND challenge_rating_numeric <= $2
    ORDER BY challenge_rating_numeric, name
  `, [minCr, maxCr]);

  return result.rows.map(toMonsterSummary);
}

/**
 * Get all unique monster types
 */
export async function getMonsterTypes(): Promise<string[]> {
  const result = await query<{ type: string }>(`
    SELECT DISTINCT type FROM monsters ORDER BY type
  `);
  return result.rows.map(r => r.type);
}

export default {
  getMonsters,
  getMonsterBySlug,
  getMonsterById,
  getMonstersByType,
  getMonstersByCR,
  getMonsterTypes,
};
