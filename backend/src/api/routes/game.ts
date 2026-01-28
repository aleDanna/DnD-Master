/**
 * Game API Routes
 * Handles player actions, dice rolls, and event streaming
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  validate,
  validateParams,
  validateQuery,
  gameActionSchema,
  diceRollSchema,
  uuidParamSchema,
} from '../middleware/validation.js';
import { z } from 'zod';
import { createSessionRepository } from '../../services/data/session-repo.js';
import { createEventRepository } from '../../services/data/event-repo.js';
import { createCampaignRepository } from '../../services/data/campaign-repo.js';
import { createDiceService } from '../../services/game/dice-service.js';
import { createStateService } from '../../services/game/state-service.js';
import { createCombatService } from '../../services/game/combat-service.js';
import { createDMService } from '../../services/ai/dm-service.js';
import { createUserClient, supabaseAdmin } from '../../config/supabase.js';
import type { StartCombatInput } from '../../models/combat.js';

const router = Router();

// Query schema for events
const eventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  after: z.coerce.number().int().optional(),
  before: z.coerce.number().int().optional(),
  types: z.string().optional(), // Comma-separated list of event types
});

/**
 * POST /api/sessions/:id/action
 * Submit a player action and get AI DM response
 */
router.post(
  '/:id/action',
  authMiddleware,
  validateParams(uuidParamSchema),
  validate(gameActionSchema),
  async (req: Request, res: Response) => {
    try {
      const { id: sessionId } = req.params;
      const { action, character_id } = req.body;
      const client = createUserClient(req.accessToken!);

      const sessionRepo = createSessionRepository(client);
      const eventRepo = createEventRepository(client);
      const campaignRepo = createCampaignRepository(client);
      const stateService = createStateService(sessionRepo, eventRepo);

      // Check session exists and is active
      const session = await sessionRepo.getById(sessionId);
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

      if (session.status !== 'active') {
        res.status(400).json({
          success: false,
          error: {
            code: 'SESSION_NOT_ACTIVE',
            message: 'Session is not active',
          },
        });
        return;
      }

      // Check campaign membership
      const isMember = await campaignRepo.isMember(session.campaign_id, req.user!.id);
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

      // Create DM service
      const dmService = createDMService({
        sessionRepo,
        eventRepo,
        campaignRepo,
        stateService,
      });

      await dmService.initialize();

      // Process the action
      const response = await dmService.processPlayerAction(
        sessionId,
        req.user!.id,
        req.user!.display_name || req.user!.email,
        action,
        character_id
      );

      // Update session activity
      await sessionRepo.touchSession(sessionId);

      res.json({
        success: true,
        data: {
          narrative: response.narrative,
          mechanics: response.mechanics,
          stateChanges: response.stateChanges,
          requiresRoll: response.requiresRoll,
          ruleCitations: response.ruleCitations,
        },
      });
    } catch (error) {
      console.error('Error processing action:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process action',
        },
      });
    }
  }
);

/**
 * POST /api/sessions/:id/roll
 * Submit a dice roll
 */
router.post(
  '/:id/roll',
  authMiddleware,
  validateParams(uuidParamSchema),
  validate(diceRollSchema),
  async (req: Request, res: Response) => {
    try {
      const { id: sessionId } = req.params;
      const { dice, reason, value } = req.body;
      const client = createUserClient(req.accessToken!);

      const sessionRepo = createSessionRepository(client);
      const eventRepo = createEventRepository(client);
      const campaignRepo = createCampaignRepository(client);

      // Get session and campaign
      const session = await sessionRepo.getWithCampaign(sessionId);
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

      if (session.status !== 'active') {
        res.status(400).json({
          success: false,
          error: {
            code: 'SESSION_NOT_ACTIVE',
            message: 'Session is not active',
          },
        });
        return;
      }

      // Check membership
      const isMember = await campaignRepo.isMember(session.campaign_id, req.user!.id);
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

      // Determine roll mode from campaign settings
      const mode = session.campaign.dice_mode as 'rng' | 'player_entered';

      // If player_entered mode, value must be provided
      if (mode === 'player_entered' && value === undefined) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALUE_REQUIRED',
            message: 'Value is required in player-entered dice mode',
          },
        });
        return;
      }

      // Create dice service and roll
      const diceService = createDiceService(eventRepo);
      const result = await diceService.rollAndLog(
        sessionId,
        req.user!.id,
        req.user!.display_name || req.user!.email,
        dice,
        reason || 'Roll',
        mode,
        value
      );

      // Update session activity
      await sessionRepo.touchSession(sessionId);

      res.json({
        success: true,
        data: {
          dice: result.dice,
          individualRolls: result.individualRolls,
          modifier: result.modifier,
          total: result.total,
          criticalHit: result.criticalHit,
          criticalFail: result.criticalFail,
        },
      });
    } catch (error) {
      console.error('Error processing roll:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to process roll';

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
        },
      });
    }
  }
);

