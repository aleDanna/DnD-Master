/**
 * Feats Routes
 * T052: Create feats routes
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../../middleware/error-handler.js';
import featService from '../../../services/content/featService.js';

const router = Router();

/**
 * GET /api/content/feats
 * List all feats
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, sortBy, sortOrder } = req.query;

  const result = await featService.getFeats({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });

  res.json({ success: true, data: result });
}));

/**
 * GET /api/content/feats/no-prerequisites
 * Get feats without prerequisites
 */
router.get('/no-prerequisites', asyncHandler(async (_req: Request, res: Response) => {
  const feats = await featService.getFeatsWithoutPrerequisites();
  res.json({ success: true, data: feats });
}));

/**
 * GET /api/content/feats/:slug
 * Get a feat by slug
 */
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const feat = await featService.getFeatBySlug(slug);

  if (!feat) {
    throw ApiError.notFound('Feat');
  }

  res.json({ success: true, data: feat });
}));

export default router;
