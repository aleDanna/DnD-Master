/**
 * Skill Service
 * T044: Implement SkillService
 *
 * Handles character skill content retrieval
 */

import { query } from '../../config/database.js';
import {
  Skill,
  SkillRow,
  SkillSummary,
  toSkill,
  toSkillSummary,
} from '../../types/misc.types.js';
import { ListResponse, ListFilter } from '../../types/content.types.js';

/**
 * Get all skills
 */
export async function getSkills(filter: ListFilter = {}): Promise<ListResponse<SkillSummary>> {
  const { page = 1, pageSize = 50, sortBy = 'name', sortOrder = 'asc' } = filter;
  const offset = (page - 1) * pageSize;

  const allowedSortColumns = ['name', 'ability', 'created_at'];
  const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const countResult = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM skills
  `);

  const result = await query<SkillRow>(`
    SELECT id, name, slug, ability, description, source_document, source_page,
           created_at, updated_at
    FROM skills
    ORDER BY ${sortColumn} ${order}
    LIMIT $1 OFFSET $2
  `, [pageSize, offset]);

  return {
    items: result.rows.map(toSkillSummary),
    total: parseInt(countResult.rows[0]?.count || '0', 10),
    page,
    pageSize,
  };
}

/**
 * Get a skill by slug
 */
export async function getSkillBySlug(slug: string): Promise<Skill | null> {
  const result = await query<SkillRow>(`
    SELECT id, name, slug, ability, description, source_document, source_page,
           created_at, updated_at
    FROM skills
    WHERE slug = $1
  `, [slug]);

  if (result.rows.length === 0) {
    return null;
  }

  return toSkill(result.rows[0]);
}

/**
 * Get a skill by ID
 */
export async function getSkillById(id: string): Promise<Skill | null> {
  const result = await query<SkillRow>(`
    SELECT id, name, slug, ability, description, source_document, source_page,
           created_at, updated_at
    FROM skills
    WHERE id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return toSkill(result.rows[0]);
}

/**
 * Get skills by ability
 */
export async function getSkillsByAbility(ability: string): Promise<Skill[]> {
  const result = await query<SkillRow>(`
    SELECT id, name, slug, ability, description, source_document, source_page,
           created_at, updated_at
    FROM skills
    WHERE UPPER(ability) = UPPER($1)
    ORDER BY name
  `, [ability]);

  return result.rows.map(toSkill);
}

/**
 * Get all skills grouped by ability
 */
export async function getSkillsByAbilityGrouped(): Promise<Record<string, Skill[]>> {
  const result = await query<SkillRow>(`
    SELECT id, name, slug, ability, description, source_document, source_page,
           created_at, updated_at
    FROM skills
    ORDER BY ability, name
  `);

  const grouped: Record<string, Skill[]> = {};
  for (const row of result.rows) {
    const skill = toSkill(row);
    if (!grouped[skill.ability]) {
      grouped[skill.ability] = [];
    }
    grouped[skill.ability].push(skill);
  }

  return grouped;
}

/**
 * Get all unique abilities
 */
export async function getAbilities(): Promise<string[]> {
  const result = await query<{ ability: string }>(`
    SELECT DISTINCT ability FROM skills ORDER BY ability
  `);
  return result.rows.map(r => r.ability);
}

export default {
  getSkills,
  getSkillBySlug,
  getSkillById,
  getSkillsByAbility,
  getSkillsByAbilityGrouped,
  getAbilities,
};
