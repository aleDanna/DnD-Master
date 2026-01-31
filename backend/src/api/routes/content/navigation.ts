/**
 * Navigation Routes
 * T033: Create GET /api/rules/tree endpoint
 *
 * Provides navigation tree for Rules Explorer sidebar
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { getNavigationTree } from '../../../services/content/navigationService.js';

const router = Router();

/**
 * GET /api/content/navigation/tree
 * Returns the complete navigation tree for the Rules Explorer sidebar
 */
router.get('/tree', asyncHandler(async (_req: Request, res: Response) => {
  const tree = await getNavigationTree();

  res.json({
    success: true,
    data: tree,
  });
}));

export default router;
