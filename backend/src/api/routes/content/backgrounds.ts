/**
 * Backgrounds Routes
 * T051: Create backgrounds routes
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../../middleware/error-handler.js';
import backgroundService from '../../../services/content/backgroundService.js';

const router = Router();

/**
 * GET /api/content/backgrounds
 * List all backgrounds
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, sortBy, sortOrder } = req.query;

  const result = await backgroundService.getBackgrounds({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });

  res.json({ success: true, data: result });
}));

/**
 * GET /api/content/backgrounds/:slug
 * Get a background by slug
 */
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const background = await backgroundService.getBackgroundBySlug(slug);

  if (!background) {
    throw ApiError.notFound('Background');
  }

  res.json({ success: true, data: background });
}));

export default router;
