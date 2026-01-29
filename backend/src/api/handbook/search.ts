// Search API Routes - T053 (created early for index.ts import)
// Unified search and context endpoints

import { Router, Request, Response, NextFunction } from 'express';
import {
  hybridSearch,
  getContext,
  ContentType,
} from '../../services/handbook/searchService.js';

const router = Router();

/**
 * GET /api/handbook/search
 * Unified search across all handbook content
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, type, limit = 20 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const types = type
      ? (Array.isArray(type) ? type : [type]) as ContentType[]
      : undefined;

    const result = await hybridSearch(q, {
      types,
      limit: Number(limit),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/handbook/context
 * Get relevant content for AI DM context injection
 */
router.get('/context', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const citations = await getContext(q, Number(limit));

    res.json(citations);
  } catch (error) {
    next(error);
  }
});

export default router;
