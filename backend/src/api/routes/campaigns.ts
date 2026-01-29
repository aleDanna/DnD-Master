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
import { createCampaignPlayerRepository } from '../../services/data/campaign-player-repo.js';
import { createUserClient } from '../../config/supabase.js';
import { z } from 'zod';

const router = Router();

// Validation schemas for invite endpoints
const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['player', 'dm']).optional().default('player'),
});

const joinWithTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

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

/**
 * POST /api/campaigns/:id/invite
 * Send an invitation to join a campaign
 */
router.post(
  '/:id/invite',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Validate request body
      const validation = inviteSchema.safeParse(req.body);
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

      const { email, role } = validation.data;
      const client = createUserClient(req.accessToken!);
      const campaignRepo = createCampaignRepository(client);
      const playerRepo = createCampaignPlayerRepository(client);

      // Only owner can invite
      const isOwner = await campaignRepo.isOwner(id, req.user!.id);
      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only the campaign owner can send invitations',
          },
        });
        return;
      }

      // Create invite
      const invite = await playerRepo.createInvite({
        campaign_id: id,
        email,
        role,
        invited_by: req.user!.id,
      });

      res.status(201).json({
        success: true,
        data: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expires_at: invite.expires_at,
          invite_url: `/campaigns/join/${invite.token}`,
        },
      });
    } catch (error) {
      console.error('Error creating invite:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create invitation',
        },
      });
    }
  }
);

/**
 * GET /api/campaigns/:id/invites
 * List pending invitations for a campaign
 */
router.get(
  '/:id/invites',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const campaignRepo = createCampaignRepository(client);
      const playerRepo = createCampaignPlayerRepository(client);

      // Only owner can view invites
      const isOwner = await campaignRepo.isOwner(id, req.user!.id);
      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only the campaign owner can view invitations',
          },
        });
        return;
      }

      const invites = await playerRepo.getPendingInvites(id);

      res.json({
        success: true,
        data: invites.map(inv => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          created_at: inv.created_at,
          expires_at: inv.expires_at,
        })),
      });
    } catch (error) {
      console.error('Error listing invites:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list invitations',
        },
      });
    }
  }
);

/**
 * DELETE /api/campaigns/:id/invites/:inviteId
 * Revoke an invitation
 */
router.delete(
  '/:id/invites/:inviteId',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id, inviteId } = req.params;
      const client = createUserClient(req.accessToken!);
      const campaignRepo = createCampaignRepository(client);
      const playerRepo = createCampaignPlayerRepository(client);

      // Only owner can revoke invites
      const isOwner = await campaignRepo.isOwner(id, req.user!.id);
      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only the campaign owner can revoke invitations',
          },
        });
        return;
      }

      await playerRepo.revokeInvite(inviteId);

      res.status(204).send();
    } catch (error) {
      console.error('Error revoking invite:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to revoke invitation',
        },
      });
    }
  }
);

/**
 * POST /api/campaigns/join/:token
 * Accept an invitation to join a campaign
 */
router.post(
  '/join/:token',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const client = createUserClient(req.accessToken!);
      const playerRepo = createCampaignPlayerRepository(client);

      // Accept invite
      const player = await playerRepo.acceptInvite(token, req.user!.id);

      res.status(201).json({
        success: true,
        data: {
          campaign_id: player.campaign_id,
          role: player.role,
          joined_at: player.joined_at,
        },
      });
    } catch (error) {
      console.error('Error accepting invite:', error);

      const message = error instanceof Error ? error.message : 'Failed to accept invitation';
      const code =
        message.includes('not found') ? 'NOT_FOUND' :
        message.includes('expired') ? 'EXPIRED' :
        message.includes('already been used') ? 'ALREADY_USED' :
        'INTERNAL_ERROR';

      res.status(code === 'INTERNAL_ERROR' ? 500 : 400).json({
        success: false,
        error: {
          code,
          message,
        },
      });
    }
  }
);

/**
 * GET /api/campaigns/:id/players
 * List players in a campaign
 */
router.get(
  '/:id/players',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const campaignRepo = createCampaignRepository(client);
      const playerRepo = createCampaignPlayerRepository(client);

      // Check membership
      const isMember = await campaignRepo.isMember(id, req.user!.id);
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

      const players = await playerRepo.listByCampaign(id);

      res.json({
        success: true,
        data: players.map(p => ({
          id: p.id,
          user_id: p.user_id,
          role: p.role,
          joined_at: p.joined_at,
          user: p.user ? {
            id: p.user.id,
            name: p.user.name,
          } : undefined,
        })),
      });
    } catch (error) {
      console.error('Error listing players:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list players',
        },
      });
    }
  }
);

/**
 * DELETE /api/campaigns/:id/players/:userId
 * Remove a player from a campaign (owner only)
 */
router.delete(
  '/:id/players/:userId',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id, userId } = req.params;
      const client = createUserClient(req.accessToken!);
      const campaignRepo = createCampaignRepository(client);
      const playerRepo = createCampaignPlayerRepository(client);

      // Only owner can remove players
      const isOwner = await campaignRepo.isOwner(id, req.user!.id);
      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only the campaign owner can remove players',
          },
        });
        return;
      }

      // Cannot remove owner
      const campaign = await campaignRepo.getById(id);
      if (campaign?.owner_id === userId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_REMOVE_OWNER',
            message: 'Cannot remove the campaign owner',
          },
        });
        return;
      }

      await playerRepo.removePlayer(id, userId);

      res.status(204).send();
    } catch (error) {
      console.error('Error removing player:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove player',
        },
      });
    }
  }
);

export default router;
