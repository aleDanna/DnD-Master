// Equipment API Routes - T014
// Endpoints for items listing and detail

import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';
import { paginatedQuery, rowsToCamelCase } from '../../services/handbook/contentService.js';
import { buildItemFilters, ItemFilterParams } from '../../services/handbook/filterService.js';

const router = Router();

/**
 * GET /api/handbook/items
 * List items with filters and pagination
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      rarity,
      attunementRequired,
    } = req.query;

    // Build filter params
    const filterParams: ItemFilterParams = {};

    if (type) {
      filterParams.type = Array.isArray(type) ? type as string[] : [type as string];
    }

    if (rarity) {
      filterParams.rarity = Array.isArray(rarity) ? rarity as string[] : [rarity as string];
    }

    if (attunementRequired !== undefined) {
      filterParams.attunementRequired = attunementRequired === 'true';
    }

    const { sql: filterSql, params: filterParams_ } = buildItemFilters(filterParams);

    const baseQuery = `
      SELECT
        id, name, slug, item_type, rarity, attunement_required
      FROM items
      WHERE ${filterSql}
      ORDER BY name
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM items
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
 * GET /api/handbook/items/:slug
 * Get a single item by slug
 */
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT *
      FROM items
      WHERE slug = $1
    `, [req.params.slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = result.rows[0];

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
      ...rowsToCamelCase([item])[0],
      properties: parseJsonField(item.properties),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
