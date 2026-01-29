/**
 * Rules Explorer API Routes
 * Endpoints for browsing, searching, and managing D&D rules
 *
 * Tasks: T025-T033, T035-T038
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/adminAuth.js';
import { validateParams, validateQuery } from '../middleware/validation.js';
import { createRulesService } from '../../services/rules/service.js';
import { createSearchService } from '../../services/rules/search.js';
import { createIngestionService } from '../../services/rules/ingestion.js';
import { SearchMode, FileType } from '../../models/rules.types.js';

const router = Router();

// Configure multer for file uploads (in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  },
});

// ============== Validation Schemas ==============

const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

const documentIdParamSchema = z.object({
  documentId: z.string().uuid('Invalid document ID format'),
});

const chapterIdParamSchema = z.object({
  chapterId: z.string().uuid('Invalid chapter ID format'),
});

const sectionIdParamSchema = z.object({
  sectionId: z.string().uuid('Invalid section ID format'),
});

const entryIdParamSchema = z.object({
  entryId: z.string().uuid('Invalid entry ID format'),
});

const categoryIdParamSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID format'),
});

const searchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters').max(500),
  mode: z.enum(['fulltext', 'semantic', 'hybrid']).optional().default('hybrid'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  documentId: z.string().uuid().optional(),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

// ============== Browsing Endpoints (T026-T032) ==============

/**
 * GET /api/rules/documents
 * List all source documents
 */
router.get(
  '/documents',
  authMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const service = createRulesService();

      const documents = await service.getDocuments();

      res.json({
        success: true,
        data: {
          documents,
        },
      });
    } catch (error) {
      console.error('Error listing documents:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list documents',
        },
      });
    }
  }
);

/**
 * GET /api/rules/documents/:documentId/chapters
 * List chapters in a document
 */
router.get(
  '/documents/:documentId/chapters',
  authMiddleware,
  validateParams(documentIdParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      const service = createRulesService();

      // Check if document exists
      const document = await service.getDocument(documentId);
      if (!document) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Document not found',
          },
        });
        return;
      }

      const chapters = await service.getChapters(documentId);

      res.json({
        success: true,
        data: {
          chapters,
        },
      });
    } catch (error) {
      console.error('Error listing chapters:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list chapters',
        },
      });
    }
  }
);

/**
 * GET /api/rules/chapters/:chapterId/sections
 * List sections in a chapter
 */
router.get(
  '/chapters/:chapterId/sections',
  authMiddleware,
  validateParams(chapterIdParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { chapterId } = req.params;
      const service = createRulesService();

      // Check if chapter exists
      const chapter = await service.getChapter(chapterId);
      if (!chapter) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Chapter not found',
          },
        });
        return;
      }

      const sections = await service.getSections(chapterId);

      res.json({
        success: true,
        data: {
          sections,
        },
      });
    } catch (error) {
      console.error('Error listing sections:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list sections',
        },
      });
    }
  }
);

/**
 * GET /api/rules/sections/:sectionId/entries
 * List entries in a section
 */
router.get(
  '/sections/:sectionId/entries',
  authMiddleware,
  validateParams(sectionIdParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { sectionId } = req.params;
      const service = createRulesService();

      // Check if section exists
      const section = await service.getSection(sectionId);
      if (!section) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Section not found',
          },
        });
        return;
      }

      const entries = await service.getEntries(sectionId);

      res.json({
        success: true,
        data: {
          entries,
        },
      });
    } catch (error) {
      console.error('Error listing entries:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list entries',
        },
      });
    }
  }
);

/**
 * GET /api/rules/entries/:entryId
 * Get a single rule entry with full context
 */
router.get(
  '/entries/:entryId',
  authMiddleware,
  validateParams(entryIdParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { entryId } = req.params;
      const service = createRulesService();

      const entry = await service.getEntry(entryId);

      if (!entry) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Entry not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      console.error('Error getting entry:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get entry',
        },
      });
    }
  }
);

/**
 * GET /api/rules/categories
 * List all rule categories
 */