/**
 * GET /api/sessions/:id/events
 * Get events for a session (paginated)
 */
router.get(
  '/:id/events',
  authMiddleware,
  validateParams(uuidParamSchema),
  validateQuery(eventsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { id: sessionId } = req.params;
      const { limit, after, before, types } = req.query as {
        limit: number;
        after?: number;
        before?: number;
        types?: string;
      };

      const client = createUserClient(req.accessToken!);
      const sessionRepo = createSessionRepository(client);
      const eventRepo = createEventRepository(client);
      const campaignRepo = createCampaignRepository(client);

      // Check session exists
      const session = await sessionRepo.getById(sessionId);
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

      // Check membership
      const isMember = await campaignRepo.isMember(session.campaign_id, req.user!.id);
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

      // Parse event types if provided
      const eventTypes = types
        ? (types.split(',').map(t => t.trim()) as any[])
        : undefined;

      const events = await eventRepo.listBySession(sessionId, {
        limit,
        afterSequence: after,
        beforeSequence: before,
        types: eventTypes,
      });

      // Get latest sequence for pagination
      const latestSequence = await eventRepo.getLatestSequence(sessionId);

      res.json({
        success: true,
        data: {
          events,
          pagination: {
            latestSequence,
            hasMore: events.length === limit,
          },
        },
      });
    } catch (error) {
      console.error('Error getting events:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get events',
        },
      });
    }
  }
);

/**
 * GET /api/sessions/:id/events/stream
 * Stream events using Server-Sent Events
 */
