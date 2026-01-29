// Spells API Routes - T012
// Endpoints for spells listing and detail

import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';
import { paginatedQuery, getBySlug, rowsToCamelCase } from '../../services/handbook/contentService.js';
import { buildSpellFilters, SpellFilterParams } from '../../services/handbook/filterService.js';

const router = Router();

/**
 * GET /api/handbook/spells
 * List spells with filters and pagination
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      level,
      school,
      class: classFilter,
      concentration,
      ritual,
    } = req.query;

    // Build filter params
    const filterParams: SpellFilterParams = {};

    if (level) {
      filterParams.level = Array.isArray(level)
        ? level.map(Number)
        : [Number(level)];
    }

    if (school) {
      filterParams.school = Array.isArray(school)
        ? school as string[]
        : [school as string];
    }

    if (concentration !== undefined) {
      filterParams.concentration = concentration === 'true';
    }

    if (ritual !== undefined) {
      filterParams.ritual = ritual === 'true';
    }

    const { sql: filterSql, params: filterParams_ } = buildSpellFilters(filterParams);

    // Handle class filter separately (requires join)
    let classJoin = '';
    let classCondition = '';
    const allParams = [...filterParams_];

    if (classFilter) {
      const classNames = Array.isArray(classFilter) ? classFilter : [classFilter];
      classJoin = `
        JOIN class_spells cs ON s.id = cs.spell_id
        JOIN classes c ON cs.class_id = c.id
      `;
      classCondition = ` AND c.slug = ANY($${allParams.length + 1})`;
      allParams.push(classNames);
    }

    const baseQuery = `
      SELECT DISTINCT
        s.id, s.name, s.slug, s.level, s.school,
        s.casting_time, s.concentration, s.ritual
      FROM spells s
      ${classJoin}
      WHERE ${filterSql}${classCondition}
      ORDER BY s.level, s.name
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT s.id)
      FROM spells s
      ${classJoin}
      WHERE ${filterSql}${classCondition}
    `;

    const result = await paginatedQuery(
      baseQuery,
      countQuery,
      allParams,
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
 * GET /api/handbook/spells/:slug
 * Get a single spell by slug
 */
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT s.*
      FROM spells s
      WHERE s.slug = $1
    `, [req.params.slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Spell not found' });
    }

    const spell = result.rows[0];

    // Get classes that can cast this spell
    const classesResult = await query(`
      SELECT c.name, c.slug
      FROM class_spells cs
      JOIN classes c ON cs.class_id = c.id
      WHERE cs.spell_id = $1
      ORDER BY c.name
    `, [spell.id]);

    // Parse components from JSON if stored as string
    let components = spell.components;
    if (typeof components === 'string') {
      try {
        components = JSON.parse(components);
      } catch {
        components = { verbal: false, somatic: false, material: false };
      }
    }

    res.json({
      ...rowsToCamelCase([spell])[0],
      components,
      classes: classesResult.rows.map((r: { name: string }) => r.name),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
