import type { AbilityType, ActiveCondition, DamageType } from './dnd.types';

// ============================================
// Session Types
// ============================================

export type SessionStatus = 'preparing' | 'active' | 'paused' | 'ended';

export interface ConnectedPlayer {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  characterId?: string;
  characterName?: string;
  isReady: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  joinedAt: Date;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  locationId?: string;
  imageUrl?: string;
  ambiance?: {
    music?: string;
    sounds?: string[];
    lighting?: 'bright' | 'dim' | 'dark';
  };
}

export interface NarrativeContext {
  currentScene?: Scene;
  recentEvents: string[];
  activeNPCs: string[];
  pendingChoices?: Choice[];
  mood: 'tense' | 'calm' | 'action' | 'mystery' | 'social';
}

export interface Choice {
  id: string;
  text: string;
  type: 'action' | 'dialogue' | 'movement';
  requirements?: {
    skillCheck?: { skill: string; dc: number };
    abilityCheck?: { ability: AbilityType; dc: number };
    item?: string;
    other?: string;
  };
}

export interface GameSession {
  id: string;
  campaignId: string;

  // Status
  status: SessionStatus;
  startedAt?: Date;
  endedAt?: Date;

  // Participants
  connectedPlayers: ConnectedPlayer[];
  activeCharacterIds: string[];

  // Game State
  currentScene?: Scene;
  combatState?: CombatState;
  narrativeContext: NarrativeContext;

  // Voice
  voiceEnabled: boolean;

  // Metadata
  createdAt: Date;
}

// ============================================
// Combat Types
// ============================================

export type CombatStatus = 'initiative' | 'active' | 'ended';

export interface InitiativeEntry {
  id: string;
  name: string;
  type: 'player' | 'npc' | 'monster';
  entityId: string; // Character ID, NPC ID, or Monster instance ID
  initiative: number;
  dexterityModifier: number;
  isVisible: boolean; // For hidden enemies
}

export interface CombatantState {
  id: string;
  entityId: string;
  name: string;
  type: 'player' | 'npc' | 'monster';

  // Health
  currentHP: number;
  maxHP: number;
  tempHP: number;

  // State
  conditions: ActiveCondition[];
  concentratingOn?: string; // Spell name
  deathSaves?: { successes: number; failures: number };

  // Resources
  reactionsUsed: number;
  legendaryActionsUsed?: number;

  // Position (for grid-based combat)
  position?: GridPosition;
}

export interface GridPosition {
  x: number;
  y: number;
}

export interface Battlefield {
  width: number;
  height: number;
  terrain: TerrainCell[][];
  objects: BattlefieldObject[];
}

export interface TerrainCell {
  type: 'normal' | 'difficult' | 'hazard' | 'impassable' | 'water' | 'elevation';
  elevation?: number;
  hazardDamage?: string;
  hazardType?: DamageType;
}

export interface BattlefieldObject {
  id: string;
  name: string;
  position: GridPosition;
  size: { width: number; height: number };
  properties: {
    cover?: 'half' | 'three-quarters' | 'full';
    destructible?: boolean;
    hp?: number;
    interactable?: boolean;
  };
}

export interface EnvironmentalEffect {
  id: string;
  name: string;
  description: string;
  area?: GridPosition[];
  duration?: number; // In rounds
  effect: string;
}

export interface CombatState {
  id: string;
  sessionId: string;

  // Status
  status: CombatStatus;
  round: number;
  currentTurnIndex: number;

  // Combatants
  initiativeOrder: InitiativeEntry[];
  combatants: Record<string, CombatantState>;

  // Environment
  battlefield?: Battlefield;
  environmentalEffects: EnvironmentalEffect[];

  // History
  turnHistory: TurnRecord[];
}

export interface TurnRecord {
  round: number;
  combatantId: string;
  actions: ActionRecord[];
  timestamp: Date;
}

export interface ActionRecord {
  type: string;
  description: string;
  targets?: string[];
  rolls?: DiceRollRecord[];
  result: string;
}

// ============================================
// Combat Action Types
// ============================================

export type CombatActionType =
  | 'attack'
  | 'cast'
  | 'dash'
  | 'disengage'
  | 'dodge'
  | 'help'
  | 'hide'
  | 'ready'
  | 'search'
  | 'use-object'
  | 'other';

export interface CombatAction {
  type: CombatActionType;
  actorId: string;
  description?: string;
}

export interface AttackAction extends CombatAction {
  type: 'attack';
  targetId: string;
  weaponId?: string;
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface CastAction extends CombatAction {
  type: 'cast';
  spellId: string;
  spellLevel: number;
  targets: string[];
}

export interface MoveAction {
  actorId: string;
  destination: GridPosition;
  path?: GridPosition[];
}

// ============================================
// Action Results
// ============================================

export interface ActionResult {
  success: boolean;
  type: CombatActionType;
  narrative?: string;
  stateChanges?: StateChange[];
}

export interface AttackResult extends ActionResult {
  type: 'attack';
  attackRoll: DiceRollRecord;
  hit: boolean;
  critical: boolean;
  criticalMiss: boolean;
  damage?: DamageResult;
  target: string;
  attacker: string;
  weapon?: string;
}

export interface DamageResult {
  total: number;
  type: DamageType;
  rolls: DiceRollRecord[];
  resistanceApplied?: boolean;
  vulnerabilityApplied?: boolean;
  immunityApplied?: boolean;
}

export interface StateChange {
  type: 'hp' | 'condition' | 'position' | 'resource';
  targetId: string;
  change: unknown;
}

// ============================================
// Dice Roll Types
// ============================================

export interface DiceRollRecord {
  id: string;
  expression: string;
  rolls: number[];
  modifier: number;
  total: number;
  advantage?: boolean;
  disadvantage?: boolean;
  discardedRoll?: number;
  natural?: number; // For d20s
  rollerId: string;
  rollerName: string;
  reason?: string;
  timestamp: Date;
}

// ============================================
// Session Event Types
// ============================================

export type SessionEventType =
  | 'session:start'
  | 'session:pause'
  | 'session:resume'
  | 'session:end'
  | 'player:join'
  | 'player:leave'
  | 'player:ready'
  | 'narrative:text'
  | 'narrative:scene'
  | 'combat:start'
  | 'combat:initiative'
  | 'combat:turn'
  | 'combat:action'
  | 'combat:end'
  | 'dice:roll'
  | 'character:update'
  | 'chat:message'
  | 'voice:start'
  | 'voice:stop';

export interface SessionEvent {
  id: string;
  sessionId: string;
  type: SessionEventType;
  data: unknown;
  actorId?: string;
  timestamp: Date;
}

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'ic' | 'ooc' | 'system' | 'whisper'; // in-character, out-of-character
  recipientId?: string; // For whispers
  timestamp: Date;
}

// ============================================
// Session Summary
// ============================================

export interface SessionSummary {
  sessionId: string;
  campaignId: string;
  duration: number; // In minutes
  participants: string[];
  combatEncounters: number;
  experienceGained: number;
  notableEvents: string[];
  endingScene?: Scene;
}
