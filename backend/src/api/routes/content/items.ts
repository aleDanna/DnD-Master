/**
 * Items Routes
 * T050: Create items routes (list with filters, detail)
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../../middleware/error-handler.js';
import itemService from '../../../services/content/itemService.js';

const router = Router();

/**
 * GET /api/content/items
 * List items with optional filters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    page, pageSize, sortBy, sortOrder,
    type, subtype, rarity
  } = req.query;

  const result = await itemService.getItems({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    type: type as string,
    subtype: subtype as string,
    rarity: rarity as string,
  });

  res.json({ success: true, data: result });
}));

/**
 * GET /api/content/items/types
 * Get all item types
 */
router.get('/types', asyncHandler(async (_req: Request, res: Response) => {
  const types = await itemService.getItemTypes();
  res.json({ success: true, data: types });
}));

/**
 * GET /api/content/items/rarities
 * Get all item rarities
 */
router.get('/rarities', asyncHandler(async (_req: Request, res: Response) => {
  const rarities = await itemService.getItemRarities();
  res.json({ success: true, data: rarities });
}));

/**
 * GET /api/content/items/type/:type
 * Get items by type
 */
router.get('/type/:type', asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const items = await itemService.getItemsByType(type);
  res.json({ success: true, data: items });
}));

/**
 * GET /api/content/items/rarity/:rarity
 * Get items by rarity
 */
router.get('/rarity/:rarity', asyncHandler(async (req: Request, res: Response) => {
  const { rarity } = req.params;
  const items = await itemService.getItemsByRarity(rarity);
  res.json({ success: true, data: items });
}));

/**
 * GET /api/content/items/:slug
 * Get an item by slug
 */
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const item = await itemService.getItemBySlug(slug);

  if (!item) {
    throw ApiError.notFound('Item');
  }

  res.json({ success: true, data: item });
}));

export default router;
