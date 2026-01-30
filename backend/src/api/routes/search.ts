/**
 * Search Routes
 * T102: Create GET /api/search endpoint (full-text mode)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { fullTextSearch } from '../../services/search/fullTextSearchService.js';
import { ContentCategory } from '../../types/search.types.js';

const router = Router();

interface SearchQuery {
  q?: string;
  type?: 'full-text' | 'semantic';
  categories?: string;
  limit?: string;
}

/**
 * GET /api/search
 * Full-text search across all content
 */
router.get('/', async (req: Request<{}, {}, {}, SearchQuery>, res: Response, next: NextFunction) => {
  try {
    const { q, type = 'full-text', categories, limit } = req.query;

    if (!q || !q.trim()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Search query is required',
        },
      });
      return;
    }

    // Parse categories if provided
    let categoryList: ContentCategory[] | undefined;
    if (categories) {
      categoryList = categories.split(',').map(c => c.trim()) as ContentCategory[];
    }

    // Parse limit
    const searchLimit = limit ? parseInt(limit, 10) : 50;

    // Currently only full-text search is implemented
    // Semantic search will be added in Phase 6
    if (type === 'semantic') {
      res.status(501).json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Semantic search is not yet implemented. Use full-text mode.',
        },
      });
      return;
    }

    const results = await fullTextSearch({
      query: q,
      categories: categoryList,
      limit: searchLimit,
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/suggestions
 * Get search suggestions based on partial query
 */
router.get('/suggestions', async (req: Request<{}, {}, {}, { q?: string }>, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      res.json({
        success: true,
        data: { suggestions: [] },
      });
      return;
    }

    // For now, just return quick search results as suggestions
    const results = await fullTextSearch({
      query: q,
      limit: 5,
    });

    const suggestions = results.groups.flatMap(group =>
      group.items.slice(0, 3).map(item => ({
        title: item.title,
        type: item.type,
        category: item.category,
        slug: item.slug,
      }))
    ).slice(0, 8);

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
