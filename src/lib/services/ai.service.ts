import type {
  LLMConfig,
  LLMMessage,
  LLMRequest,
  LLMResponse,
  DMContext,
  DMResponse,
  PlayerInput,
  GameAction,
  GameActionType,
  NPCDialogue,
  EnvironmentChange,
  PlayerPrompt,
  ResponseMetadata,
  PromptTemplate,
  PromptCategory,
  AIError,
  AIErrorCode,
  ConversationEntry,
  CharacterSummary,
  CampaignContext,
  SessionContext,
  SceneContext,
} from '@/types/ai.types';
import type { Character } from '@/types/character.types';
import type { Campaign, NPC, Location } from '@/types/campaign.types';
import type { CombatState, GameSession } from '@/types/session.types';

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: LLMConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.7,
  topP: 0.9,
};

// ============================================
// Prompt Templates
// ============================================

const SYSTEM_PROMPT_BASE = `You are an expert Dungeon Master for a Dungeons & Dragons 5th Edition game. Your role is to:

1. Create immersive, engaging narrative descriptions
2. Voice NPCs with distinct personalities and speech patterns
3. Manage game pacing and dramatic tension
4. Apply D&D 5e rules fairly and consistently
5. Respond to player actions with appropriate consequences
6. Maintain continuity with the campaign's established lore

Guidelines:
- Be descriptive but concise - aim for 2-4 sentences for most narration
- Use sensory details to bring scenes to life
- Give players agency while maintaining narrative momentum
- When combat is needed, clearly indicate required rolls
- Keep track of character conditions and apply them appropriately
- Reference character backstories and motivations when relevant

Response Format:
Your response should be a JSON object with the following structure:
{
  "narrative": "The main narrative description",
  "actions": [{ "type": "action_type", "target": "target_id", "parameters": {}, "description": "human-readable description", "requiresResolution": boolean }],
  "npcDialogue": [{ "npcId": "id", "npcName": "name", "dialogue": "what they say", "emotion": "emotion", "action": "physical action" }],
  "environmentChanges": [{ "type": "type", "description": "description", "mechanicalEffect": "effect if any" }],
  "promptsForPlayers": [{ "targetCharacterId": "id or null for all", "prompt": "what you're asking", "suggestedActions": ["option1", "option2"], "requiredResponse": boolean }],
  "metadata": { "tone": "tone", "pacing": "pacing", "suggestedMusicMood": "mood", "visualDescription": "description" }
}`;

