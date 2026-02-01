/**
 * Search Routes
 * T102: Create GET /api/search endpoint (full-text mode)
 * T122: Add semantic search mode to GET /api/search endpoint
 */

import { Router, Request, Response, NextFunction } from 'express';
import { fullTextSearch } from '../../services/search/fullTextSearchService.js';
import { semanticSearch } from '../../services/search/semanticSearchService.js';
import { ContentCategory } from '../../types/search.types.js';

const router = Router();

interface SearchQuery {
  q?: string;
  type?: 'full-text' | 'semantic' | 'hybrid';
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

    // Perform search based on mode
    let results;
    if (type === 'hybrid') {
      // Hybrid search: combine full-text and semantic results
      const [fullTextResults, semanticResults] = await Promise.all([
        fullTextSearch({
          query: q,
          categories: categoryList,
          limit: Math.ceil(searchLimit / 2),
        }),
        semanticSearch({
          query: q,
          categories: categoryList,
          limit: Math.ceil(searchLimit / 2),
        }),
      ]);

      // Merge and deduplicate results
      const seenIds = new Set<string>();
      const mergedGroups = new Map<string, typeof fullTextResults.groups[0]>();

      // Add full-text results first (higher priority for exact matches)
      for (const group of fullTextResults.groups) {
        const existing = mergedGroups.get(group.category) || {
          ...group,
          items: [],
          totalCount: 0,
        };
        for (const item of group.items) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            existing.items.push(item);
            existing.totalCount++;
          }
        }
        mergedGroups.set(group.category, existing);
      }

      // Add semantic results
      for (const group of semanticResults.groups) {
        const existing = mergedGroups.get(group.category) || {
          ...group,
          items: [],
          totalCount: 0,
        };
        for (const item of group.items) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            existing.items.push(item);
            existing.totalCount++;
          }
        }
        mergedGroups.set(group.category, existing);
      }

      results = {
        query: q,
        mode: 'hybrid' as const,
        totalResults: seenIds.size,
        groups: Array.from(mergedGroups.values()),
      };
    } else if (type === 'semantic') {
      // Semantic search with fallback to full-text
      results = await semanticSearch({
        query: q,
        categories: categoryList,
        limit: searchLimit,
      });
    } else {
      // Full-text search (default)
      results = await fullTextSearch({
        query: q,
        categories: categoryList,
        limit: searchLimit,
      });
    }

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
