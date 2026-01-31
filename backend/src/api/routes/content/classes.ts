/**
 * Classes Routes
 * T046: Create classes routes (list, detail, subclass)
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../../middleware/error-handler.js';
import classService from '../../../services/content/classService.js';

const router = Router();

/**
 * GET /api/content/classes
 * List all classes
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, sortBy, sortOrder } = req.query;

  const result = await classService.getClasses({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });

  res.json({ success: true, data: result });
}));

/**
 * GET /api/content/classes/:slug
 * Get a class by slug with its subclasses
 */
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const classEntity = await classService.getClassBySlug(slug);

  if (!classEntity) {
    throw ApiError.notFound('Class');
  }

  res.json({ success: true, data: classEntity });
}));

/**
 * GET /api/content/classes/:slug/subclasses
 * Get all subclasses for a class
 */
router.get('/:slug/subclasses', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const subclasses = await classService.getSubclassesByClassSlug(slug);

  res.json({ success: true, data: subclasses });
}));

/**
 * GET /api/content/classes/:classSlug/:subclassSlug
 * Get a specific subclass
 */
router.get('/:classSlug/:subclassSlug', asyncHandler(async (req: Request, res: Response) => {
  const { classSlug, subclassSlug } = req.params;
  const subclass = await classService.getSubclassBySlug(classSlug, subclassSlug);

  if (!subclass) {
    throw ApiError.notFound('Subclass');
  }

  res.json({ success: true, data: subclass });
}));

export default router;
