/**
 * Skills Routes
 * T054: Create skills routes
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../../middleware/error-handler.js';
import skillService from '../../../services/content/skillService.js';

const router = Router();

/**
 * GET /api/content/skills
 * List all skills
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, sortBy, sortOrder } = req.query;

  const result = await skillService.getSkills({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });

  res.json({ success: true, data: result });
}));

/**
 * GET /api/content/skills/abilities
 * Get all abilities used by skills
 */
router.get('/abilities', asyncHandler(async (_req: Request, res: Response) => {
  const abilities = await skillService.getAbilities();
  res.json({ success: true, data: abilities });
}));

/**
 * GET /api/content/skills/grouped
 * Get skills grouped by ability
 */
router.get('/grouped', asyncHandler(async (_req: Request, res: Response) => {
  const grouped = await skillService.getSkillsByAbilityGrouped();
  res.json({ success: true, data: grouped });
}));

/**
 * GET /api/content/skills/ability/:ability
 * Get skills by ability
 */
router.get('/ability/:ability', asyncHandler(async (req: Request, res: Response) => {
  const { ability } = req.params;
  const skills = await skillService.getSkillsByAbility(ability);
  res.json({ success: true, data: skills });
}));

/**
 * GET /api/content/skills/:slug
 * Get a skill by slug
 */
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const skill = await skillService.getSkillBySlug(slug);

  if (!skill) {
    throw ApiError.notFound('Skill');
  }

  res.json({ success: true, data: skill });
}));

export default router;
