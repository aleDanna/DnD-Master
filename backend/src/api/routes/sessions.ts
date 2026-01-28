/**
 * Session API Routes
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  validate,
  validateParams,
  createSessionSchema,
  uuidParamSchema,
} from '../middleware/validation.js';
import { createSessionRepository } from '../../services/data/session-repo.js';
import { createCampaignRepository } from '../../services/data/campaign-repo.js';
import { createUserClient } from '../../config/supabase.js';

const router = Router();

/**
 * GET /api/sessions/:id
 * Get a specific session by ID
 */
router.get(
  '/:id',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const sessionRepo = createSessionRepository(client);
      const campaignRepo = createCampaignRepository(client);

      const session = await sessionRepo.getWithCampaign(id);

      if (!session) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Session not found',
          },
        });
        return;
      }

      // Check campaign membership
      const isMember = await campaignRepo.isMember(session.campaign_id, req.user!.id);
      if (!isMember) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Session not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error('Error getting session:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get session',
        },
      });
    }
  }
);

/**
 * POST /api/sessions
 * Create a new session for a campaign
 */
router.post(
  '/',
  authMiddleware,
  validate(createSessionSchema),
  async (req: Request, res: Response) => {
    try {
      const { campaign_id, name } = req.body;
      const client = createUserClient(req.accessToken!);
      const sessionRepo = createSessionRepository(client);
      const campaignRepo = createCampaignRepository(client);

      // Check campaign membership
      const isMember = await campaignRepo.isMember(campaign_id, req.user!.id);
      if (!isMember) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not a member of this campaign',
          },
        });
        return;
      }

      // Check for existing active session
      const activeSession = await sessionRepo.getActiveSession(campaign_id);
      if (activeSession) {
        res.status(400).json({
          success: false,
          error: {
            code: 'ACTIVE_SESSION_EXISTS',
            message: 'An active session already exists for this campaign',
            data: { sessionId: activeSession.id },
          },
        });
        return;
      }

      const session = await sessionRepo.create({ campaign_id, name });

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create session',
        },
      });
    }
  }
);

/**
 * GET /api/campaigns/:campaignId/sessions
 * List sessions for a campaign
 */
router.get(
  '/campaign/:campaignId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const client = createUserClient(req.accessToken!);
      const sessionRepo = createSessionRepository(client);
      const campaignRepo = createCampaignRepository(client);

      // Check campaign membership
      const isMember = await campaignRepo.isMember(campaignId, req.user!.id);
      if (!isMember) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not a member of this campaign',
          },
        });
        return;
      }

      const sessions = await sessionRepo.listByCampaign(campaignId);

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      console.error('Error listing sessions:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list sessions',
        },
      });
    }
  }
);

/**
 * GET /api/campaigns/:campaignId/sessions/active
 * Get active session for a campaign
 */
router.get(
  '/campaign/:campaignId/active',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const client = createUserClient(req.accessToken!);
      const sessionRepo = createSessionRepository(client);
      const campaignRepo = createCampaignRepository(client);

      // Check campaign membership
      const isMember = await campaignRepo.isMember(campaignId, req.user!.id);
      if (!isMember) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not a member of this campaign',
          },
        });
        return;
      }

      const session = await sessionRepo.getActiveSession(campaignId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NO_ACTIVE_SESSION',
            message: 'No active session for this campaign',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error('Error getting active session:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get active session',
        },
      });
    }
  }
);

/**
 * POST /api/sessions/:id/pause
 * Pause a session
 */
router.post(
  '/:id/pause',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const sessionRepo = createSessionRepository(client);

      const session = await sessionRepo.pauseSession(id);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error('Error pausing session:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to pause session',
        },
      });
    }
  }
);

/**
 * POST /api/sessions/:id/resume
 * Resume a paused session
 */
router.post(
  '/:id/resume',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const sessionRepo = createSessionRepository(client);

      const session = await sessionRepo.resumeSession(id);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error('Error resuming session:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to resume session',
        },
      });
    }
  }
);

/**
 * POST /api/sessions/:id/end
 * End a session
 */
router.post(
  '/:id/end',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = createUserClient(req.accessToken!);
      const sessionRepo = createSessionRepository(client);

      const session = await sessionRepo.endSession(id);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error('Error ending session:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to end session',
        },
      });
    }
  }
);

export default router;
