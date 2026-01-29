// Characters API Routes - T015
// Endpoints for classes, races, backgrounds, and feats

import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';
import { paginatedQuery, rowsToCamelCase } from '../../services/handbook/contentService.js';
import { buildClassFilters, ClassFilterParams } from '../../services/handbook/filterService.js';

const router = Router();

// ============================================================================
// Classes
// ============================================================================

/**
 * GET /api/handbook/classes
 * List all classes with pagination
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  // Check if this is a classes route or being used for other entities
  const path = req.baseUrl;

  if (path.includes('/classes')) {
    return handleGetClasses(req, res, next);
  } else if (path.includes('/races')) {
    return handleGetRaces(req, res, next);
  } else if (path.includes('/backgrounds')) {
    return handleGetBackgrounds(req, res, next);
  } else if (path.includes('/feats')) {
    return handleGetFeats(req, res, next);
  }

  // Default to classes
  return handleGetClasses(req, res, next);
});

async function handleGetClasses(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, primaryAbility } = req.query;

    const filterParams: ClassFilterParams = {};
    if (primaryAbility) {
      filterParams.primaryAbility = Array.isArray(primaryAbility)
        ? primaryAbility as string[]
        : [primaryAbility as string];
    }

    const { sql: filterSql, params: filterParams_ } = buildClassFilters(filterParams);

    const baseQuery = `
      SELECT id, name, slug, hit_die, primary_ability
      FROM classes
      WHERE ${filterSql}
      ORDER BY name
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM classes
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
}

/**
 * GET /api/handbook/classes/:slug
 * Get a single class with all details
 */
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  const path = req.baseUrl;

  if (path.includes('/classes')) {
    return handleGetClass(req, res, next);
  } else if (path.includes('/races')) {
    return handleGetRace(req, res, next);
  } else if (path.includes('/backgrounds')) {
    return handleGetBackground(req, res, next);
  } else if (path.includes('/feats')) {
    return handleGetFeat(req, res, next);
  }

  return handleGetClass(req, res, next);
});

async function handleGetClass(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(`
      SELECT *
      FROM classes
      WHERE slug = $1
    `, [req.params.slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const cls = result.rows[0];

    // Get class features
    const featuresResult = await query(`
      SELECT id, name, level, description
      FROM class_features
      WHERE class_id = $1 AND subclass_id IS NULL
      ORDER BY level, name
    `, [cls.id]);

    // Get subclasses
    const subclassesResult = await query(`
      SELECT id, name, slug, subclass_level, description
      FROM subclasses
      WHERE class_id = $1
      ORDER BY name
    `, [cls.id]);

    // Parse JSON fields
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
      ...rowsToCamelCase([cls])[0],
      proficiencies: parseJsonField(cls.proficiencies),
      equipment: parseJsonField(cls.equipment),
      savingThrows: parseJsonField(cls.saving_throws),
      features: rowsToCamelCase(featuresResult.rows),
      subclasses: rowsToCamelCase(subclassesResult.rows),
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// Races
// ============================================================================

async function handleGetRaces(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20 } = req.query;

    const baseQuery = `
      SELECT id, name, slug, size, speed
      FROM races
      ORDER BY name
    `;

    const countQuery = `SELECT COUNT(*) FROM races`;

    const result = await paginatedQuery(
      baseQuery,
      countQuery,
      [],
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
}

async function handleGetRace(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(`
      SELECT *
      FROM races
      WHERE slug = $1
    `, [req.params.slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Race not found' });
    }

    const race = result.rows[0];

    // Get subraces
    const subracesResult = await query(`
      SELECT id, name, slug, ability_score_increase, traits
      FROM subraces
      WHERE race_id = $1
      ORDER BY name
    `, [race.id]);

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
      ...rowsToCamelCase([race])[0],
      abilityScoreIncrease: parseJsonField(race.ability_score_increase),
      traits: parseJsonField(race.traits),
      languages: parseJsonField(race.languages),
      subraces: subracesResult.rows.map((sr: Record<string, unknown>) => ({
        ...rowsToCamelCase([sr])[0],
        abilityScoreIncrease: parseJsonField(sr.ability_score_increase),
        traits: parseJsonField(sr.traits),
      })),
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// Backgrounds
// ============================================================================

async function handleGetBackgrounds(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20 } = req.query;

    const baseQuery = `
      SELECT id, name, slug, skill_proficiencies
      FROM backgrounds
      ORDER BY name
    `;

    const countQuery = `SELECT COUNT(*) FROM backgrounds`;

    const result = await paginatedQuery(
      baseQuery,
      countQuery,
      [],
      Number(page),
      Number(limit)
    );

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
      data: (result.data as Record<string, unknown>[]).map(bg => ({
        ...rowsToCamelCase([bg])[0],
        skillProficiencies: parseJsonField(bg.skill_proficiencies),
      })),
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

async function handleGetBackground(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(`
      SELECT *
      FROM backgrounds
      WHERE slug = $1
    `, [req.params.slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Background not found' });
    }

    const bg = result.rows[0];

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
      ...rowsToCamelCase([bg])[0],
      skillProficiencies: parseJsonField(bg.skill_proficiencies),
      toolProficiencies: parseJsonField(bg.tool_proficiencies),
      equipment: parseJsonField(bg.equipment),
      feature: parseJsonField(bg.feature),
      characteristics: parseJsonField(bg.characteristics),
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// Feats
// ============================================================================

async function handleGetFeats(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20 } = req.query;

    const baseQuery = `
      SELECT id, name, slug, prerequisites
      FROM feats
      ORDER BY name
    `;

    const countQuery = `SELECT COUNT(*) FROM feats`;

    const result = await paginatedQuery(
      baseQuery,
      countQuery,
      [],
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
}

async function handleGetFeat(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(`
      SELECT *
      FROM feats
      WHERE slug = $1
    `, [req.params.slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feat not found' });
    }

    const feat = result.rows[0];

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
      ...rowsToCamelCase([feat])[0],
      benefits: parseJsonField(feat.benefits),
    });
  } catch (error) {
    next(error);
  }
}

export default router;
