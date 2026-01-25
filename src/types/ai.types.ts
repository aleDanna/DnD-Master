// ============================================
// AI/LLM Integration Types
// ============================================

import type { Character } from './character.types';
import type { Campaign, NPC, Location, Quest } from './campaign.types';
import type { CombatState, GameSession } from './session.types';

// ============================================
// LLM Configuration Types
// ============================================

export interface LLMConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  stopSequences?: string[];
}

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  config?: Partial<LLMConfig>;
  metadata?: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  metadata?: Record<string, unknown>;
}

// ============================================
// DM Context Types
// ============================================

export interface DMContext {
  campaign: CampaignContext;
  session: SessionContext;
  players: PlayerContext[];
  currentScene: SceneContext;
  combatState?: CombatState;
  conversationHistory: ConversationEntry[];
}

export interface CampaignContext {
  id: string;
  name: string;
  description: string;
  setting: string;
  themes: string[];
  currentArc?: string;
  worldState: Record<string, unknown>;
}

export interface SessionContext {
  id: string;
  sessionNumber: number;
  summary?: string;
  objectives: string[];
  activeQuests: QuestContext[];
  recentEvents: string[];
}

export interface PlayerContext {
  character: CharacterSummary;
  isActive: boolean;
  lastAction?: string;
  intentions?: string;
}

export interface CharacterSummary {
  id: string;
  name: string;
  race: string;
  classes: string;
  level: number;
  currentHP: number;
  maxHP: number;
  conditions: string[];
  notableAbilities: string[];
  personality: string;
  backstory?: string;
}

export interface SceneContext {
  location: LocationContext;
  npcsPresent: NPCContext[];
  environmentDetails: string;
  mood: string;
  lightingConditions?: string;
  timeOfDay?: string;
  weather?: string;
}

export interface LocationContext {
  id: string;
  name: string;
  type: string;
  description: string;
  notableFeatures: string[];
  secrets?: string[];
}

export interface NPCContext {
  id: string;
  name: string;
  description: string;
  disposition: 'friendly' | 'neutral' | 'hostile';
  motivations: string[];
  secrets?: string[];
  currentState?: string;
}

export interface QuestContext {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  currentProgress: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConversationEntry {
  speaker: string;
  type: 'player' | 'dm' | 'npc' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    characterId?: string;
    npcId?: string;
    actionType?: string;
  };
}

// ============================================
// DM Response Types
// ============================================

export interface DMResponse {
  narrative: string;
  actions: GameAction[];
  npcDialogue?: NPCDialogue[];
  environmentChanges?: EnvironmentChange[];
  promptsForPlayers?: PlayerPrompt[];
  metadata: ResponseMetadata;
}

export interface GameAction {
  type: GameActionType;
  target?: string;
  parameters: Record<string, unknown>;
  description: string;
  requiresResolution: boolean;
}

export type GameActionType =
  | 'skill_check'
  | 'saving_throw'
  | 'attack'
  | 'damage'
  | 'healing'
  | 'condition_apply'
  | 'condition_remove'
  | 'initiative'
  | 'combat_start'
  | 'combat_end'
  | 'item_give'
  | 'item_remove'
  | 'experience_award'
  | 'gold_award'
  | 'quest_update'
  | 'scene_change'
  | 'npc_spawn'
  | 'rest_short'
  | 'rest_long';

export interface NPCDialogue {
  npcId: string;
  npcName: string;
  dialogue: string;
  emotion?: string;
  action?: string;
}

export interface EnvironmentChange {
  type: 'weather' | 'lighting' | 'time' | 'location' | 'atmosphere' | 'discovery';
  description: string;
  mechanicalEffect?: string;
}

export interface PlayerPrompt {
  targetCharacterId?: string;
  prompt: string;
  suggestedActions?: string[];
  requiredResponse: boolean;
  timeout?: number;
}

export interface ResponseMetadata {
  tone: 'dramatic' | 'humorous' | 'tense' | 'mysterious' | 'neutral';
  pacing: 'slow' | 'normal' | 'fast';
  suggestedMusicMood?: string;
  visualDescription?: string;
}

// ============================================
// Player Input Types
// ============================================

export interface PlayerInput {
  playerId: string;
  characterId: string;
  characterName: string;
  inputType: PlayerInputType;
  content: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export type PlayerInputType =
  | 'action'
  | 'dialogue'
  | 'question'
  | 'skill_use'
  | 'spell_cast'
  | 'attack'
  | 'movement'
  | 'interaction'
  | 'investigation'
  | 'roleplay';

// ============================================
// Prompt Template Types
// ============================================

export interface PromptTemplate {
  id: string;
  name: string;
  category: PromptCategory;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  examples?: PromptExample[];
}

export type PromptCategory =
  | 'narration'
  | 'combat'
  | 'dialogue'
  | 'exploration'
  | 'puzzle'
  | 'social'
  | 'downtime'
  | 'session_start'
  | 'session_end';

export interface PromptExample {
  input: string;
  output: string;
}

// ============================================
// AI Service Events
// ============================================

export interface AIServiceEvent {
  type: AIEventType;
  timestamp: Date;
  sessionId: string;
  data: Record<string, unknown>;
}

export type AIEventType =
  | 'request_started'
  | 'request_completed'
  | 'request_failed'
  | 'context_updated'
  | 'response_processed'
  | 'action_executed';

// ============================================
// Error Types
// ============================================

export interface AIError {
  code: AIErrorCode;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export type AIErrorCode =
  | 'API_ERROR'
  | 'RATE_LIMIT'
  | 'INVALID_RESPONSE'
  | 'CONTEXT_TOO_LONG'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR';
