// Filter Service - T006
// Build SQL WHERE clauses for filtering handbook content

export interface WhereClause {
  sql: string;
  params: unknown[];
}

export interface SpellFilterParams {
  level?: number[];
  school?: string[];
  class?: string[];
  concentration?: boolean;
  ritual?: boolean;
}

export interface MonsterFilterParams {
  challengeRatingMin?: number;
  challengeRatingMax?: number;
  size?: string[];
  type?: string[];
}

export interface ItemFilterParams {
  type?: string[];
  rarity?: string[];
  attunementRequired?: boolean;
}

export interface ClassFilterParams {
  primaryAbility?: string[];
}

/**
 * Build WHERE clause for spell filtering
 */
export function buildSpellFilters(params: SpellFilterParams): WhereClause {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params.level && params.level.length > 0) {
    conditions.push(`level = ANY($${paramIndex})`);
    values.push(params.level);
    paramIndex++;
  }

  if (params.school && params.school.length > 0) {
    conditions.push(`school = ANY($${paramIndex})`);
    values.push(params.school);
    paramIndex++;
  }

  if (params.concentration !== undefined) {
    conditions.push(`concentration = $${paramIndex}`);
    values.push(params.concentration);
    paramIndex++;
  }

  if (params.ritual !== undefined) {
    conditions.push(`ritual = $${paramIndex}`);
    values.push(params.ritual);
    paramIndex++;
  }

  // Class filter requires a join with class_spells table
  // This is handled separately in the query builder

  return {
    sql: conditions.length > 0 ? conditions.join(' AND ') : '1=1',
    params: values,
  };
}

/**
 * Build WHERE clause for monster filtering
 */
export function buildMonsterFilters(params: MonsterFilterParams): WhereClause {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params.challengeRatingMin !== undefined) {
    conditions.push(`CAST(challenge_rating AS DECIMAL) >= $${paramIndex}`);
    values.push(params.challengeRatingMin);
    paramIndex++;
  }

  if (params.challengeRatingMax !== undefined) {
    conditions.push(`CAST(challenge_rating AS DECIMAL) <= $${paramIndex}`);
    values.push(params.challengeRatingMax);
    paramIndex++;
  }

  if (params.size && params.size.length > 0) {
    conditions.push(`size = ANY($${paramIndex})`);
    values.push(params.size);
    paramIndex++;
  }

  if (params.type && params.type.length > 0) {
    conditions.push(`monster_type = ANY($${paramIndex})`);
    values.push(params.type);
    paramIndex++;
  }

  return {
    sql: conditions.length > 0 ? conditions.join(' AND ') : '1=1',
    params: values,
  };
}

/**
 * Build WHERE clause for item filtering
 */
export function buildItemFilters(params: ItemFilterParams): WhereClause {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params.type && params.type.length > 0) {
    conditions.push(`item_type = ANY($${paramIndex})`);
    values.push(params.type);
    paramIndex++;
  }

  if (params.rarity && params.rarity.length > 0) {
    conditions.push(`rarity = ANY($${paramIndex})`);
    values.push(params.rarity);
    paramIndex++;
  }

  if (params.attunementRequired !== undefined) {
    conditions.push(`attunement_required = $${paramIndex}`);
    values.push(params.attunementRequired);
    paramIndex++;
  }

  return {
    sql: conditions.length > 0 ? conditions.join(' AND ') : '1=1',
    params: values,
  };
}

/**
 * Build WHERE clause for class filtering
 */
export function buildClassFilters(params: ClassFilterParams): WhereClause {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params.primaryAbility && params.primaryAbility.length > 0) {
    conditions.push(`primary_ability = ANY($${paramIndex})`);
    values.push(params.primaryAbility);
    paramIndex++;
  }

  return {
    sql: conditions.length > 0 ? conditions.join(' AND ') : '1=1',
    params: values,
  };
}

/**
 * Parse CR string to numeric value for comparison
 * Handles fractional CRs like "1/4", "1/2"
 */
export function parseChallengeRating(cr: string): number {
  if (cr.includes('/')) {
    const [num, denom] = cr.split('/').map(Number);
    return num / denom;
  }
  return parseFloat(cr);
}

/**
 * Add pagination to a query
 */
export function buildPagination(page: number = 1, limit: number = 20): { offset: number; limit: number } {
  const safeLimit = Math.min(Math.max(1, limit), 100); // Clamp between 1 and 100
  const safePage = Math.max(1, page);
  return {
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
  };
}

/**
 * Build ORDER BY clause
 */
export function buildOrderBy(
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
  allowedFields: string[] = ['name', 'created_at']
): string {
  const field = allowedFields.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
  return `${field} ${order}`;
}
