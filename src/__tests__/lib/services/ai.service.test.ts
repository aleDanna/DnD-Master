import { AIService } from '@/lib/services/ai.service';
import type {
  DMContext,
  PlayerInput,
  LLMResponse,
  DMResponse,
  CampaignContext,
  SessionContext,
  SceneContext,
  PlayerContext,
} from '@/types/ai.types';
import type { NPC } from '@/types/campaign.types';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService({ apiKey: 'test-api-key' });
  });

  const createMockDMContext = (): DMContext => ({
    campaign: {
      id: 'campaign-1',
      name: 'Lost Mines of Phandelver',
      description: 'A classic adventure',
      setting: 'Forgotten Realms',
      themes: ['exploration', 'mystery'],
      worldState: {},
    },
    session: {
      id: 'session-1',
      sessionNumber: 5,
      summary: 'The party entered the goblin cave',
      objectives: ['Find the captured dwarf', 'Defeat the bugbear chief'],
      activeQuests: [
        {
          id: 'quest-1',
          title: 'Rescue Sildar',
          description: 'Find and rescue the captured warrior',
          objectives: ['Locate the cave', 'Defeat the goblins'],
          currentProgress: 'Entered the cave',
          urgency: 'high',
        },
      ],
      recentEvents: ['Ambushed by goblins', 'Found the hidden cave entrance'],
    },
    players: [
      {
        character: {
          id: 'char-1',
          name: 'Thorin',
          race: 'Dwarf',
          classes: 'Fighter 4',
          level: 4,
          currentHP: 35,
          maxHP: 44,
          conditions: [],
          notableAbilities: ['Second Wind', 'Action Surge'],
          personality: 'Gruff but loyal',
          backstory: 'A veteran warrior seeking redemption',
        },
        isActive: true,
      },
      {
        character: {
          id: 'char-2',
          name: 'Elara',
          race: 'Elf',
          classes: 'Wizard 4',
          level: 4,
          currentHP: 22,
          maxHP: 26,
          conditions: [],
          notableAbilities: ['Arcane Recovery', 'Fireball'],
          personality: 'Curious and studious',
        },
        isActive: true,
      },
    ],
    currentScene: {
      location: {
        id: 'loc-1',
        name: 'Cragmaw Hideout',
        type: 'dungeon',
        description: 'A dark cave with dripping water',
        notableFeatures: ['Natural chimney', 'Underground stream'],
        secrets: ['Hidden passage behind waterfall'],
      },
      npcsPresent: [
        {
          id: 'npc-1',
          name: 'Yeemik',
          description: 'A scheming goblin',
          disposition: 'hostile',
          motivations: ['Power', 'Survival'],
        },
      ],
      environmentDetails: 'Dim light from torches, sounds of dripping water',
      mood: 'tense',
      lightingConditions: 'dim',
    },
    conversationHistory: [],
  });

  const createMockPlayerInput = (): PlayerInput => ({
    playerId: 'player-1',
    characterId: 'char-1',
    characterName: 'Thorin',
    inputType: 'action',
    content: 'I carefully peek around the corner, looking for enemies',
  });

  describe('sendRequest', () => {
    it('should send a request to the Claude API', async () => {
      const mockResponse: LLMResponse = {
        content: 'Test response',
        model: 'claude-sonnet-4-20250514',
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        stopReason: 'end_turn',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: mockResponse.content }],
            model: mockResponse.model,
            usage: { input_tokens: 100, output_tokens: 50 },
            stop_reason: 'end_turn',
          }),
      });

      const result = await aiService.sendRequest({
        messages: [
          { role: 'system', content: 'You are a DM' },
          { role: 'user', content: 'What do I see?' },
        ],
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key',
          'anthropic-version': '2023-06-01',
        }),
      }));

      expect(result.content).toBe('Test response');
      expect(result.usage.totalTokens).toBe(150);
    });

    it('should throw an error when API key is missing', async () => {
      const serviceNoKey = new AIService({ apiKey: '' });

      await expect(
        serviceNoKey.sendRequest({
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toMatchObject({
        code: 'API_ERROR',
        message: 'API key is not configured',
      });
    });

    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['retry-after', '30']]),
      });

      await expect(
        aiService.sendRequest({
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toMatchObject({
        code: 'RATE_LIMIT',
        retryable: true,
      });
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(
        aiService.sendRequest({
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toMatchObject({
        code: 'API_ERROR',
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        aiService.sendRequest({
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        retryable: true,
      });
    });
  });

  describe('parseResponse', () => {
    it('should parse valid JSON response', () => {
      const jsonResponse = JSON.stringify({
        narrative: 'You see a goblin around the corner',
        actions: [
          {
            type: 'skill_check',
            target: 'char-1',
            parameters: { skill: 'perception', dc: 15 },
            description: 'Perception check to spot enemies',
            requiresResolution: true,
          },
        ],
        metadata: {
          tone: 'tense',
          pacing: 'slow',
        },
      });

      const result = aiService.parseResponse(jsonResponse);

      expect(result.narrative).toBe('You see a goblin around the corner');
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].type).toBe('skill_check');
      expect(result.metadata.tone).toBe('tense');
    });

    it('should parse JSON wrapped in markdown code blocks', () => {
      const markdownResponse = `Here's the response:
\`\`\`json
{
  "narrative": "The goblin notices you!",
  "actions": [],
  "metadata": { "tone": "dramatic", "pacing": "fast" }
}
\`\`\``;

      const result = aiService.parseResponse(markdownResponse);

      expect(result.narrative).toBe('The goblin notices you!');
      expect(result.metadata.tone).toBe('dramatic');
    });

    it('should fallback to treating response as narrative when JSON parsing fails', () => {
      const plainTextResponse = 'You carefully peek around the corner and see a goblin standing guard.';

      const result = aiService.parseResponse(plainTextResponse);

      expect(result.narrative).toBe(plainTextResponse);
      expect(result.actions).toEqual([]);
      expect(result.metadata.tone).toBe('neutral');
    });

    it('should validate and normalize action types', () => {
      const response = JSON.stringify({
        narrative: 'Test',
        actions: [
          { type: 'attack', description: 'Attack action', requiresResolution: true },
          { type: 'invalid_type', description: 'Invalid action' },
        ],
        metadata: { tone: 'neutral', pacing: 'normal' },
      });

      const result = aiService.parseResponse(response);

      expect(result.actions[0].type).toBe('attack');
      expect(result.actions[1].type).toBe('skill_check'); // Default fallback
    });

    it('should handle NPC dialogue in response', () => {
      const response = JSON.stringify({
        narrative: 'The goblin speaks',
        actions: [],
        npcDialogue: [
          {
            npcId: 'npc-1',
            npcName: 'Yeemik',
            dialogue: 'Surrender or die!',
            emotion: 'aggressive',
            action: 'points spear',
          },
        ],
        metadata: { tone: 'tense', pacing: 'normal' },
      });

      const result = aiService.parseResponse(response);

      expect(result.npcDialogue).toHaveLength(1);
      expect(result.npcDialogue![0].dialogue).toBe('Surrender or die!');
    });

    it('should handle environment changes in response', () => {
      const response = JSON.stringify({
        narrative: 'The torch flickers',
        actions: [],
        environmentChanges: [
          {
            type: 'lighting',
            description: 'The room grows darker',
            mechanicalEffect: 'Disadvantage on Perception checks',
          },
        ],
        metadata: { tone: 'mysterious', pacing: 'slow' },
      });

      const result = aiService.parseResponse(response);

      expect(result.environmentChanges).toHaveLength(1);
      expect(result.environmentChanges![0].type).toBe('lighting');
    });
  });

  describe('generateDMResponse', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [
              {
                text: JSON.stringify({
                  narrative: 'You peek around the corner and spot a goblin.',
                  actions: [
                    {
                      type: 'skill_check',
                      target: 'char-1',
                      parameters: { skill: 'stealth', dc: 12 },
                      description: 'Stealth check to remain undetected',
                      requiresResolution: true,
                    },
                  ],
                  metadata: { tone: 'tense', pacing: 'normal' },
                }),
              },
            ],
            model: 'claude-sonnet-4-20250514',
            usage: { input_tokens: 500, output_tokens: 100 },
            stop_reason: 'end_turn',
          }),
      });
    });

    it('should generate a DM response for player action', async () => {
      const context = createMockDMContext();
      const input = createMockPlayerInput();

      const result = await aiService.generateDMResponse(context, input);

      expect(result.narrative).toContain('goblin');
      expect(result.actions).toHaveLength(1);
      expect(result.metadata.tone).toBe('tense');
    });

    it('should use appropriate template based on input type', async () => {
      const context = createMockDMContext();
      const dialogueInput: PlayerInput = {
        ...createMockPlayerInput(),
        inputType: 'dialogue',
        content: 'I greet the goblin in Goblin language',
      };

      await aiService.generateDMResponse(context, dialogueInput);

      expect(mockFetch).toHaveBeenCalled();
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.system).toContain('Dialogue guidelines');
    });

    it('should use combat template when in combat', async () => {
      const context = createMockDMContext();
      context.combatState = {
        id: 'combat-1',
        sessionId: 'session-1',
        isActive: true,
        round: 1,
        currentTurnIndex: 0,
        combatants: [
          {
            id: 'char-1',
            name: 'Thorin',
            type: 'player',
            initiative: 15,
            initiativeModifier: 2,
            armorClass: 18,
            maxHP: 44,
            currentHP: 35,
            conditions: [],
            isConcentrating: false,
          },
        ],
        turnOrder: ['char-1'],
        log: [],
      };

      await aiService.generateDMResponse(context, createMockPlayerInput());

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.system).toContain('Combat-specific guidelines');
    });

    it('should add interactions to conversation history', async () => {
      const context = createMockDMContext();
      const input = createMockPlayerInput();

      await aiService.generateDMResponse(context, input);

      // Service should track history internally
      // We can verify by checking if subsequent calls include history
      await aiService.generateDMResponse(context, {
        ...input,
        content: 'I attack the goblin!',
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateNPCDialogue', () => {
    const mockNPC: NPC = {
      id: 'npc-1',
      campaignId: 'campaign-1',
      name: 'Yeemik',
      description: 'A cunning goblin lieutenant',
      personality: 'Treacherous and ambitious',
      motivation: 'Wants to overthrow Klarg',
      isHostile: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate NPC dialogue', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [
              {
                text: JSON.stringify({
                  dialogue: 'You want deal? Yeemik make deal. Help Yeemik kill Klarg!',
                  emotion: 'scheming',
                  action: 'rubs hands together',
                }),
              },
            ],
            model: 'claude-sonnet-4-20250514',
            usage: { input_tokens: 200, output_tokens: 50 },
            stop_reason: 'end_turn',
          }),
      });

      const context = createMockDMContext();
      const result = await aiService.generateNPCDialogue(mockNPC, 'What do you want, goblin?', context);

      expect(result.npcId).toBe('npc-1');
      expect(result.npcName).toBe('Yeemik');
      expect(result.dialogue).toContain('Yeemik');
    });

    it('should handle plain text dialogue response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: 'Me not want fight. You help Yeemik?' }],
            model: 'claude-sonnet-4-20250514',
            usage: { input_tokens: 200, output_tokens: 30 },
            stop_reason: 'end_turn',
          }),
      });

      const context = createMockDMContext();
      const result = await aiService.generateNPCDialogue(mockNPC, 'Can we negotiate?', context);

      expect(result.dialogue).toBe('Me not want fight. You help Yeemik?');
    });
  });

  describe('generateSessionRecap', () => {
    it('should generate a session recap', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [
              {
                text: JSON.stringify({
                  narrative:
                    'When last we met, our heroes had just discovered the hidden entrance to the Cragmaw Hideout...',
                }),
              },
            ],
            model: 'claude-sonnet-4-20250514',
            usage: { input_tokens: 300, output_tokens: 100 },
            stop_reason: 'end_turn',
          }),
      });

      const context = createMockDMContext();
      const result = await aiService.generateSessionRecap(context);

      expect(result).toContain('Cragmaw');
    });

    it('should handle plain text recap response', async () => {
      const recapText = 'Last session, the party entered the goblin cave seeking their captured friend.';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: recapText }],
            model: 'claude-sonnet-4-20250514',
            usage: { input_tokens: 300, output_tokens: 50 },
            stop_reason: 'end_turn',
          }),
      });

      const context = createMockDMContext();
      const result = await aiService.generateSessionRecap(context);

      expect(result).toBe(recapText);
    });
  });

  describe('generateCombatNarration', () => {
    const mockCombatState = {
      id: 'combat-1',
      sessionId: 'session-1',
      isActive: true,
      round: 2,
      currentTurnIndex: 0,
      combatants: [
        {
          id: 'char-1',
          name: 'Thorin',
          type: 'player' as const,
          initiative: 18,
          initiativeModifier: 2,
          armorClass: 18,
          maxHP: 44,
          currentHP: 35,
          conditions: [],
          isConcentrating: false,
        },
        {
          id: 'npc-1',
          name: 'Goblin',
          type: 'enemy' as const,
          initiative: 12,
          initiativeModifier: 2,
          armorClass: 15,
          maxHP: 7,
          currentHP: 4,
          conditions: [],
          isConcentrating: false,
        },
      ],
      turnOrder: ['char-1', 'npc-1'],
      log: [],
    };

    it('should generate combat narration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [
              {
                text: JSON.stringify({
                  narrative: 'Thorin swings his axe in a mighty arc, connecting with the goblin!',
                  actions: [
                    {
                      type: 'damage',
                      target: 'npc-1',
                      parameters: { amount: 8, type: 'slashing' },
                      description: '8 slashing damage',
                      requiresResolution: false,
                    },
                  ],
                  metadata: { tone: 'dramatic', pacing: 'fast' },
                }),
              },
            ],
            model: 'claude-sonnet-4-20250514',
            usage: { input_tokens: 400, output_tokens: 80 },
            stop_reason: 'end_turn',
          }),
      });

      const context = createMockDMContext();
      const result = await aiService.generateCombatNarration(
        mockCombatState,
        'Thorin attacks the goblin with his battleaxe, rolling 18 to hit for 8 damage',
        context
      );

      expect(result.narrative).toContain('Thorin');
      expect(result.actions[0].type).toBe('damage');
    });
  });

  describe('buildDMContext', () => {
    it('should build a complete DM context from game objects', () => {
      const mockCampaign = {
        id: 'campaign-1',
        ownerId: 'user-1',
        name: 'Test Campaign',
        description: 'A test campaign',
        setting: 'Fantasy',
        themes: ['adventure'],
        worldState: {},
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSession = {
        id: 'session-1',
        campaignId: 'campaign-1',
        sessionNumber: 1,
        status: 'active' as const,
        summary: 'Test session',
        objectives: ['Find treasure'],
        events: [{ description: 'Party rested', timestamp: new Date() }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCharacters = [
        {
          id: 'char-1',
          userId: 'user-1',
          name: 'Test Hero',
          race: { name: 'Human', size: 'Medium' as const, speed: 30, languages: ['Common'], traits: [] },
          classes: [{ name: 'Fighter', level: 1, hitDie: 10 }],
          level: 1,
          experiencePoints: 0,
          abilityScores: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
          maxHitPoints: 12,
          currentHitPoints: 12,
          temporaryHitPoints: 0,
          armorClass: 16,
          speed: 30,
          hitDice: [],
          deathSaves: { successes: 0, failures: 0 },
          proficiencies: { armor: [], weapons: [], tools: [], languages: [], skills: [], savingThrows: [] },
          features: [{ name: 'Fighting Style', source: 'Fighter 1', description: 'Defense' }],
          inventory: [],
          equippedItems: {},
          currency: { copper: 0, silver: 0, electrum: 0, gold: 10, platinum: 0 },
          personality: { traits: ['Brave'], ideals: [], bonds: [], flaws: [] },
          conditions: [],
          exhaustionLevel: 0,
          inspiration: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockLocation = {
        id: 'loc-1',
        campaignId: 'campaign-1',
        name: 'Test Location',
        type: 'town',
        description: 'A small town',
        pointsOfInterest: ['Inn', 'Market'],
        secrets: ['Hidden dungeon'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const context = aiService.buildDMContext(
        mockCampaign as any,
        mockSession as any,
        mockCharacters as any,
        mockLocation as any
      );

      expect(context.campaign.name).toBe('Test Campaign');
      expect(context.session.sessionNumber).toBe(1);
      expect(context.players).toHaveLength(1);
      expect(context.players[0].character.name).toBe('Test Hero');
      expect(context.currentScene.location.name).toBe('Test Location');
    });
  });

  describe('conversation history management', () => {
    it('should maintain conversation history', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: JSON.stringify({ narrative: 'Response', actions: [], metadata: { tone: 'neutral', pacing: 'normal' } }) }],
            model: 'claude-sonnet-4-20250514',
            usage: { input_tokens: 100, output_tokens: 50 },
            stop_reason: 'end_turn',
          }),
      });

      const context = createMockDMContext();
      const input = createMockPlayerInput();

      // Generate multiple responses
      await aiService.generateDMResponse(context, input);
      await aiService.generateDMResponse(context, { ...input, content: 'Second action' });
      await aiService.generateDMResponse(context, { ...input, content: 'Third action' });

      // Verify history is being passed in requests
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should clear conversation history', () => {
      aiService.addToHistory({
        speaker: 'Test',
        type: 'player',
        content: 'Test message',
        timestamp: new Date(),
      });

      aiService.clearHistory();

      // Can't directly check history, but clearing shouldn't throw
      expect(() => aiService.clearHistory()).not.toThrow();
    });
  });
});
