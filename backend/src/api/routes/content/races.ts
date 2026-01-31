/**
 * Races Routes
 * T047: Create races routes (list, detail, subrace)
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../../middleware/error-handler.js';
import raceService from '../../../services/content/raceService.js';

const router = Router();

/**
 * GET /api/content/races
 * List all races
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, sortBy, sortOrder } = req.query;

  const result = await raceService.getRaces({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });

  res.json({ success: true, data: result });
}));

/**
 * GET /api/content/races/:slug
 * Get a race by slug with its subraces
 */
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const race = await raceService.getRaceBySlug(slug);

  if (!race) {
    throw ApiError.notFound('Race');
  }

  res.json({ success: true, data: race });
}));

/**
 * GET /api/content/races/:slug/subraces
 * Get all subraces for a race
 */
router.get('/:slug/subraces', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const subraces = await raceService.getSubracesByRaceSlug(slug);

  res.json({ success: true, data: subraces });
}));

/**
 * GET /api/content/races/:raceSlug/:subraceSlug
 * Get a specific subrace
 */
router.get('/:raceSlug/:subraceSlug', asyncHandler(async (req: Request, res: Response) => {
  const { raceSlug, subraceSlug } = req.params;
  const subrace = await raceService.getSubraceBySlug(raceSlug, subraceSlug);

  if (!subrace) {
    throw ApiError.notFound('Subrace');
  }

  res.json({ success: true, data: subrace });
}));

export default router;
