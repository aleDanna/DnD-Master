/**
 * Race Service
 * T037: Implement RaceService
 *
 * Handles race and subrace content retrieval
 */

import { query } from '../../config/database.js';
import {
  Race,
  RaceRow,
  RaceSummary,
  Subrace,
  SubraceRow,
  SubraceSummary,
  toRace,
  toRaceSummary,
  toSubrace,
  toSubraceSummary,
} from '../../types/races.types.js';
import { ListResponse, ListFilter } from '../../types/content.types.js';

/**
 * Get all races
 */
export async function getRaces(filter: ListFilter = {}): Promise<ListResponse<RaceSummary>> {
  const { page = 1, pageSize = 20, sortBy = 'name', sortOrder = 'asc' } = filter;
  const offset = (page - 1) * pageSize;

  const allowedSortColumns = ['name', 'size', 'speed', 'created_at'];
  const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const countResult = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM races
  `);

  const result = await query<RaceRow>(`
    SELECT id, name, slug, description, ability_score_increase, age_description,
           size, speed, languages, traits, source_document, source_page,
           created_at, updated_at
    FROM races
    ORDER BY ${sortColumn} ${order}
    LIMIT $1 OFFSET $2
  `, [pageSize, offset]);

  return {
    items: result.rows.map(toRaceSummary),
    total: parseInt(countResult.rows[0]?.count || '0', 10),
    page,
    pageSize,
  };
}

/**
 * Get a race by slug with its subraces
 */
export async function getRaceBySlug(slug: string): Promise<Race | null> {
  const result = await query<RaceRow>(`
    SELECT id, name, slug, description, ability_score_increase, age_description,
           size, speed, languages, traits, source_document, source_page,
           created_at, updated_at
    FROM races
    WHERE slug = $1
  `, [slug]);

  if (result.rows.length === 0) {
    return null;
  }

  const race = toRace(result.rows[0]);

  // Get subraces
  const subraceResult = await query<SubraceRow>(`
    SELECT id, name, slug, race_id, description, ability_score_increase, traits,
           source_document, source_page, created_at, updated_at
    FROM subraces
    WHERE race_id = $1
    ORDER BY name
  `, [race.id]);

  race.subraces = subraceResult.rows.map(toSubraceSummary);

  return race;
}

/**
 * Get a race by ID
 */
export async function getRaceById(id: string): Promise<Race | null> {
  const result = await query<RaceRow>(`
    SELECT id, name, slug, description, ability_score_increase, age_description,
           size, speed, languages, traits, source_document, source_page,
           created_at, updated_at
    FROM races
    WHERE id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return toRace(result.rows[0]);
}

/**
 * Get a subrace by slug
 */
export async function getSubraceBySlug(
  raceSlug: string,
  subraceSlug: string
): Promise<Subrace | null> {
  const result = await query<SubraceRow>(`
    SELECT s.id, s.name, s.slug, s.race_id, s.description, s.ability_score_increase,
           s.traits, s.source_document, s.source_page, s.created_at, s.updated_at
    FROM subraces s
    JOIN races r ON s.race_id = r.id
    WHERE r.slug = $1 AND s.slug = $2
  `, [raceSlug, subraceSlug]);

  if (result.rows.length === 0) {
    return null;
  }

  return toSubrace(result.rows[0]);
}

/**
 * Get all subraces for a race
 */
export async function getSubracesByRaceSlug(
  raceSlug: string
): Promise<SubraceSummary[]> {
  const result = await query<SubraceRow>(`
    SELECT s.id, s.name, s.slug, s.race_id, s.description, s.ability_score_increase,
           s.traits, s.source_document, s.source_page, s.created_at, s.updated_at
    FROM subraces s
    JOIN races r ON s.race_id = r.id
    WHERE r.slug = $1
    ORDER BY s.name
  `, [raceSlug]);

  return result.rows.map(toSubraceSummary);
}

export default {
  getRaces,
  getRaceBySlug,
  getRaceById,
  getSubraceBySlug,
  getSubracesByRaceSlug,
};
