/**
 * Class Service
 * T036: Implement ClassService
 *
 * Handles class and subclass content retrieval
 */

import { query } from '../../config/database.js';
import {
  Class,
  ClassRow,
  ClassSummary,
  Subclass,
  SubclassRow,
  SubclassSummary,
  toClass,
  toClassSummary,
  toSubclass,
  toSubclassSummary,
} from '../../types/classes.types.js';
import { ListResponse, ListFilter } from '../../types/content.types.js';

/**
 * Get all classes
 */
export async function getClasses(filter: ListFilter = {}): Promise<ListResponse<ClassSummary>> {
  const { page = 1, pageSize = 20, sortBy = 'name', sortOrder = 'asc' } = filter;
  const offset = (page - 1) * pageSize;

  const allowedSortColumns = ['name', 'created_at'];
  const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const countResult = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM classes
  `);

  const result = await query<ClassRow>(`
    SELECT id, name, slug, description, hit_die, primary_ability, saving_throws,
           armor_proficiencies, weapon_proficiencies, tool_proficiencies,
           skill_choices, features, source_document, source_page, created_at, updated_at
    FROM classes
    ORDER BY ${sortColumn} ${order}
    LIMIT $1 OFFSET $2
  `, [pageSize, offset]);

  return {
    items: result.rows.map(toClassSummary),
    total: parseInt(countResult.rows[0]?.count || '0', 10),
    page,
    pageSize,
  };
}

/**
 * Get a class by slug with its subclasses
 */
export async function getClassBySlug(slug: string): Promise<Class | null> {
  const result = await query<ClassRow>(`
    SELECT id, name, slug, description, hit_die, primary_ability, saving_throws,
           armor_proficiencies, weapon_proficiencies, tool_proficiencies,
           skill_choices, features, source_document, source_page, created_at, updated_at
    FROM classes
    WHERE slug = $1
  `, [slug]);

  if (result.rows.length === 0) {
    return null;
  }

  const classEntity = toClass(result.rows[0]);

  // Get subclasses
  const subclassResult = await query<SubclassRow>(`
    SELECT id, name, slug, class_id, description, features,
           source_document, source_page, created_at, updated_at
    FROM subclasses
    WHERE class_id = $1
    ORDER BY name
  `, [classEntity.id]);

  classEntity.subclasses = subclassResult.rows.map(toSubclassSummary);

  return classEntity;
}

/**
 * Get a class by ID
 */
export async function getClassById(id: string): Promise<Class | null> {
  const result = await query<ClassRow>(`
    SELECT id, name, slug, description, hit_die, primary_ability, saving_throws,
           armor_proficiencies, weapon_proficiencies, tool_proficiencies,
           skill_choices, features, source_document, source_page, created_at, updated_at
    FROM classes
    WHERE id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return toClass(result.rows[0]);
}

/**
 * Get a subclass by slug
 */
export async function getSubclassBySlug(
  classSlug: string,
  subclassSlug: string
): Promise<Subclass | null> {
  const result = await query<SubclassRow>(`
    SELECT s.id, s.name, s.slug, s.class_id, s.description, s.features,
           s.source_document, s.source_page, s.created_at, s.updated_at
    FROM subclasses s
    JOIN classes c ON s.class_id = c.id
    WHERE c.slug = $1 AND s.slug = $2
  `, [classSlug, subclassSlug]);

  if (result.rows.length === 0) {
    return null;
  }

  return toSubclass(result.rows[0]);
}

/**
 * Get all subclasses for a class
 */
export async function getSubclassesByClassSlug(
  classSlug: string
): Promise<SubclassSummary[]> {
  const result = await query<SubclassRow>(`
    SELECT s.id, s.name, s.slug, s.class_id, s.description, s.features,
           s.source_document, s.source_page, s.created_at, s.updated_at
    FROM subclasses s
    JOIN classes c ON s.class_id = c.id
    WHERE c.slug = $1
    ORDER BY s.name
  `, [classSlug]);

  return result.rows.map(toSubclassSummary);
}

export default {
  getClasses,
  getClassBySlug,
  getClassById,
  getSubclassBySlug,
  getSubclassesByClassSlug,
};
