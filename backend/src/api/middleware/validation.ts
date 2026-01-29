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

// Character validation schemas
const skillProficiencySchema = z.record(z.object({
  proficient: z.boolean(),
  expertise: z.boolean(),
  bonus: z.number(),
})).optional();

const equipmentItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
  equipped: z.boolean(),
  description: z.string().optional(),
});

const spellSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().int().min(0).max(9),
  prepared: z.boolean(),
});

const featureSchema = z.object({
  name: z.string(),
  source: z.string(),
  description: z.string(),
});

export const createCharacterSchema = z.object({
  campaign_id: z.string().uuid('Invalid campaign ID'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  race: z.string().min(1, 'Race is required').max(50),
  class: z.string().min(1, 'Class is required').max(50),
  level: z.number().int().min(1).max(20).optional().default(1),
  max_hp: z.number().int().positive('Max HP must be positive'),
  current_hp: z.number().int().min(0, 'Current HP cannot be negative'),
  armor_class: z.number().int().min(1).max(30),
  speed: z.number().int().positive().optional().default(30),
  strength: z.number().int().min(1).max(30),
  dexterity: z.number().int().min(1).max(30),
  constitution: z.number().int().min(1).max(30),
  intelligence: z.number().int().min(1).max(30),
  wisdom: z.number().int().min(1).max(30),
  charisma: z.number().int().min(1).max(30),
  skills: skillProficiencySchema,
  proficiencies: z.array(z.string()).optional(),
  equipment: z.array(equipmentItemSchema).optional(),
  spells: z.array(spellSchema).optional(),
  features: z.array(featureSchema).optional(),
  notes: z.string().max(5000).optional(),
});

export const updateCharacterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  race: z.string().min(1).max(50).optional(),
  class: z.string().min(1).max(50).optional(),
  level: z.number().int().min(1).max(20).optional(),
  max_hp: z.number().int().positive().optional(),
  current_hp: z.number().int().min(0).optional(),
  armor_class: z.number().int().min(1).max(30).optional(),
  speed: z.number().int().positive().optional(),
  strength: z.number().int().min(1).max(30).optional(),
  dexterity: z.number().int().min(1).max(30).optional(),
  constitution: z.number().int().min(1).max(30).optional(),
  intelligence: z.number().int().min(1).max(30).optional(),
  wisdom: z.number().int().min(1).max(30).optional(),
  charisma: z.number().int().min(1).max(30).optional(),
  skills: skillProficiencySchema,
  proficiencies: z.array(z.string()).optional(),
  equipment: z.array(equipmentItemSchema).optional(),
  spells: z.array(spellSchema).optional(),
  features: z.array(featureSchema).optional(),
  notes: z.string().max(5000).optional(),
});