const PROMPT_TEMPLATES: Map<PromptCategory, PromptTemplate> = new Map([
  [
    'narration',
    {
      id: 'narration-general',
      name: 'General Narration',
      category: 'narration',
      systemPrompt: SYSTEM_PROMPT_BASE,
      userPromptTemplate: `Current Scene: {{scene}}

Player Action: {{playerAction}}

Respond to this action with appropriate narration and any necessary game mechanics.`,
      variables: ['scene', 'playerAction'],
    },
  ],
  [
    'combat',
    {
      id: 'combat-dm',
      name: 'Combat Narration',
      category: 'combat',
      systemPrompt: `${SYSTEM_PROMPT_BASE}

Combat-specific guidelines:
- Describe attacks and their effects vividly
- Keep combat flowing quickly
- Announce whose turn it is clearly
- Describe enemy actions and reactions
- Maintain tactical awareness of positioning`,
      userPromptTemplate: `Combat State:
{{combatState}}

Current Turn: {{currentTurn}}

Action Taken: {{action}}

Describe the combat action and its results. Include any required rolls or mechanical effects.`,
      variables: ['combatState', 'currentTurn', 'action'],
    },
  ],
  [
    'dialogue',
    {
      id: 'dialogue-npc',
      name: 'NPC Dialogue',
      category: 'dialogue',
      systemPrompt: `${SYSTEM_PROMPT_BASE}

Dialogue guidelines:
- Give each NPC a distinct voice and mannerisms
- Reflect NPC motivations and secrets in their responses
- Use body language and non-verbal cues
- NPCs should have their own goals, not just serve players`,
      userPromptTemplate: `NPC: {{npcName}}
Description: {{npcDescription}}
Personality: {{npcPersonality}}
Current disposition: {{disposition}}
Hidden motivations: {{motivations}}

Player says: "{{playerDialogue}}"

How does {{npcName}} respond?`,
      variables: ['npcName', 'npcDescription', 'npcPersonality', 'disposition', 'motivations', 'playerDialogue'],
    },
  ],
  [
    'exploration',
    {
      id: 'exploration-general',
      name: 'Exploration',
      category: 'exploration',
      systemPrompt: `${SYSTEM_PROMPT_BASE}

Exploration guidelines:
- Describe environments with multiple senses
- Hint at secrets without revealing them outright
- Reward player curiosity
- Include interactive elements players might investigate`,
      userPromptTemplate: `Location: {{location}}
Notable features: {{features}}
Hidden secrets: {{secrets}}

Player is investigating: {{investigation}}

Describe what they discover based on their approach. If checks are needed, specify the type and DC.`,
      variables: ['location', 'features', 'secrets', 'investigation'],
    },
  ],
  [
    'session_start',
    {
      id: 'session-start',
      name: 'Session Start Recap',
      category: 'session_start',
      systemPrompt: `${SYSTEM_PROMPT_BASE}

Session start guidelines:
- Provide a brief but engaging recap
- Remind players where they are and what they were doing
- Build anticipation for the session
- End with a hook that prompts action`,
      userPromptTemplate: `Campaign: {{campaignName}}
Session Number: {{sessionNumber}}
Previous Session Summary: {{previousSummary}}
Current Location: {{location}}
Active Quests: {{quests}}
Party Status: {{partyStatus}}

Provide an engaging session opening that recaps recent events and sets the scene.`,
      variables: ['campaignName', 'sessionNumber', 'previousSummary', 'location', 'quests', 'partyStatus'],
    },
  ],
  [
    'session_end',
    {
      id: 'session-end',
      name: 'Session End Summary',
      category: 'session_end',
      systemPrompt: `${SYSTEM_PROMPT_BASE}

Session end guidelines:
- Summarize key events and accomplishments
- Note any cliffhangers or unresolved threads
- Thank players for their creativity
- Tease what might come next`,
      userPromptTemplate: `Session Events: {{events}}
Accomplishments: {{accomplishments}}
Unresolved Threads: {{threads}}
Character Moments: {{moments}}

Provide a satisfying session conclusion that summarizes events and builds anticipation for next time.`,
      variables: ['events', 'accomplishments', 'threads', 'moments'],
    },
  ],
]);

// ============================================
// AI Service Class
// ============================================

export class AIService {
  private config: LLMConfig;
  private conversationHistory: ConversationEntry[] = [];
  private maxHistoryLength = 50;

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================
  // LLM Client Methods
  // ============================================

  async sendRequest(request: LLMRequest): Promise<LLMResponse> {
    const config = { ...this.config, ...request.config };

    if (!config.apiKey) {
      throw this.createError('API_ERROR', 'API key is not configured');
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          top_p: config.topP,
          messages: request.messages.filter((m) => m.role !== 'system'),
          system: request.messages.find((m) => m.role === 'system')?.content,
          stop_sequences: config.stopSequences,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw this.createError('RATE_LIMIT', 'Rate limit exceeded', { retryAfter: response.headers.get('retry-after') }, true);
        }
        const errorBody = await response.text();
        throw this.createError('API_ERROR', `API request failed: ${response.status}`, { body: errorBody });
      }

      const data = await response.json();

