/**
 * Conditions Routes
 * T053: Create conditions routes
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../../middleware/error-handler.js';
import conditionService from '../../../services/content/conditionService.js';

const router = Router();

/**
 * GET /api/content/conditions
 * List all conditions
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, sortBy, sortOrder } = req.query;

  const result = await conditionService.getConditions({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });

  res.json({ success: true, data: result });
}));

/**
 * GET /api/content/conditions/all
 * Get all conditions (no pagination)
 */
router.get('/all', asyncHandler(async (_req: Request, res: Response) => {
  const conditions = await conditionService.getAllConditions();
  res.json({ success: true, data: conditions });
}));

/**
 * GET /api/content/conditions/:slug
 * Get a condition by slug
 */
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const condition = await conditionService.getConditionBySlug(slug);

  if (!condition) {
    throw ApiError.notFound('Condition');
  }

  res.json({ success: true, data: condition });
}));

export default router;
