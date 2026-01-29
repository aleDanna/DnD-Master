// Bestiary API Routes - T013
// Endpoints for monsters listing and detail

import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';
import { paginatedQuery, rowsToCamelCase } from '../../services/handbook/contentService.js';
import { buildMonsterFilters, MonsterFilterParams } from '../../services/handbook/filterService.js';

const router = Router();

/**
 * GET /api/handbook/monsters
 * List monsters with filters and pagination
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      challengeRatingMin,
      challengeRatingMax,
      size,
      type,
    } = req.query;

    // Build filter params
    const filterParams: MonsterFilterParams = {};

    if (challengeRatingMin !== undefined) {
      filterParams.challengeRatingMin = Number(challengeRatingMin);
    }

    if (challengeRatingMax !== undefined) {
      filterParams.challengeRatingMax = Number(challengeRatingMax);
    }

    if (size) {
      filterParams.size = Array.isArray(size) ? size as string[] : [size as string];
    }

    if (type) {
      filterParams.type = Array.isArray(type) ? type as string[] : [type as string];
    }

    const { sql: filterSql, params: filterParams_ } = buildMonsterFilters(filterParams);

    const baseQuery = `
      SELECT
        id, name, slug, size, monster_type,
        challenge_rating, armor_class, hit_points
      FROM monsters
      WHERE ${filterSql}
      ORDER BY
        CASE
          WHEN challenge_rating ~ '^[0-9]+$' THEN CAST(challenge_rating AS INTEGER)
          WHEN challenge_rating = '1/8' THEN 0
          WHEN challenge_rating = '1/4' THEN 0
          WHEN challenge_rating = '1/2' THEN 0
          ELSE 0
        END,
        name
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM monsters
      WHERE ${filterSql}
    `;

    const result = await paginatedQuery(
      baseQuery,
      countQuery,
      filterParams_,
      Number(page),
      Number(limit)
    );

    res.json({
      data: rowsToCamelCase(result.data as Record<string, unknown>[]),
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/handbook/monsters/:slug
 * Get a single monster by slug with full stat block
 */
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT *
      FROM monsters
      WHERE slug = $1
    `, [req.params.slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Monster not found' });
    }

    const monster = result.rows[0];

    // Parse JSON fields if stored as strings
    const parseJsonField = (field: unknown) => {
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch {
          return field;
        }
      }
      return field;
    };

    res.json({
      ...rowsToCamelCase([monster])[0],
      abilityScores: parseJsonField(monster.ability_scores),
      savingThrows: parseJsonField(monster.saving_throws),
      skills: parseJsonField(monster.skills),
      damageResistances: parseJsonField(monster.damage_resistances),
      damageImmunities: parseJsonField(monster.damage_immunities),
      conditionImmunities: parseJsonField(monster.condition_immunities),
      speed: parseJsonField(monster.speed),
      traits: parseJsonField(monster.traits),
      actions: parseJsonField(monster.actions),
      legendaryActions: parseJsonField(monster.legendary_actions),
      lairActions: parseJsonField(monster.lair_actions),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
