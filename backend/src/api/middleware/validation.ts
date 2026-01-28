import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Generic validation middleware factory using Zod
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate URL parameters
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid URL parameters',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}

// Common validation schemas
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Campaign validation schemas
export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  dice_mode: z.enum(['rng', 'player_entered']).optional(),
  map_mode: z.enum(['grid_2d', 'narrative_only']).optional(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  dice_mode: z.enum(['rng', 'player_entered']).optional(),
  map_mode: z.enum(['grid_2d', 'narrative_only']).optional(),
});

// Session validation schemas
export const createSessionSchema = z.object({
  campaign_id: z.string().uuid('Invalid campaign ID'),
  name: z.string().max(100).optional(),
});

// Game action validation
export const gameActionSchema = z.object({
  action: z.string().min(1, 'Action is required').max(2000, 'Action too long'),
  character_id: z.string().uuid().optional(),
});

// Dice roll validation
export const diceRollSchema = z.object({
  dice: z.string().regex(/^\d+d\d+([+-]\d+)?$/, 'Invalid dice notation (e.g., 1d20+5)'),
  reason: z.string().max(200).optional(),
  value: z.number().int().positive().optional(), // For player-entered mode
});
