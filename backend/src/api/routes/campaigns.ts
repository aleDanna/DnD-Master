/**
 * Campaign API Routes
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  validate,
  validateParams,
  validateQuery,
  createCampaignSchema,
  updateCampaignSchema,
  uuidParamSchema,
  paginationSchema,
} from '../middleware/validation.js';
import { createCampaignRepository } from '../../services/data/campaign-repo.js';
import { createUserClient } from '../../config/supabase.js';

const router = Router();

/**
 * GET /api/campaigns
 * List campaigns for the authenticated user
 */
router.get(
  '/',
  authMiddleware,
  validateQuery(paginationSchema),
  async (req: Request, res: Response) => {
    try {
      const { page, limit } = req.query as { page: number; limit: number };
      const client = createUserClient(req.accessToken!);
      const repo = createCampaignRepository(client);

      const result = await repo.listByUser(req.user!.id, page, limit);

      res.json({
        success: true,
        data: {
          campaigns: result.campaigns,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Error listing campaigns:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list campaigns',
        },
      });
    }
  }
);

/**
 * GET /api/campaigns/:id
 * Get a specific campaign by ID
 */
router.get(
  '/:id',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const repo = createCampaignRepository(client);

      // Check membership
      const isMember = await repo.isMember(id, req.user!.id);
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

      const campaign = await repo.getById(id);

      if (!campaign) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Campaign not found',
          },
        });
        return;
      }

      // Get players
      const players = await repo.getPlayers(id);

      res.json({
        success: true,
        data: {
          ...campaign,
          players,
          isOwner: campaign.owner_id === req.user!.id,
        },
      });
    } catch (error) {
      console.error('Error getting campaign:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get campaign',
        },
      });
    }
  }
);

/**
 * POST /api/campaigns
 * Create a new campaign
 */
router.post(
  '/',
  authMiddleware,
  validate(createCampaignSchema),
  async (req: Request, res: Response) => {
    try {
      const client = createUserClient(req.accessToken!);
      const repo = createCampaignRepository(client);

      const campaign = await repo.create(req.body, req.user!.id);

      res.status(201).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create campaign',
        },
      });
    }
  }
);

/**
 * PATCH /api/campaigns/:id
 * Update a campaign
 */
router.patch(
  '/:id',
  authMiddleware,
  validateParams(uuidParamSchema),
  validate(updateCampaignSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const repo = createCampaignRepository(client);

      // Only owner can update
      const isOwner = await repo.isOwner(id, req.user!.id);
      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only the campaign owner can update it',
          },
        });
        return;
      }

      const campaign = await repo.update(id, req.body);

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update campaign',
        },
      });
    }
  }
);

/**
 * DELETE /api/campaigns/:id
 * Delete a campaign
 */
router.delete(
  '/:id',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const repo = createCampaignRepository(client);

      // Only owner can delete
      const isOwner = await repo.isOwner(id, req.user!.id);
      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only the campaign owner can delete it',
          },
        });
        return;
      }

      await repo.delete(id);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete campaign',
        },
      });
    }
  }
);

/**
 * POST /api/campaigns/:id/join
 * Join a campaign (placeholder for invite system)
 */
router.post(
  '/:id/join',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const repo = createCampaignRepository(client);

      // Check if campaign exists
      const campaign = await repo.getById(id);
      if (!campaign) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Campaign not found',
          },
        });
        return;
      }

      // Check if already a member
      const isMember = await repo.isMember(id, req.user!.id);
      if (isMember) {
        res.status(400).json({
          success: false,
          error: {
            code: 'ALREADY_MEMBER',
            message: 'Already a member of this campaign',
          },
        });
        return;
      }

      // Add as player
      const player = await repo.addPlayer(id, req.user!.id, 'player');

      res.status(201).json({
        success: true,
        data: player,
      });
    } catch (error) {
      console.error('Error joining campaign:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to join campaign',
        },
      });
    }
  }
);

/**
 * POST /api/campaigns/:id/leave
 * Leave a campaign
 */
router.post(
  '/:id/leave',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const repo = createCampaignRepository(client);

      // Owner cannot leave
      const isOwner = await repo.isOwner(id, req.user!.id);
      if (isOwner) {
        res.status(400).json({
          success: false,
          error: {
            code: 'OWNER_CANNOT_LEAVE',
            message: 'Campaign owner cannot leave. Transfer ownership or delete the campaign.',
          },
        });
        return;
      }

      await repo.removePlayer(id, req.user!.id);

      res.status(204).send();
    } catch (error) {
      console.error('Error leaving campaign:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to leave campaign',
        },
      });
    }
  }
);

export default router;
