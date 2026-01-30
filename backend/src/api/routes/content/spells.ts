/**
 * Spells Routes
 * T048: Create spells routes (list with filters, detail)
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../../middleware/error-handler.js';
import spellService from '../../../services/content/spellService.js';

const router = Router();

/**
 * GET /api/content/spells
 * List spells with optional filters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    page, pageSize, sortBy, sortOrder,
    level, school, class: classSlug, concentration, ritual
  } = req.query;

  const result = await spellService.getSpells({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    level: level ? parseInt(level as string, 10) : undefined,
    school: school as string,
    classSlug: classSlug as string,
    concentration: concentration === 'true' ? true : concentration === 'false' ? false : undefined,
    ritual: ritual === 'true' ? true : ritual === 'false' ? false : undefined,
  });

  res.json({ success: true, data: result });
}));

/**
 * GET /api/content/spells/level/:level
 * Get spells by level
 */
router.get('/level/:level', asyncHandler(async (req: Request, res: Response) => {
  const level = parseInt(req.params.level, 10);

  if (isNaN(level) || level < 0 || level > 9) {
    throw ApiError.badRequest('Level must be between 0 and 9');
  }

  const spells = await spellService.getSpellsByLevel(level);
  res.json({ success: true, data: spells });
}));

/**
 * GET /api/content/spells/school/:school
 * Get spells by school
 */
router.get('/school/:school', asyncHandler(async (req: Request, res: Response) => {
  const { school } = req.params;
  const spells = await spellService.getSpellsBySchool(school);
  res.json({ success: true, data: spells });
}));

/**
 * GET /api/content/spells/class/:classSlug
 * Get spells available to a class
 */
router.get('/class/:classSlug', asyncHandler(async (req: Request, res: Response) => {
  const { classSlug } = req.params;
  const spells = await spellService.getSpellsByClass(classSlug);
  res.json({ success: true, data: spells });
}));

/**
 * GET /api/content/spells/:slug
 * Get a spell by slug
 */
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const spell = await spellService.getSpellBySlug(slug);

  if (!spell) {
    throw ApiError.notFound('Spell');
  }

  res.json({ success: true, data: spell });
}));

export default router;
