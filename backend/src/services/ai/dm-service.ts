/**
 * DM Service
 * Orchestrates AI interactions for the Dungeon Master
 */

import { createChatCompletion, ModelConfig } from '../../config/openai.js';
import {
  SYSTEM_PROMPT,
  buildGameContext,
  buildPlayerActionPrompt,
  buildDiceResolutionPrompt,
  buildSessionStartPrompt,
  buildSessionSummaryPrompt,
} from '../../ai/prompts.js';
import { rulesService } from '../../rules/service.js';
import { parseAIResponse, type AIResponse } from './response-parser.js';
import { SessionRepository } from '../data/session-repo.js';
import { EventRepository } from '../data/event-repo.js';
import { CampaignRepository } from '../data/campaign-repo.js';
import { StateService } from '../game/state-service.js';
import type { Campaign } from '../../models/campaign.js';
import type { Session } from '../../models/session.js';
import type { Character } from '../../models/character.js';
import type { GameEvent } from '../../models/event.js';
import type OpenAI from 'openai';

export interface DMServiceConfig {
  sessionRepo: SessionRepository;
  eventRepo: EventRepository;
  campaignRepo: CampaignRepository;
  stateService: StateService;
}

export class DMService {
  private sessionRepo: SessionRepository;
  private eventRepo: EventRepository;
  private campaignRepo: CampaignRepository;
  private stateService: StateService;

  constructor(config: DMServiceConfig) {
    this.sessionRepo = config.sessionRepo;
    this.eventRepo = config.eventRepo;
    this.campaignRepo = config.campaignRepo;
    this.stateService = config.stateService;
  }

  /**
   * Initialize the rules service
   */
  async initialize(): Promise<void> {
    await rulesService.initialize();
  }

  /**
   * Process a player action and generate DM response
   */
  async processPlayerAction(
    sessionId: string,
    playerId: string,
    playerName: string,
    action: string,
    characterId?: string
  ): Promise<AIResponse> {
    // Get session with campaign
    const session = await this.sessionRepo.getWithCampaign(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Get campaign details
    const campaign = await this.campaignRepo.getById(session.campaign_id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Log the player action
    await this.eventRepo.createPlayerAction(
      sessionId,
      playerId,
      playerName,
      action,
      characterId
    );

    // Get recent events for context
    const recentEvents = await this.eventRepo.getRecentEvents(sessionId, 10);

    // Get rules context for the action
    const { context: rulesContext, citations } = rulesService.getRulesContext(action, 1500);

    // Build the game context
    const gameContext = buildGameContext(
      campaign,
      session,
      [], // TODO: Get characters
      recentEvents,
      rulesContext
    );

    // Build the action prompt
    const actionPrompt = buildPlayerActionPrompt(action, playerName, gameContext);

    // Get AI response
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: actionPrompt },
    ];

    const completion = await createChatCompletion(messages, {
      model: ModelConfig.DM_NARRATIVE,
      maxTokens: ModelConfig.MAX_TOKENS.NARRATIVE,
      temperature: ModelConfig.TEMPERATURE.NARRATIVE,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const response = parseAIResponse(responseText);

    // Merge rule citations
    if (citations.length > 0 && !response.ruleCitations) {
      response.ruleCitations = citations;
    }

    // Log the AI response
    await this.eventRepo.createAIResponse(
      sessionId,
      response.narrative,
      response.mechanics,
      response.stateChanges,
      response.ruleCitations
    );

    // Apply state changes if any
    if (response.stateChanges && response.stateChanges.length > 0) {
      await this.stateService.applyStateChanges(sessionId, response.stateChanges);
    }

    // Update location if changed
    if (response.newLocation) {
      await this.stateService.updateLocation(sessionId, response.newLocation);
    }

    // Add new NPCs if any
    if (response.newNPCs) {
      for (const npc of response.newNPCs) {
        await this.stateService.addNPC(sessionId, npc);
      }
    }

    return response;
  }

  /**
   * Process a dice roll result and continue the narrative
   */
  async processDiceResult(
    sessionId: string,
    rollResult: { dice: string; total: number; reason: string },
    dc: number | null
  ): Promise<AIResponse> {
    const session = await this.sessionRepo.getWithCampaign(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const campaign = await this.campaignRepo.getById(session.campaign_id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const recentEvents = await this.eventRepo.getRecentEvents(sessionId, 10);
    const gameContext = buildGameContext(campaign, session, [], recentEvents);

    const prompt = buildDiceResolutionPrompt(rollResult, dc, gameContext);

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];

    const completion = await createChatCompletion(messages, {
      model: ModelConfig.DM_NARRATIVE,
      maxTokens: ModelConfig.MAX_TOKENS.NARRATIVE,
      temperature: ModelConfig.TEMPERATURE.NARRATIVE,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const response = parseAIResponse(responseText);

    // Log the AI response
    await this.eventRepo.createAIResponse(
      sessionId,
      response.narrative,
      response.mechanics,
      response.stateChanges,
      response.ruleCitations
    );

    // Apply state changes
    if (response.stateChanges && response.stateChanges.length > 0) {
      await this.stateService.applyStateChanges(sessionId, response.stateChanges);
    }

    return response;
  }

  /**
   * Start a new session with an opening narrative
   */
  async startSession(
    sessionId: string,
    characters: Character[]
  ): Promise<AIResponse> {
    const session = await this.sessionRepo.getWithCampaign(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const campaign = await this.campaignRepo.getById(session.campaign_id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get previous session summary if exists
    const previousSessions = await this.sessionRepo.listByCampaign(session.campaign_id);
    const previousSession = previousSessions.find(
      s => s.id !== sessionId && s.status === 'ended'
    );

    // Log session start
    await this.eventRepo.createSessionStart(sessionId);

    const prompt = buildSessionStartPrompt(
      campaign,
      previousSession?.narrative_summary || null,
      characters
    );

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];

    const completion = await createChatCompletion(messages, {
      model: ModelConfig.DM_NARRATIVE,
      maxTokens: ModelConfig.MAX_TOKENS.NARRATIVE,
      temperature: ModelConfig.TEMPERATURE.NARRATIVE,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const response = parseAIResponse(responseText);

    // Log the opening narrative
    await this.eventRepo.createAIResponse(
      sessionId,
      response.narrative,
      response.mechanics
    );

    return response;
  }

  /**
   * Generate a session summary for saving
   */
  async generateSessionSummary(sessionId: string): Promise<string> {
    const events = await this.eventRepo.listBySession(sessionId);

    if (events.length === 0) {
      return 'No events recorded in this session.';
    }

    const prompt = buildSessionSummaryPrompt(events);

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: 'You are a helpful assistant that writes concise session summaries for D&D campaigns.' },
      { role: 'user', content: prompt },
    ];

    const completion = await createChatCompletion(messages, {
      model: ModelConfig.VALIDATION, // Use faster model for summaries
      maxTokens: 500,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content || 'Session summary unavailable.';

    // Update session with summary
    await this.stateService.updateNarrativeSummary(sessionId, summary);

    return summary;
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<string> {
    // Generate summary
    const summary = await this.generateSessionSummary(sessionId);

    // Log session end
    await this.eventRepo.createSessionEnd(sessionId, summary);

    // End the session
    await this.sessionRepo.endSession(sessionId);

    return summary;
  }
}

/**
 * Factory function to create DM service
 */
export function createDMService(config: DMServiceConfig): DMService {
  return new DMService(config);
}