router.get(
  '/:id/events/stream',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id: sessionId } = req.params;
      const client = createUserClient(req.accessToken!);

      const sessionRepo = createSessionRepository(client);
      const campaignRepo = createCampaignRepository(client);

      // Check session exists
      const session = await sessionRepo.getById(sessionId);
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

      // Check membership
      const isMember = await campaignRepo.isMember(session.campaign_id, req.user!.id);
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

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Send initial connection message
      res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

      // Set up Supabase realtime subscription
      const channel = supabaseAdmin
        .channel(`session-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'events',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            res.write(`data: ${JSON.stringify({ type: 'event', data: payload.new })}\n\n`);
          }
        )
        .subscribe();

      // Handle client disconnect
      req.on('close', () => {
        channel.unsubscribe();
        res.end();
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
      }, 30000);

      req.on('close', () => {
        clearInterval(heartbeat);
      });
    } catch (error) {
      console.error('Error setting up event stream:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to set up event stream',
        },
      });
    }
  }
);

/**
 * GET /api/sessions/:id/dice-log
 * Get all dice rolls for a session
 */
router.get(
  '/:id/dice-log',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id: sessionId } = req.params;
      const client = createUserClient(req.accessToken!);

      const sessionRepo = createSessionRepository(client);
      const eventRepo = createEventRepository(client);
      const campaignRepo = createCampaignRepository(client);

      // Check session exists
      const session = await sessionRepo.getById(sessionId);
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

      // Check membership
      const isMember = await campaignRepo.isMember(session.campaign_id, req.user!.id);
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

      const diceRolls = await eventRepo.getDiceRolls(sessionId);

      res.json({
        success: true,
        data: diceRolls,
      });
    } catch (error) {
      console.error('Error getting dice log:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get dice log',
        },
      });
    }
  }
);

// Combat start schema
const combatStartSchema = z.object({
  participants: z.array(z.object({
    id: z.string(),
    type: z.enum(['player', 'npc', 'monster']),
    name: z.string(),
    current_hp: z.number().int().min(0),
    max_hp: z.number().int().min(1),
    armor_class: z.number().int().min(1),
    initiative_modifier: z.number().int().optional(),
  })).min(2),
});

// Combat end schema
const combatEndSchema = z.object({
  outcome: z.enum(['victory', 'defeat', 'retreat', 'truce']),
  summary: z.string().optional(),
});

/**
 * GET /api/sessions/:id/combat
 * Get current combat state for a session
 */
router.get(
  '/:id/combat',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id: sessionId } = req.params;
      const client = createUserClient(req.accessToken!);

      const sessionRepo = createSessionRepository(client);
      const campaignRepo = createCampaignRepository(client);

      // Check session exists
      const session = await sessionRepo.getById(sessionId);
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

      // Check membership
      const isMember = await campaignRepo.isMember(session.campaign_id, req.user!.id);
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

      res.json({
        success: true,
        data: {
          combat_state: session.combat_state,
          is_active: session.combat_state?.active ?? false,
        },
      });
    } catch (error) {
      console.error('Error getting combat state:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get combat state',
        },
      });
    }
  }
);

/**
 * POST /api/sessions/:id/combat/start
 * Start a new combat encounter
 */
router.post(
  '/:id/combat/start',
  authMiddleware,
  validateParams(uuidParamSchema),
  validate(combatStartSchema),
  async (req: Request, res: Response) => {
    try {
      const { id: sessionId } = req.params;
      const { participants } = req.body as StartCombatInput;
      const client = createUserClient(req.accessToken!);

      const sessionRepo = createSessionRepository(client);
      const eventRepo = createEventRepository(client);
      const campaignRepo = createCampaignRepository(client);
      const diceService = createDiceService(eventRepo);
      const stateService = createStateService(sessionRepo, eventRepo);

      // Check session exists and is active
      const session = await sessionRepo.getById(sessionId);
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

      if (session.status !== 'active') {
        res.status(400).json({
          success: false,
          error: {
            code: 'SESSION_NOT_ACTIVE',
            message: 'Session is not active',
          },
        });
        return;
      }

      if (session.combat_state?.active) {
        res.status(400).json({
          success: false,
          error: {
            code: 'COMBAT_ALREADY_ACTIVE',
            message: 'Combat is already in progress',
          },
        });
        return;
      }

      // Check membership
      const isMember = await campaignRepo.isMember(session.campaign_id, req.user!.id);
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

      // Create combat service and start combat
      const combatService = createCombatService({
        diceService,
        eventRepo,
        sessionRepo,
      });

      const combatState = await combatService.startCombat(sessionId, participants);

      // Generate combat start narrative
      const dmService = createDMService({
        sessionRepo,
        eventRepo,
        campaignRepo,
        stateService,
      });
      await dmService.initialize();

      const enemies = participants
        .filter(p => p.type === 'monster' || p.type === 'npc')
        .map(p => p.name);
      const narrative = await dmService.generateCombatStartNarrative(sessionId, enemies);

      res.json({
        success: true,
        data: {
          combat_state: combatState,
          narrative: narrative.narrative,
        },
      });
    } catch (error) {
      console.error('Error starting combat:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to start combat',
        },
      });
    }
  }
);

/**
 * POST /api/sessions/:id/combat/next-turn
 * Advance to the next turn in combat
 */
router.post(
  '/:id/combat/next-turn',
  authMiddleware,
  validateParams(uuidParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id: sessionId } = req.params;
      const client = createUserClient(req.accessToken!);

      const sessionRepo = createSessionRepository(client);
      const eventRepo = createEventRepository(client);
      const campaignRepo = createCampaignRepository(client);
      const diceService = createDiceService(eventRepo);
      const stateService = createStateService(sessionRepo, eventRepo);

      // Check session exists and is active
      const session = await sessionRepo.getById(sessionId);
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

      if (!session.combat_state?.active) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_ACTIVE_COMBAT',
            message: 'No active combat',
          },
        });
        return;
      }

      // Check membership
      const isMember = await campaignRepo.isMember(session.campaign_id, req.user!.id);
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

      // Create combat service and advance turn
      const combatService = createCombatService({
        diceService,
        eventRepo,
        sessionRepo,
      });

      const combatState = await combatService.nextTurn(sessionId);

      // Check if next turn is a monster turn, if so process it automatically
      const currentEntry = combatState.initiative_order[combatState.turn_index];
      const currentCombatant = combatState.combatants.find(c => c.id === currentEntry.id);

      let narrative: string | undefined;
      if (currentCombatant && currentCombatant.type !== 'player') {
        // Process monster turn
        const dmService = createDMService({
          sessionRepo,
          eventRepo,
          campaignRepo,
          stateService,
        });
        await dmService.initialize();

        const monsterResponse = await dmService.processMonsterTurn(sessionId);
        narrative = monsterResponse.narrative;
      }

      // Check if combat should end
      const shouldEnd = combatService.shouldCombatEnd(combatState);

      res.json({
        success: true,
        data: {
          combat_state: combatState,
          narrative,
          current_combatant: currentCombatant,
          should_end: shouldEnd.end,
          outcome: shouldEnd.outcome,
        },
      });
    } catch (error) {
      console.error('Error advancing turn:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to advance turn',
        },
      });
    }
  }
);

/**
 * POST /api/sessions/:id/combat/end
 * End the current combat
 */
router.post(
  '/:id/combat/end',
  authMiddleware,
  validateParams(uuidParamSchema),
  validate(combatEndSchema),
  async (req: Request, res: Response) => {
    try {
      const { id: sessionId } = req.params;
      const { outcome, summary } = req.body;
      const client = createUserClient(req.accessToken!);

      const sessionRepo = createSessionRepository(client);
      const eventRepo = createEventRepository(client);
      const campaignRepo = createCampaignRepository(client);
      const diceService = createDiceService(eventRepo);
      const stateService = createStateService(sessionRepo, eventRepo);

      // Check session exists
      const session = await sessionRepo.getById(sessionId);
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

      if (!session.combat_state?.active) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_ACTIVE_COMBAT',
            message: 'No active combat',
          },
        });
        return;
      }

      // Check membership
      const isMember = await campaignRepo.isMember(session.campaign_id, req.user!.id);
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

      // Generate combat end narrative
      const dmService = createDMService({
        sessionRepo,
        eventRepo,
        campaignRepo,
        stateService,
      });
      await dmService.initialize();

      const narrativeResponse = await dmService.generateCombatEndNarrative(sessionId, outcome);

      // Create combat service and end combat
      const combatService = createCombatService({
        diceService,
        eventRepo,
        sessionRepo,
      });

      await combatService.endCombat(sessionId, outcome, summary);

      res.json({
        success: true,
        data: {
          outcome,
          narrative: narrativeResponse.narrative,
        },
      });
    } catch (error) {
      console.error('Error ending combat:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to end combat',
        },
      });
    }
  }
);

/**
 * POST /api/sessions/:id/combat/action
 * Submit a combat action (attack, spell, etc.)
 */
router.post(
  '/:id/combat/action',
  authMiddleware,
  validateParams(uuidParamSchema),
  validate(gameActionSchema),
  async (req: Request, res: Response) => {
    try {
      const { id: sessionId } = req.params;
      const { action, character_id } = req.body;
      const client = createUserClient(req.accessToken!);

      const sessionRepo = createSessionRepository(client);
      const eventRepo = createEventRepository(client);
      const campaignRepo = createCampaignRepository(client);
      const stateService = createStateService(sessionRepo, eventRepo);

      // Check session exists and is active
      const session = await sessionRepo.getById(sessionId);
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

      if (session.status !== 'active') {
        res.status(400).json({
          success: false,
          error: {
            code: 'SESSION_NOT_ACTIVE',
            message: 'Session is not active',
          },
        });
        return;
      }

      if (!session.combat_state?.active) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_ACTIVE_COMBAT',
            message: 'No active combat',
          },
        });
        return;
      }

      // Check membership
      const isMember = await campaignRepo.isMember(session.campaign_id, req.user!.id);
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

      // Create DM service and process combat action
      const dmService = createDMService({
        sessionRepo,
        eventRepo,
        campaignRepo,
        stateService,
      });

      await dmService.initialize();

      const response = await dmService.processCombatAction(
        sessionId,
        req.user!.id,
        req.user!.display_name || req.user!.email,
        action,
        character_id
      );

      // Update session activity
      await sessionRepo.touchSession(sessionId);

      // Get updated combat state
      const updatedSession = await sessionRepo.getById(sessionId);

      res.json({
        success: true,
        data: {
          narrative: response.narrative,
          mechanics: response.mechanics,
          stateChanges: response.stateChanges,
          requiresRoll: response.requiresRoll,
          ruleCitations: response.ruleCitations,
          combat_state: updatedSession?.combat_state,
        },
      });
    } catch (error) {
      console.error('Error processing combat action:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process combat action',
        },
      });
    }
  }
);

export default router;
