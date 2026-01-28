/**
 * DM Service
 * Orchestrates AI interactions for the Dungeon Master
 * Supports configurable LLM providers (OpenAI, Gemini)
 */

import { createMessage, getModelConfig, type LLMMessage } from '../../config/llm/index.js';
import {
  SYSTEM_PROMPT,
  COMBAT_SYSTEM_SUPPLEMENT,
  buildGameContext,
  buildPlayerActionPrompt,
  buildDiceResolutionPrompt,
  buildSessionStartPrompt,
  buildSessionSummaryPrompt,
  buildCombatStartPrompt,
  buildCombatTurnPrompt,
  buildCombatActionPrompt,
  buildMonsterTurnPrompt,
  buildCombatEndPrompt,
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
    const ModelConfig = getModelConfig();

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
    const messages: LLMMessage[] = [
      { role: 'user', content: actionPrompt },
    ];

    const completion = await createMessage(SYSTEM_PROMPT, messages, {
      model: ModelConfig.DM_NARRATIVE,
      maxTokens: ModelConfig.MAX_TOKENS.narrative,
      temperature: ModelConfig.TEMPERATURE.narrative,
    });

    const response = parseAIResponse(completion.content);

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
    const ModelConfig = getModelConfig();

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

    const messages: LLMMessage[] = [
      { role: 'user', content: prompt },
    ];

    const completion = await createMessage(SYSTEM_PROMPT, messages, {
      model: ModelConfig.DM_NARRATIVE,
      maxTokens: ModelConfig.MAX_TOKENS.narrative,
      temperature: ModelConfig.TEMPERATURE.narrative,
    });

    const response = parseAIResponse(completion.content);

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
    const ModelConfig = getModelConfig();

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

    const messages: LLMMessage[] = [
      { role: 'user', content: prompt },
    ];

    const completion = await createMessage(SYSTEM_PROMPT, messages, {
      model: ModelConfig.DM_NARRATIVE,
      maxTokens: ModelConfig.MAX_TOKENS.narrative,
      temperature: ModelConfig.TEMPERATURE.narrative,
    });

    const response = parseAIResponse(completion.content);

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
    const ModelConfig = getModelConfig();

    const events = await this.eventRepo.listBySession(sessionId);

    if (events.length === 0) {
      return 'No events recorded in this session.';
    }

    const prompt = buildSessionSummaryPrompt(events);

    const messages: LLMMessage[] = [
      { role: 'user', content: prompt },
    ];

    const completion = await createMessage(
      'You are a helpful assistant that writes concise session summaries for D&D campaigns.',
      messages,
      {
        model: ModelConfig.VALIDATION, // Use faster model for summaries
        maxTokens: 500,
        temperature: 0.3,
      }
    );

    const summary = completion.content || 'Session summary unavailable.';

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

  /**
   * Process a combat action during an active combat
   */
  async processCombatAction(
    sessionId: string,
    playerId: string,
    playerName: string,
    action: string,
    characterId?: string
  ): Promise<AIResponse> {
    const ModelConfig = getModelConfig();

    const session = await this.sessionRepo.getWithCampaign(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.combat_state?.active) {
      throw new Error('No active combat');
    }

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

    // Get combat-relevant rules
    const { context: rulesContext, citations } = rulesService.getRulesContext(
      `combat ${action}`,
      2000
    );

    // Build the game context with combat supplement
    const gameContext = buildGameContext(
      campaign,
      session,
      [],
      recentEvents,
      rulesContext
    );

    // Build combat action prompt
    const isPlayer = session.combat_state.combatants.find(
      c => c.id === characterId
    )?.type === 'player';
    const actionPrompt = buildCombatActionPrompt(
      action,
      playerName,
      isPlayer ?? true,
      gameContext
    );

    // Get AI response with combat system supplement
    const messages: LLMMessage[] = [
      { role: 'user', content: actionPrompt },
    ];

    const completion = await createMessage(
      SYSTEM_PROMPT + COMBAT_SYSTEM_SUPPLEMENT,
      messages,
      {
        model: ModelConfig.DM_NARRATIVE,
        maxTokens: ModelConfig.MAX_TOKENS.narrative,
        temperature: ModelConfig.TEMPERATURE.narrative,
      }
    );

    const response = parseAIResponse(completion.content);

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

    return response;
  }

  /**
   * Process a monster/NPC turn in combat
   */
  async processMonsterTurn(sessionId: string): Promise<AIResponse> {
    const ModelConfig = getModelConfig();

    const session = await this.sessionRepo.getWithCampaign(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.combat_state?.active) {
      throw new Error('No active combat');
    }

    const campaign = await this.campaignRepo.getById(session.campaign_id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get current combatant
    const currentEntry = session.combat_state.initiative_order[session.combat_state.turn_index];
    const currentCombatant = session.combat_state.combatants.find(
      c => c.id === currentEntry.id
    );

    if (!currentCombatant || currentCombatant.type === 'player') {
      throw new Error('Not a monster/NPC turn');
    }

    // Get recent events for context
    const recentEvents = await this.eventRepo.getRecentEvents(sessionId, 10);

    // Get combat rules context
    const { context: rulesContext, citations } = rulesService.getRulesContext(
      'combat monster action',
      1500
    );

    // Build the game context
    const gameContext = buildGameContext(
      campaign,
      session,
      [],
      recentEvents,
      rulesContext
    );

    // Get available targets (active player characters)
    const availableTargets = session.combat_state.combatants
      .filter(c => c.type === 'player' && c.is_active)
      .map(c => ({
        name: c.name,
        type: c.type,
        hp: c.current_hp,
      }));

    // Build monster turn prompt
    const prompt = buildMonsterTurnPrompt(
      currentCombatant.name,
      currentCombatant.type,
      currentCombatant.current_hp,
      currentCombatant.max_hp,
      availableTargets,
      gameContext
    );

    // Get AI response
    const messages: LLMMessage[] = [
      { role: 'user', content: prompt },
    ];

    const completion = await createMessage(
      SYSTEM_PROMPT + COMBAT_SYSTEM_SUPPLEMENT,
      messages,
      {
        model: ModelConfig.DM_NARRATIVE,
        maxTokens: ModelConfig.MAX_TOKENS.narrative,
        temperature: ModelConfig.TEMPERATURE.narrative,
      }
    );

    const response = parseAIResponse(completion.content);

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

    return response;
  }

  /**
   * Generate narrative for combat start
   */
  async generateCombatStartNarrative(
    sessionId: string,
    enemies: string[]
  ): Promise<AIResponse> {
    const ModelConfig = getModelConfig();

    const session = await this.sessionRepo.getWithCampaign(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const campaign = await this.campaignRepo.getById(session.campaign_id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const recentEvents = await this.eventRepo.getRecentEvents(sessionId, 5);
    const gameContext = buildGameContext(campaign, session, [], recentEvents);

    const prompt = buildCombatStartPrompt(enemies, gameContext);

    const messages: LLMMessage[] = [
      { role: 'user', content: prompt },
    ];

    const completion = await createMessage(
      SYSTEM_PROMPT + COMBAT_SYSTEM_SUPPLEMENT,
      messages,
      {
        model: ModelConfig.DM_NARRATIVE,
        maxTokens: ModelConfig.MAX_TOKENS.narrative,
        temperature: ModelConfig.TEMPERATURE.narrative,
      }
    );

    const response = parseAIResponse(completion.content);

    // Log the AI response
    await this.eventRepo.createAIResponse(
      sessionId,
      response.narrative,
      response.mechanics
    );

    return response;
  }

  /**
   * Generate narrative for combat end
   */
  async generateCombatEndNarrative(
    sessionId: string,
    outcome: 'victory' | 'defeat' | 'retreat' | 'truce'
  ): Promise<AIResponse> {
    const ModelConfig = getModelConfig();

    const session = await this.sessionRepo.getWithCampaign(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const campaign = await this.campaignRepo.getById(session.campaign_id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get survivors and fallen from the last known combat state
    const combatState = session.combat_state;
    const survivors = combatState?.combatants
      .filter(c => c.is_active && c.current_hp > 0)
      .map(c => c.name) || [];
    const fallen = combatState?.combatants
      .filter(c => !c.is_active || c.current_hp <= 0)
      .map(c => c.name) || [];

    const recentEvents = await this.eventRepo.getRecentEvents(sessionId, 10);
    const gameContext = buildGameContext(campaign, session, [], recentEvents);

    const prompt = buildCombatEndPrompt(outcome, survivors, fallen, gameContext);

    const messages: LLMMessage[] = [
      { role: 'user', content: prompt },
    ];

    const completion = await createMessage(SYSTEM_PROMPT, messages, {
      model: ModelConfig.DM_NARRATIVE,
      maxTokens: ModelConfig.MAX_TOKENS.narrative,
      temperature: ModelConfig.TEMPERATURE.narrative,
    });

    const response = parseAIResponse(completion.content);

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

    return response;
  }

  /**
   * Check if current session is in combat and it's a player's turn
   */
  async isPlayerTurn(sessionId: string, characterId?: string): Promise<boolean> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session || !session.combat_state?.active) {
      return false;
    }

    const currentEntry = session.combat_state.initiative_order[session.combat_state.turn_index];
    const currentCombatant = session.combat_state.combatants.find(
      c => c.id === currentEntry.id
    );

    if (!currentCombatant || currentCombatant.type !== 'player') {
      return false;
    }

    // If character ID is provided, check if it matches
    if (characterId && currentCombatant.id !== characterId) {
      return false;
    }

    return true;
  }

  /**
   * Check if session is in active combat
   */
  async isInCombat(sessionId: string): Promise<boolean> {
    const session = await this.sessionRepo.getById(sessionId);
    return session?.combat_state?.active === true;
  }
}

/**
 * Factory function to create DM service
 */
export function createDMService(config: DMServiceConfig): DMService {
  return new DMService(config);
}
