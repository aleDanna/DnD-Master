/**
 * Bestiary Routes
 * T049: Create bestiary routes (list with filters, detail)
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../../middleware/error-handler.js';
import monsterService from '../../../services/content/monsterService.js';

const router = Router();

/**
 * GET /api/content/bestiary
 * List monsters with optional filters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    page, pageSize, sortBy, sortOrder,
    type, minCr, maxCr, size
  } = req.query;

  const result = await monsterService.getMonsters({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    type: type as string,
    minCr: minCr ? parseFloat(minCr as string) : undefined,
    maxCr: maxCr ? parseFloat(maxCr as string) : undefined,
    size: size as string,
  });

  res.json({ success: true, data: result });
}));

/**
 * GET /api/content/bestiary/types
 * Get all monster types
 */
router.get('/types', asyncHandler(async (_req: Request, res: Response) => {
  const types = await monsterService.getMonsterTypes();
  res.json({ success: true, data: types });
}));

/**
 * GET /api/content/bestiary/type/:type
 * Get monsters by type
 */
router.get('/type/:type', asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const monsters = await monsterService.getMonstersByType(type);
  res.json({ success: true, data: monsters });
}));

/**
 * GET /api/content/bestiary/cr/:minCr/:maxCr
 * Get monsters by CR range
 */
router.get('/cr/:minCr/:maxCr', asyncHandler(async (req: Request, res: Response) => {
  const minCr = parseFloat(req.params.minCr);
  const maxCr = parseFloat(req.params.maxCr);

  if (isNaN(minCr) || isNaN(maxCr)) {
    throw ApiError.badRequest('Invalid CR values');
  }

  const monsters = await monsterService.getMonstersByCR(minCr, maxCr);
  res.json({ success: true, data: monsters });
}));

/**
 * GET /api/content/bestiary/:slug
 * Get a monster by slug
 */
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const monster = await monsterService.getMonsterBySlug(slug);

  if (!monster) {
    throw ApiError.notFound('Monster');
  }

  res.json({ success: true, data: monster });
}));

export default router;
