/**
 * Spell Service
 * T038: Implement SpellService
 *
 * Handles spell content retrieval with filtering
 */

import { query } from '../../config/database.js';
import {
  Spell,
  SpellRow,
  SpellSummary,
  SpellFilter,
  toSpell,
  toSpellSummary,
} from '../../types/spells.types.js';
import { ListResponse } from '../../types/content.types.js';

/**
 * Get all spells with filtering
 */
export async function getSpells(filter: SpellFilter = {}): Promise<ListResponse<SpellSummary>> {
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'name',
    sortOrder = 'asc',
    level,
    school,
    classSlug,
    concentration,
    ritual,
  } = filter;
  const offset = (page - 1) * pageSize;

  const allowedSortColumns = ['name', 'level', 'school', 'created_at'];
  const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  // Build dynamic WHERE clause
  const conditions: string[] = [];
  const params: (string | number | boolean)[] = [];
  let paramIndex = 1;

  if (level !== undefined) {
    conditions.push(`s.level = $${paramIndex++}`);
    params.push(level);
  }
  if (school) {
    conditions.push(`LOWER(s.school) = LOWER($${paramIndex++})`);
    params.push(school);
  }
  if (concentration !== undefined) {
    conditions.push(`s.concentration = $${paramIndex++}`);
    params.push(concentration);
  }
  if (ritual !== undefined) {
    conditions.push(`s.ritual = $${paramIndex++}`);
    params.push(ritual);
  }
  if (classSlug) {
    conditions.push(`EXISTS (
      SELECT 1 FROM spell_classes sc
      JOIN classes c ON sc.class_id = c.id
      WHERE sc.spell_id = s.id AND c.slug = $${paramIndex++}
    )`);
    params.push(classSlug);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query
  const countResult = await query<{ count: string }>(`
    SELECT COUNT(*) as count
    FROM spells s
    ${whereClause}
  `, params);

  // Data query
  const dataParams = [...params, pageSize, offset];
  const result = await query<SpellRow>(`
    SELECT s.id, s.name, s.slug, s.level, s.school, s.casting_time, s.range,
           s.components, s.duration, s.concentration, s.ritual, s.description,
           s.higher_levels, s.source_document, s.source_page, s.created_at, s.updated_at
    FROM spells s
    ${whereClause}
    ORDER BY ${sortColumn} ${order}
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `, dataParams);

  return {
    items: result.rows.map(toSpellSummary),
    total: parseInt(countResult.rows[0]?.count || '0', 10),
    page,
    pageSize,
  };
}

/**
 * Get a spell by slug
 */
export async function getSpellBySlug(slug: string): Promise<Spell | null> {
  const result = await query<SpellRow>(`
    SELECT id, name, slug, level, school, casting_time, range, components,
           duration, concentration, ritual, description, higher_levels,
           source_document, source_page, created_at, updated_at
    FROM spells
    WHERE slug = $1
  `, [slug]);

  if (result.rows.length === 0) {
    return null;
  }

  const spell = toSpell(result.rows[0]);

  // Get associated classes
  const classResult = await query<{ slug: string }>(`
    SELECT c.slug
    FROM spell_classes sc
    JOIN classes c ON sc.class_id = c.id
    WHERE sc.spell_id = $1
    ORDER BY c.name
  `, [spell.id]);

  spell.classes = classResult.rows.map(r => r.slug);

  return spell;
}

/**
 * Get a spell by ID
 */
export async function getSpellById(id: string): Promise<Spell | null> {
  const result = await query<SpellRow>(`
    SELECT id, name, slug, level, school, casting_time, range, components,
           duration, concentration, ritual, description, higher_levels,
           source_document, source_page, created_at, updated_at
    FROM spells
    WHERE id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return toSpell(result.rows[0]);
}

/**
 * Get spells by level
 */
export async function getSpellsByLevel(level: number): Promise<SpellSummary[]> {
  const result = await query<SpellRow>(`
    SELECT id, name, slug, level, school, casting_time, range, components,
           duration, concentration, ritual, description, higher_levels,
           source_document, source_page, created_at, updated_at
    FROM spells
    WHERE level = $1
    ORDER BY name
  `, [level]);

  return result.rows.map(toSpellSummary);
}

/**
 * Get spells by school
 */
export async function getSpellsBySchool(school: string): Promise<SpellSummary[]> {
  const result = await query<SpellRow>(`
    SELECT id, name, slug, level, school, casting_time, range, components,
           duration, concentration, ritual, description, higher_levels,
           source_document, source_page, created_at, updated_at
    FROM spells
    WHERE LOWER(school) = LOWER($1)
    ORDER BY level, name
  `, [school]);

  return result.rows.map(toSpellSummary);
}

/**
 * Get spells available to a class
 */
export async function getSpellsByClass(classSlug: string): Promise<SpellSummary[]> {
  const result = await query<SpellRow>(`
    SELECT s.id, s.name, s.slug, s.level, s.school, s.casting_time, s.range,
           s.components, s.duration, s.concentration, s.ritual, s.description,
           s.higher_levels, s.source_document, s.source_page, s.created_at, s.updated_at
    FROM spells s
    JOIN spell_classes sc ON s.id = sc.spell_id
    JOIN classes c ON sc.class_id = c.id
    WHERE c.slug = $1
    ORDER BY s.level, s.name
  `, [classSlug]);

  return result.rows.map(toSpellSummary);
}

export default {
  getSpells,
  getSpellBySlug,
  getSpellById,
  getSpellsByLevel,
  getSpellsBySchool,
  getSpellsByClass,
};