      return {
        content: data.content[0]?.text || '',
        model: data.model,
        usage: {
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
        stopReason: data.stop_reason === 'end_turn' ? 'end_turn' : data.stop_reason === 'max_tokens' ? 'max_tokens' : 'stop_sequence',
        metadata: request.metadata,
      };
    } catch (error) {
      if ((error as AIError).code) {
        throw error;
      }
      throw this.createError('NETWORK_ERROR', `Network error: ${(error as Error).message}`, undefined, true);
    }
  }

  // ============================================
  // DM Response Generation
  // ============================================

  async generateDMResponse(context: DMContext, playerInput: PlayerInput): Promise<DMResponse> {
    const template = this.selectTemplate(playerInput, context);
    const prompt = this.buildPrompt(template, context, playerInput);

    const request: LLMRequest = {
      messages: [
        { role: 'system', content: template.systemPrompt },
        ...this.getRelevantHistory(context),
        { role: 'user', content: prompt },
      ],
      metadata: {
        sessionId: context.session.id,
        playerId: playerInput.playerId,
        inputType: playerInput.inputType,
      },
    };

    const response = await this.sendRequest(request);
    const dmResponse = this.parseResponse(response.content);

    // Record the interaction in history
    this.addToHistory({
      speaker: playerInput.characterName,
      type: 'player',
      content: playerInput.content,
      timestamp: new Date(),
      metadata: {
        characterId: playerInput.characterId,
        actionType: playerInput.inputType,
      },
    });

    this.addToHistory({
      speaker: 'DM',
      type: 'dm',
      content: dmResponse.narrative,
      timestamp: new Date(),
    });

    return dmResponse;
  }

  async generateNPCDialogue(npc: NPC, playerDialogue: string, context: DMContext): Promise<NPCDialogue> {
    const template = PROMPT_TEMPLATES.get('dialogue')!;
    const prompt = this.interpolateTemplate(template.userPromptTemplate, {
      npcName: npc.name,
      npcDescription: npc.description || 'No description available',
      npcPersonality: npc.personality || 'Neutral',
      disposition: npc.disposition || 'neutral',
      motivations: npc.goals?.join(', ') || 'Unknown',
      playerDialogue,
    });

    const request: LLMRequest = {
      messages: [
        { role: 'system', content: template.systemPrompt },
        { role: 'user', content: prompt },
      ],
    };

    const response = await this.sendRequest(request);

    try {
      const parsed = JSON.parse(response.content);
      return {
        npcId: npc.id,
        npcName: npc.name,
        dialogue: parsed.dialogue || parsed.npcDialogue?.[0]?.dialogue || response.content,
        emotion: parsed.emotion,
        action: parsed.action,
      };
    } catch {
      // If not valid JSON, treat the whole response as dialogue
      return {
        npcId: npc.id,
        npcName: npc.name,
        dialogue: response.content,
      };
    }
  }

  async generateSessionRecap(context: DMContext): Promise<string> {
    const template = PROMPT_TEMPLATES.get('session_start')!;
    const prompt = this.interpolateTemplate(template.userPromptTemplate, {
      campaignName: context.campaign.name,
      sessionNumber: context.session.sessionNumber.toString(),
      previousSummary: context.session.summary || 'No previous session summary available',
      location: context.currentScene.location.name,
      quests: context.session.activeQuests.map((q) => `${q.title}: ${q.currentProgress}`).join('\n'),
      partyStatus: context.players.map((p) => `${p.character.name} (${p.character.currentHP}/${p.character.maxHP} HP)`).join(', '),
    });

    const request: LLMRequest = {
      messages: [
        { role: 'system', content: template.systemPrompt },
        { role: 'user', content: prompt },
      ],
    };

    const response = await this.sendRequest(request);

    try {
      const parsed = JSON.parse(response.content);
      return parsed.narrative || response.content;
    } catch {
      return response.content;
    }
  }

  async generateCombatNarration(combat: CombatState, action: string, context: DMContext): Promise<DMResponse> {
    const template = PROMPT_TEMPLATES.get('combat')!;
    const currentInitiativeEntry = combat.initiativeOrder[combat.currentTurnIndex];
    const currentCombatant = combat.combatants[currentInitiativeEntry.id];
    const prompt = this.interpolateTemplate(template.userPromptTemplate, {
      combatState: this.formatCombatState(combat),
      currentTurn: `${currentCombatant.name} (${currentCombatant.type})`,
      action,
    });

    const request: LLMRequest = {
      messages: [
        { role: 'system', content: template.systemPrompt },
        ...this.getRelevantHistory(context),
        { role: 'user', content: prompt },
      ],
    };

    const response = await this.sendRequest(request);
    return this.parseResponse(response.content);
  }

  // ============================================
  // Prompt Building
  // ============================================

  private selectTemplate(playerInput: PlayerInput, context: DMContext): PromptTemplate {
    // Select template based on input type and context
    if (context.combatState && context.combatState.status === 'active') {
      return PROMPT_TEMPLATES.get('combat')!;
    }

    switch (playerInput.inputType) {
      case 'dialogue':
        return PROMPT_TEMPLATES.get('dialogue')!;
      case 'investigation':
        return PROMPT_TEMPLATES.get('exploration')!;
      default:
        return PROMPT_TEMPLATES.get('narration')!;
    }
  }

  buildPrompt(template: PromptTemplate, context: DMContext, playerInput: PlayerInput): string {
    const variables: Record<string, string> = {
      scene: this.formatSceneContext(context.currentScene),
      playerAction: `${playerInput.characterName}: ${playerInput.content}`,
      combatState: context.combatState ? this.formatCombatState(context.combatState) : 'Not in combat',
      location: context.currentScene.location.name,
      features: context.currentScene.location.notableFeatures.join(', '),
      secrets: context.currentScene.location.secrets?.join(', ') || 'None known',
      investigation: playerInput.content,
    };

    return this.interpolateTemplate(template.userPromptTemplate, variables);
  }

  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  private formatSceneContext(scene: SceneContext): string {
    const parts = [
      `Location: ${scene.location.name} (${scene.location.type})`,
      `Description: ${scene.location.description}`,
      `Environment: ${scene.environmentDetails}`,
      `Mood: ${scene.mood}`,
    ];

    if (scene.npcsPresent.length > 0) {
      parts.push(`NPCs Present: ${scene.npcsPresent.map((n) => `${n.name} (${n.disposition})`).join(', ')}`);
    }

    if (scene.timeOfDay) parts.push(`Time: ${scene.timeOfDay}`);
    if (scene.weather) parts.push(`Weather: ${scene.weather}`);
    if (scene.lightingConditions) parts.push(`Lighting: ${scene.lightingConditions}`);

    return parts.join('\n');
  }

  private formatCombatState(combat: CombatState): string {
    const lines = [
      `Round: ${combat.round}`,
      'Initiative Order:',
      ...combat.initiativeOrder.map((entry, i) => {
        const current = i === combat.currentTurnIndex ? '>> ' : '   ';
        const combatant = combat.combatants[entry.id];
        const hp = combatant ? `${combatant.currentHP}/${combatant.maxHP}` : '?/?';
        const status = combatant && combatant.currentHP <= 0 ? '(DOWN)' : `(${hp} HP)`;
        return `${current}${entry.initiative}: ${entry.name} ${status}`;
      }),
    ];
    return lines.join('\n');
  }

  // ============================================
  // Response Processing
  // ============================================

  parseResponse(content: string): DMResponse {
    // Try to parse as JSON first
    try {
      // Find JSON in the response (might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        return this.validateAndNormalizeDMResponse(parsed);
      }
    } catch {
      // JSON parsing failed, extract what we can
    }

    // Fallback: treat the whole response as narrative
    return {
      narrative: content,
      actions: [],
      metadata: {
        tone: 'neutral',
        pacing: 'normal',
      },
    };
  }

  private validateAndNormalizeDMResponse(parsed: Partial<DMResponse>): DMResponse {
    return {
      narrative: parsed.narrative || '',
      actions: (parsed.actions || []).map((a) => this.normalizeAction(a)),
      npcDialogue: parsed.npcDialogue,
      environmentChanges: parsed.environmentChanges,
      promptsForPlayers: parsed.promptsForPlayers,
      metadata: {
        tone: parsed.metadata?.tone || 'neutral',
        pacing: parsed.metadata?.pacing || 'normal',
        suggestedMusicMood: parsed.metadata?.suggestedMusicMood,
        visualDescription: parsed.metadata?.visualDescription,
      },
    };
  }

  private normalizeAction(action: Partial<GameAction>): GameAction {
    return {
      type: this.validateActionType(action.type),
      target: action.target,
      parameters: action.parameters || {},
      description: action.description || '',
      requiresResolution: action.requiresResolution ?? true,
    };
  }

  private validateActionType(type?: string): GameActionType {
    const validTypes: GameActionType[] = [
      'skill_check',
      'saving_throw',
      'attack',
      'damage',
      'healing',
      'condition_apply',
      'condition_remove',
      'initiative',
      'combat_start',
      'combat_end',
      'item_give',
      'item_remove',
      'experience_award',
      'gold_award',
      'quest_update',
      'scene_change',
      'npc_spawn',
      'rest_short',
      'rest_long',
    ];

    if (type && validTypes.includes(type as GameActionType)) {
      return type as GameActionType;
    }
    return 'skill_check'; // Default fallback
  }

  // ============================================
  // Context Building Helpers
  // ============================================

  buildDMContext(
    campaign: Campaign,
    session: GameSession,
    characters: Character[],
    currentLocation: Location,
    npcsPresent: NPC[] = [],
    combatState?: CombatState
  ): DMContext {
    return {
      campaign: this.buildCampaignContext(campaign),
      session: this.buildSessionContext(session),
      players: characters.map((c) => ({
        character: this.buildCharacterSummary(c),
        isActive: true,
      })),
      currentScene: this.buildSceneContext(currentLocation, npcsPresent),
      combatState,
      conversationHistory: this.conversationHistory,
    };
  }

  private buildCampaignContext(campaign: Campaign): CampaignContext {
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description || '',
      setting: campaign.setting || 'Fantasy',
      themes: [], // Themes can be derived from campaign settings.tone if needed
      worldState: (campaign.worldState || {}) as unknown as Record<string, unknown>,
    };
  }

  private buildSessionContext(session: GameSession): SessionContext {
    return {
      id: session.id,
      sessionNumber: 1, // Session number tracking would be at campaign level
      summary: undefined,
      objectives: [],
      activeQuests: [],
      recentEvents: session.narrativeContext?.recentEvents || [],
    };
  }

  private buildCharacterSummary(character: Character): CharacterSummary {
    return {
      id: character.id,
      name: character.name,
      race: character.race.name,
      classes: character.classes.map((c) => `${c.name} ${c.level}`).join('/'),
      level: character.level,
      currentHP: character.currentHitPoints,
      maxHP: character.maxHitPoints,
      conditions: character.conditions.map((c) => c.type),
      notableAbilities: character.features.slice(0, 5).map((f) => f.name),
      personality: character.personality.traits.join(', '),
      backstory: character.backstory,
    };
  }

  private buildSceneContext(location: Location, npcs: NPC[]): SceneContext {
    return {
      location: {
        id: location.id,
        name: location.name,
        type: location.locationType || 'general',
        description: location.description || '',
        notableFeatures: location.properties?.pointsOfInterest || [],
        secrets: location.properties?.secrets || [],
      },
      npcsPresent: npcs.map((npc) => ({
        id: npc.id,
        name: npc.name,
        description: npc.description || '',
        disposition: npc.disposition || 'neutral',
        motivations: npc.goals || [],
        currentState: npc.locationId,
      })),
      environmentDetails: location.description || '',
      mood: 'neutral',
    };
  }

  // ============================================
  // Conversation History Management
  // ============================================

  addToHistory(entry: ConversationEntry): void {
    this.conversationHistory.push(entry);
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  private getRelevantHistory(context: DMContext): LLMMessage[] {
    // Get last 10 entries as context
    const recentHistory = this.conversationHistory.slice(-10);
    return recentHistory.map((entry) => ({
      role: entry.type === 'player' ? ('user' as const) : ('assistant' as const),
      content: entry.type === 'player' ? `[${entry.speaker}]: ${entry.content}` : entry.content,
    }));
  }

  // ============================================
  // Error Handling
  // ============================================

  private createError(code: AIErrorCode, message: string, details?: Record<string, unknown>, retryable = false): AIError {
    return {
      code,
      message,
      details,
      retryable,
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
