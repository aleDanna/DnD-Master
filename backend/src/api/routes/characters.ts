/**
 * Character API Routes
 * CRUD operations for player characters
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  validate,
  validateParams,
  createCharacterSchema,
  updateCharacterSchema,
  uuidParamSchema,
} from '../middleware/validation.js';
import { createCharacterRepository } from '../../services/data/character-repo.js';
import { createCampaignRepository } from '../../services/data/campaign-repo.js';
import { createUserClient } from '../../config/supabase.js';
import { z } from 'zod';

const router = Router();

// Schema for character ID param
const characterIdSchema = z.object({
  id: z.string().uuid('Invalid character ID'),
});

// Schema for campaign ID in params
const campaignIdParamSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID'),
});

/**
 * GET /api/characters
 * List all characters owned by the authenticated user
 */
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const client = createUserClient(req.accessToken!);
      const repo = createCharacterRepository(client);

      const characters = await repo.listByUser(req.user!.id);

      res.json({
        success: true,
        data: characters,
      });
    } catch (error) {
      console.error('Error listing characters:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list characters',
        },
      });
    }
  }
);

/**
 * GET /api/characters/campaign/:campaignId
 * List all characters in a campaign
 */
router.get(
  '/campaign/:campaignId',
  authMiddleware,
  validateParams(campaignIdParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const client = createUserClient(req.accessToken!);
      const characterRepo = createCharacterRepository(client);
      const campaignRepo = createCampaignRepository(client);

      // Check if user is a member of the campaign
      const isMember = await campaignRepo.isMember(campaignId, req.user!.id);
      if (!isMember) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Campaign not found',
          },
        });
        return;
      }

      const characters = await characterRepo.listByCampaign(campaignId);

      res.json({
        success: true,
        data: characters,
      });
    } catch (error) {
      console.error('Error listing campaign characters:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list characters',
        },
      });
    }
  }
);

/**
 * GET /api/characters/:id
 * Get a specific character by ID
 */
router.get(
  '/:id',
  authMiddleware,
  validateParams(characterIdSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const characterRepo = createCharacterRepository(client);
      const campaignRepo = createCampaignRepository(client);

      const character = await characterRepo.getById(id);

      if (!character) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Character not found',
          },
        });
        return;
      }

      // Check if user can view this character (owns it or is in the same campaign)
      const isMember = await campaignRepo.isMember(character.campaign_id, req.user!.id);
      if (!isMember) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Character not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          ...character,
          isOwner: character.user_id === req.user!.id,
        },
      });
    } catch (error) {
      console.error('Error getting character:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get character',
        },
      });
    }
  }
);

/**
 * POST /api/characters
 * Create a new character
 */
router.post(
  '/',
  authMiddleware,
  validate(createCharacterSchema),
  async (req: Request, res: Response) => {
    try {
      const client = createUserClient(req.accessToken!);
      const characterRepo = createCharacterRepository(client);
      const campaignRepo = createCampaignRepository(client);

      // Check if user is a member of the campaign
      const isMember = await campaignRepo.isMember(req.body.campaign_id, req.user!.id);
      if (!isMember) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You must be a member of the campaign to create a character',
          },
        });
        return;
      }

      // Check if user already has a character in this campaign
      const existingCharacter = await characterRepo.getByUserAndCampaign(
        req.user!.id,
        req.body.campaign_id
      );
      if (existingCharacter) {
        res.status(400).json({
          success: false,
          error: {
            code: 'ALREADY_HAS_CHARACTER',
            message: 'You already have a character in this campaign',
          },
        });
        return;
      }

      const character = await characterRepo.create(req.body, req.user!.id);

      res.status(201).json({
        success: true,
        data: character,
      });
    } catch (error) {
      console.error('Error creating character:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create character',
        },
      });
    }
  }
);

/**
 * PATCH /api/characters/:id
 * Update a character
 */
router.patch(
  '/:id',
  authMiddleware,
  validateParams(characterIdSchema),
  validate(updateCharacterSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const repo = createCharacterRepository(client);

      // Only owner can update
      const isOwner = await repo.isOwner(id, req.user!.id);
      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only the character owner can update it',
          },
        });
        return;
      }

      const character = await repo.update(id, req.body);

      res.json({
        success: true,
        data: character,
      });
    } catch (error) {
      console.error('Error updating character:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update character',
        },
      });
    }
  }
);

/**
 * DELETE /api/characters/:id
 * Delete a character
 */
router.delete(
  '/:id',
  authMiddleware,
  validateParams(characterIdSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const repo = createCharacterRepository(client);

      // Only owner can delete
      const isOwner = await repo.isOwner(id, req.user!.id);
      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only the character owner can delete it',
          },
        });
        return;
      }

      await repo.delete(id);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting character:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete character',
        },
      });
    }
  }
);

/**
 * PATCH /api/characters/:id/hp
 * Update character HP (quick endpoint for combat)
 */
router.patch(
  '/:id/hp',
  authMiddleware,
  validateParams(characterIdSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { current_hp, max_hp } = req.body;

      if (current_hp === undefined) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'current_hp is required',
          },
        });
        return;
      }

      const client = createUserClient(req.accessToken!);
      const characterRepo = createCharacterRepository(client);
      const campaignRepo = createCampaignRepository(client);

      // Get character to check campaign membership
      const character = await characterRepo.getById(id);
      if (!character) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Character not found',
          },
        });
        return;
      }

      // Check if user is a member of the campaign (DM or character owner can update HP)
      const isMember = await campaignRepo.isMember(character.campaign_id, req.user!.id);
      if (!isMember) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only campaign members can update character HP',
          },
        });
        return;
      }

      const updatedCharacter = await characterRepo.updateHp(id, current_hp, max_hp);

      res.json({
        success: true,
        data: updatedCharacter,
      });
    } catch (error) {
      console.error('Error updating character HP:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update character HP',
        },
      });
    }
  }
);

export default router;