router.get(
  '/categories',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const service = createRulesService();

      const categories = await service.getCategories();

      res.json({
        success: true,
        data: {
          categories,
        },
      });
    } catch (error) {
      console.error('Error listing categories:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list categories',
        },
      });
    }
  }
);

/**
 * GET /api/rules/categories/:categoryId/entries
 * List entries in a category with pagination
 */
router.get(
  '/categories/:categoryId/entries',
  authMiddleware,
  validateParams(categoryIdParamSchema),
  validateQuery(paginationSchema),
  async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      const { limit, offset } = req.query as unknown as { limit: number; offset: number };
      const service = createRulesService();

      const result = await service.getEntriesByCategory(categoryId, { limit, offset });

      res.json({
        success: true,
        data: {
          entries: result.entries,
          total: result.total,
        },
      });
    } catch (error) {
      console.error('Error listing entries by category:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list entries',
        },
      });
    }
  }
);

// ============== Search Endpoint (T033) ==============

/**
 * GET /api/rules/search
 * Search rules using full-text, semantic, or hybrid mode
 */
router.get(
  '/search',
  authMiddleware,
  validateQuery(searchQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { q, mode, limit, offset, documentId } = req.query as unknown as {
        q: string;
        mode: SearchMode;
        limit: number;
        offset: number;
        documentId?: string;
      };

      const searchService = createSearchService();

      const result = await searchService.search({
        query: q,
        mode,
        limit,
        offset,
        documentId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error searching rules:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search rules',
        },
      });
    }
  }
);

// ============== Admin Endpoints (T035-T038) ==============

/**
 * POST /api/admin/rules/ingest
 * Ingest a new document (admin only)
 */
router.post(
  '/admin/ingest',
  authMiddleware,
  adminMiddleware,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No file uploaded',
          },
        });
        return;
      }

      const name = req.body.name;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Document name is required',
          },
        });
        return;
      }

      // Determine file type
      const fileType: FileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'txt';

      const ingestionService = createIngestionService();

      // Start ingestion (async operation)
      const documentId = await ingestionService.ingestDocument(
        req.file.buffer,
        name.trim(),
        fileType,
        req.user!.id
      );

      res.status(202).json({
        success: true,
        data: {
          documentId,
          status: 'processing',
          message: 'Document ingestion started',
        },
      });
    } catch (error) {
      console.error('Error ingesting document:', error);

      // Check for duplicate document
      if (error instanceof Error && error.message.startsWith('DUPLICATE:')) {
        const existingId = error.message.split(':')[1];
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_DOCUMENT',
            message: 'A document with the same content already exists',
            existingDocumentId: existingId,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to ingest document',
        },
      });
    }
  }
);

/**
 * GET /api/admin/rules/ingest/:id/status
 * Get ingestion status (admin only)
 */
router.get(
  '/admin/ingest/:id/status',
  authMiddleware,
  adminMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ingestionService = createIngestionService();

      const status = await ingestionService.getIngestionStatus(id);

      if (!status) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Document not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error('Error getting ingestion status:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get ingestion status',
        },
      });
    }
  }
);

/**
 * DELETE /api/admin/rules/ingest/:id
 * Delete an ingested document (admin only)
 */
router.delete(
  '/admin/ingest/:id',
  authMiddleware,
  adminMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ingestionService = createIngestionService();

      await ingestionService.deleteDocument(id);

      res.json({
        success: true,
        data: {
          message: 'Document deleted successfully',
        },
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete document',
        },
      });
    }
  }
);

/**
 * POST /api/admin/rules/categories
 * Create a new category (admin only)
 */
router.post(
  '/admin/categories',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const validation = createCategorySchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
          },
        });
        return;
      }

      const { name, description } = validation.data;
      const service = createRulesService();

      const category = await service.createCategory(name, description || null, req.user!.id);

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      console.error('Error creating category:', error);

      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_CATEGORY',
            message: 'Category name already exists',
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create category',
        },
      });
    }
  }
);

export default router;
