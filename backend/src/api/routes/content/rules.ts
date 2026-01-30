/**
 * Rules Routes
 * T045: Create rules routes (list, category, detail)
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../../middleware/error-handler.js';
import ruleCategoryService from '../../../services/content/ruleCategoryService.js';
import ruleService from '../../../services/content/ruleService.js';

const router = Router();

/**
 * GET /api/content/rules
 * List all rules with pagination
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, sortBy, sortOrder } = req.query;

  const result = await ruleService.getRules({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });

  res.json({ success: true, data: result });
}));

/**
 * GET /api/content/rules/categories
 * Get top-level rule categories
 */
router.get('/categories', asyncHandler(async (_req: Request, res: Response) => {
  const categories = await ruleCategoryService.getRootCategories();
  res.json({ success: true, data: categories });
}));

/**
 * GET /api/content/rules/categories/:slug
 * Get a category with its children and rules
 */
router.get('/categories/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const category = await ruleCategoryService.getCategoryBySlug(slug);

  if (!category) {
    throw ApiError.notFound('Rule category');
  }

  res.json({ success: true, data: category });
}));

/**
 * GET /api/content/rules/categories/:slug/path
 * Get breadcrumb path for a category
 */
router.get('/categories/:slug/path', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const path = await ruleCategoryService.getCategoryPath(slug);

  res.json({ success: true, data: path });
}));

/**
 * GET /api/content/rules/:slug
 * Get a single rule by slug
 */
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const rule = await ruleService.getRuleBySlug(slug);

  if (!rule) {
    throw ApiError.notFound('Rule');
  }

  res.json({ success: true, data: rule });
}));

export default router;
