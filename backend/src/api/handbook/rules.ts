// Rules API Routes - T011
// Endpoints for rule categories and rules

import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';
import {
  paginatedQuery,
  getBySlug,
  rowsToCamelCase,
  buildCategoryPath,
  getCategoryChildren,
} from '../../services/handbook/contentService.js';
import { buildPagination } from '../../services/handbook/filterService.js';

const router = Router();

/**
 * GET /api/handbook/rules/categories
 * List all top-level rule categories
 */
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT
        rc.*,
        (SELECT COUNT(*) FROM rule_categories WHERE parent_id = rc.id) as child_count,
        (SELECT COUNT(*) FROM rules WHERE category_id = rc.id) as rule_count
      FROM rule_categories rc
      WHERE rc.parent_id IS NULL
      ORDER BY rc.sort_order, rc.name
    `);

    res.json(rowsToCamelCase(result.rows));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/handbook/rules/categories/:id/children
 * Get child categories of a parent category
 */
router.get('/categories/:id/children', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const children = await getCategoryChildren(req.params.id);
    res.json(children);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/handbook/rules
 * List rules with pagination and optional category filter
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, categoryId } = req.query;

    let baseQuery = `
      SELECT
        r.id, r.title, r.slug, r.summary, r.category_id,
        rc.name as category_name
      FROM rules r
      LEFT JOIN rule_categories rc ON r.category_id = rc.id
    `;

    let countQuery = `SELECT COUNT(*) FROM rules r`;
    const params: unknown[] = [];

    if (categoryId) {
      baseQuery += ` WHERE r.category_id = $1`;
      countQuery += ` WHERE r.category_id = $1`;
      params.push(categoryId);
    }

    baseQuery += ` ORDER BY r.title`;

    const result = await paginatedQuery(
      baseQuery,
      countQuery,
      params,
      Number(page),
      Number(limit)
    );

    // Add category path to each rule
    const dataWithPaths = await Promise.all(
      result.data.map(async (rule: Record<string, unknown>) => {
        const categoryPath = rule.category_id
          ? await buildCategoryPath(rule.category_id as string)
          : [];
        return {
          ...rowsToCamelCase([rule])[0],
          categoryPath,
        };
      })
    );

    res.json({
      data: dataWithPaths,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/handbook/rules/:slug
 * Get a single rule by slug
 */
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT
        r.*,
        rc.name as category_name,
        rc.slug as category_slug
      FROM rules r
      LEFT JOIN rule_categories rc ON r.category_id = rc.id
      WHERE r.slug = $1
    `, [req.params.slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const rule = result.rows[0];

    // Get category path
    const categoryPath = rule.category_id
      ? await buildCategoryPath(rule.category_id)
      : [];

    // Get related rules via rule_references
    const relatedResult = await query(`
      SELECT
        r.id, r.title, r.slug, r.summary
      FROM rule_references rr
      JOIN rules r ON r.id = rr.target_rule_id
      WHERE rr.source_rule_id = $1
      UNION
      SELECT
        r.id, r.title, r.slug, r.summary
      FROM rule_references rr
      JOIN rules r ON r.id = rr.source_rule_id
      WHERE rr.target_rule_id = $1
    `, [rule.id]);

    res.json({
      ...rowsToCamelCase([rule])[0],
      categoryPath,
      relatedRules: rowsToCamelCase(relatedResult.rows),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
