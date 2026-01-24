# DnD-Master Architecture Document

## Executive Summary

DnD-Master is an AI-powered Dungeon Master application that provides immersive, voice-enabled Dungeons & Dragons 5th Edition gameplay experiences. The system combines real-time voice interaction, comprehensive D&D rules engine, and intelligent narrative generation to create dynamic tabletop RPG sessions.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Core Components](#3-core-components)
4. [Data Models](#4-data-models)
5. [API Design](#5-api-design)
6. [Real-Time Communication](#6-real-time-communication)
7. [Game Engine](#7-game-engine)
8. [AI/LLM Integration](#8-aillm-integration)
9. [Persistence Layer](#9-persistence-layer)
10. [Security & Authentication](#10-security--authentication)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Technology Stack](#12-technology-stack)

---

## 1. System Overview

### 1.1 Vision

Create an intelligent virtual Dungeon Master that can:
- Conduct voice-based D&D sessions in real-time
- Manage all game mechanics according to D&D 5e rules
- Generate dynamic narratives and adapt to player choices
- Track campaign state, characters, and world lore
- Provide an immersive, accessible gaming experience

### 1.2 Key Features

| Feature | Description |
|---------|-------------|
| **Voice Interaction** | Real-time speech-to-text and text-to-speech for natural conversation |
| **Character Management** | Full D&D 5e character creation, leveling, and tracking |
| **Combat System** | Turn-based combat with initiative, actions, and conditions |
| **Dice Engine** | Comprehensive dice rolling with modifiers and advantage/disadvantage |
| **Campaign Management** | Persistent campaigns with session history and world state |
| **Narrative AI** | Dynamic story generation that responds to player actions |
| **Rules Engine** | Automated D&D 5e rules adjudication |

### 1.3 User Roles

- **Player**: Participates in sessions, controls character(s)
- **Human DM** (optional): Can override AI decisions, co-DM with AI
- **Spectator**: Can observe sessions without participating

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web App   │  │ Mobile App  │  │  Voice UI   │  │   Discord   │        │
│  │  (Next.js)  │  │  (Future)   │  │  (WebRTC)   │  │    Bot      │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          └────────────────┴────────┬───────┴────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────────┐
│                           API GATEWAY LAYER                                  │
├───────────────────────────────────┼─────────────────────────────────────────┤
│  ┌────────────────────────────────┴────────────────────────────────────┐    │
│  │                        Next.js API Routes                            │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │   REST   │  │ WebSocket│  │  Auth    │  │  Rate    │            │    │
│  │  │   APIs   │  │  Server  │  │ Middleware│ │ Limiting │            │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────────┐
│                           SERVICE LAYER                                      │
├───────────────────────────────────┼─────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Session   │  │  Character │  │   Combat   │  │  Campaign  │            │
│  │  Service   │  │  Service   │  │   Service  │  │  Service   │            │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Dice     │  │   Voice    │  │ Narrative  │  │   Rules    │            │
│  │  Service   │  │  Service   │  │  Service   │  │   Engine   │            │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────────┐
│                         AI/ML LAYER                                          │
├───────────────────────────────────┼─────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  │   LLM Client   │  │  Speech-to-Text│  │  Text-to-Speech│                 │
│  │  (Claude/GPT)  │  │   (Whisper)    │  │   (ElevenLabs) │                 │
│  └────────────────┘  └────────────────┘  └────────────────┘                 │
│  ┌────────────────┐  ┌────────────────┐                                     │
│  │ Context Manager│  │ Prompt Builder │                                     │
│  └────────────────┘  └────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────────┐
│                         DATA LAYER                                           │
├───────────────────────────────────┼─────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  │   PostgreSQL   │  │     Redis      │  │  File Storage  │                 │
│  │  (Primary DB)  │  │ (Cache/Pubsub) │  │   (S3/Local)   │                 │
│  └────────────────┘  └────────────────┘  └────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Components

### 3.1 Frontend Components

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Main application
│   │   ├── campaigns/            # Campaign management
│   │   ├── characters/           # Character sheets
│   │   ├── sessions/             # Active game sessions
│   │   └── settings/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── campaigns/
│   │   ├── characters/
│   │   ├── combat/
│   │   ├── dice/
│   │   ├── sessions/
│   │   └── voice/
│   └── play/[sessionId]/         # Live game interface
│
├── components/
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── character/                # Character-related components
│   │   ├── CharacterSheet.tsx
│   │   ├── CharacterCreator.tsx
│   │   ├── AbilityScores.tsx
│   │   ├── SkillsList.tsx
│   │   ├── SpellBook.tsx
│   │   └── Inventory.tsx
│   ├── combat/                   # Combat interface
│   │   ├── CombatTracker.tsx
│   │   ├── InitiativeOrder.tsx
│   │   ├── ActionPanel.tsx
│   │   └── BattleMap.tsx
│   ├── session/                  # Game session components
│   │   ├── GameInterface.tsx
│   │   ├── NarrativeDisplay.tsx
│   │   ├── VoiceControls.tsx
│   │   └── ChatLog.tsx
│   └── dice/                     # Dice components
│       ├── DiceRoller.tsx
│       ├── DiceResult.tsx
│       └── Dice3D.tsx
│
├── lib/                          # Shared utilities
│   ├── api/                      # API client functions
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Helper functions
│   └── constants/                # App constants
│
└── types/                        # TypeScript definitions
    ├── Character.types.ts
    ├── Campaign.types.ts
    ├── Combat.types.ts
    ├── Session.types.ts
    └── DnD.types.ts
```

### 3.2 Backend Services

#### 3.2.1 Session Service
Manages active game sessions and player connections.

```typescript
interface SessionService {
  createSession(campaignId: string, config: SessionConfig): Promise<Session>;
  joinSession(sessionId: string, userId: string): Promise<void>;
  leaveSession(sessionId: string, userId: string): Promise<void>;
  getSessionState(sessionId: string): Promise<SessionState>;
  broadcastEvent(sessionId: string, event: GameEvent): Promise<void>;
  endSession(sessionId: string): Promise<SessionSummary>;
}
```

#### 3.2.2 Character Service
Handles character creation, updates, and validation.

```typescript
interface CharacterService {
  createCharacter(data: CharacterCreationData): Promise<Character>;
  updateCharacter(id: string, updates: Partial<Character>): Promise<Character>;
  validateCharacter(character: Character): ValidationResult;
  calculateDerivedStats(character: Character): DerivedStats;
  levelUp(characterId: string, choices: LevelUpChoices): Promise<Character>;
  applyDamage(characterId: string, damage: Damage): Promise<Character>;
  rest(characterId: string, restType: 'short' | 'long'): Promise<Character>;
}
```

#### 3.2.3 Combat Service
Manages combat encounters and turn-based actions.

```typescript
interface CombatService {
  initiateCombat(sessionId: string, combatants: Combatant[]): Promise<Combat>;
  rollInitiative(combatId: string): Promise<InitiativeOrder>;
  executeAction(combatId: string, action: CombatAction): Promise<ActionResult>;
  applyCondition(combatId: string, target: string, condition: Condition): Promise<void>;
  nextTurn(combatId: string): Promise<TurnInfo>;
  endCombat(combatId: string): Promise<CombatSummary>;
}
```

#### 3.2.4 Dice Service
Provides dice rolling functionality with full D&D support.

```typescript
interface DiceService {
  roll(expression: string): DiceResult;           // e.g., "2d6+3"
  rollWithAdvantage(expression: string): DiceResult;
  rollWithDisadvantage(expression: string): DiceResult;
  rollAbilityScores(): AbilityScoreRolls;
  rollInitiative(modifier: number): number;
  rollAttack(attackBonus: number, options?: AttackOptions): AttackResult;
  rollDamage(damageExpression: string, critical?: boolean): DamageResult;
  rollSavingThrow(modifier: number, dc: number): SavingThrowResult;
  rollSkillCheck(modifier: number, dc?: number): SkillCheckResult;
}
```

#### 3.2.5 Rules Engine
Enforces D&D 5e rules and game mechanics.

```typescript
interface RulesEngine {
  // Ability Scores
  calculateModifier(score: number): number;
  calculateProficiencyBonus(level: number): number;

  // Combat
  calculateArmorClass(character: Character): number;
  calculateAttackBonus(character: Character, weapon: Weapon): number;
  calculateDamageBonus(character: Character, weapon: Weapon): number;
  calculateSpellDC(character: Character): number;

  // Movement & Actions
  getAvailableActions(character: Character, context: CombatContext): Action[];
  validateAction(action: CombatAction, context: CombatContext): ValidationResult;

  // Spellcasting
  canCastSpell(character: Character, spell: Spell): boolean;
  getSpellSlots(character: Character): SpellSlots;
  consumeSpellSlot(character: Character, level: number): void;

  // Conditions
  applyConditionEffects(character: Character, condition: Condition): ConditionEffects;
  checkConcentration(character: Character, damage: number): boolean;
}
```

---

## 4. Data Models

### 4.1 Core Entities

#### Character
```typescript
interface Character {
  id: string;
  userId: string;
  campaignId?: string;

  // Basic Info
  name: string;
  race: Race;
  class: CharacterClass[];  // Support multiclassing
  level: number;
  experiencePoints: number;
  background: Background;
  alignment: Alignment;

  // Ability Scores
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };

  // Combat Stats
  maxHitPoints: number;
  currentHitPoints: number;
  temporaryHitPoints: number;
  armorClass: number;
  initiative: number;
  speed: number;
  hitDice: HitDice[];
  deathSaves: DeathSaves;

  // Proficiencies
  savingThrowProficiencies: AbilityType[];
  skillProficiencies: Skill[];
  toolProficiencies: string[];
  weaponProficiencies: WeaponType[];
  armorProficiencies: ArmorType[];
  languages: string[];

  // Features & Traits
  racialTraits: Trait[];
  classFeatures: Feature[];
  feats: Feat[];

  // Equipment
  inventory: InventoryItem[];
  equippedItems: EquippedItems;
  currency: Currency;

  // Spellcasting (if applicable)
  spellcasting?: {
    spellcastingAbility: AbilityType;
    spellSlots: SpellSlots;
    spellsKnown: Spell[];
    preparedSpells: string[];  // spell IDs
    cantripsKnown: Spell[];
  };

  // Character Details
  personalityTraits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
  backstory: string;
  appearance: CharacterAppearance;

  // State
  conditions: Condition[];
  exhaustionLevel: number;
  inspiration: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

#### Campaign
```typescript
interface Campaign {
  id: string;
  ownerId: string;

  // Basic Info
  name: string;
  description: string;
  setting: string;
  startingLevel: number;

  // Participants
  players: CampaignPlayer[];
  characters: string[];  // character IDs

  // World State
  worldState: WorldState;
  npcs: NPC[];
  locations: Location[];
  factions: Faction[];
  quests: Quest[];

  // Session History
  sessions: SessionRecord[];
  currentSessionId?: string;

  // Configuration
  settings: CampaignSettings;
  houseRules: HouseRule[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'paused' | 'completed';
}
```

#### Session
```typescript
interface Session {
  id: string;
  campaignId: string;

  // State
  status: 'preparing' | 'active' | 'paused' | 'ended';
  startedAt?: Date;
  endedAt?: Date;

  // Participants
  connectedPlayers: ConnectedPlayer[];
  activeCharacters: string[];

  // Game State
  currentScene: Scene;
  combatState?: CombatState;
  narrativeContext: NarrativeContext;

  // History
  eventLog: GameEvent[];
  chatLog: ChatMessage[];
  diceRolls: DiceRollRecord[];

  // Voice
  voiceChannelId?: string;
  voiceEnabled: boolean;
}
```

#### Combat State
```typescript
interface CombatState {
  id: string;
  sessionId: string;

  // Status
  status: 'initiative' | 'active' | 'ended';
  round: number;
  currentTurnIndex: number;

  // Combatants
  initiativeOrder: InitiativeEntry[];
  combatants: Map<string, CombatantState>;

  // Environment
  battlefield?: BattlefieldState;
  environmentalEffects: EnvironmentalEffect[];

  // History
  turnHistory: TurnRecord[];
}

interface InitiativeEntry {
  id: string;
  name: string;
  type: 'player' | 'npc' | 'monster';
  initiative: number;
  dexterityModifier: number;
}

interface CombatantState {
  id: string;
  currentHP: number;
  maxHP: number;
  tempHP: number;
  conditions: ActiveCondition[];
  concentratingOn?: string;
  reactions: number;
  position?: GridPosition;
}
```

### 4.2 D&D Reference Data

```typescript
// Races
interface Race {
  id: string;
  name: string;
  abilityScoreIncreases: Partial<AbilityScores>;
  size: 'Small' | 'Medium';
  speed: number;
  traits: RacialTrait[];
  languages: string[];
  subraces?: Subrace[];
}

// Classes
interface CharacterClass {
  id: string;
  name: string;
  hitDie: number;
  primaryAbility: AbilityType[];
  savingThrows: AbilityType[];
  armorProficiencies: ArmorType[];
  weaponProficiencies: WeaponType[];
  skillChoices: { options: Skill[]; count: number };
  features: ClassFeature[];
  subclasses: Subclass[];
  spellcasting?: SpellcastingProgression;
}

// Spells
interface Spell {
  id: string;
  name: string;
  level: number;  // 0 for cantrips
  school: SpellSchool;
  castingTime: string;
  range: string;
  components: SpellComponents;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevels?: string;
  classes: string[];
}

// Equipment
interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  damage: string;
  damageType: DamageType;
  properties: WeaponProperty[];
  weight: number;
  cost: Cost;
  range?: { normal: number; long: number };
}

interface Armor {
  id: string;
  name: string;
  type: ArmorType;
  baseAC: number;
  dexBonus: boolean;
  maxDexBonus?: number;
  strengthRequirement?: number;
  stealthDisadvantage: boolean;
  weight: number;
  cost: Cost;
}

// Monsters
interface Monster {
  id: string;
  name: string;
  size: CreatureSize;
  type: CreatureType;
  alignment: string;
  armorClass: number;
  armorType?: string;
  hitPoints: number;
  hitDice: string;
  speed: SpeedMap;
  abilityScores: AbilityScores;
  savingThrows?: Partial<AbilityScores>;
  skills?: SkillMap;
  damageResistances?: DamageType[];
  damageImmunities?: DamageType[];
  conditionImmunities?: ConditionType[];
  senses: SenseMap;
  languages: string[];
  challengeRating: number;
  experiencePoints: number;
  traits?: MonsterTrait[];
  actions: MonsterAction[];
  legendaryActions?: LegendaryAction[];
  reactions?: MonsterReaction[];
}
```

---

## 5. API Design

### 5.1 REST Endpoints

#### Authentication
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login
POST   /api/auth/logout            # Logout
POST   /api/auth/refresh           # Refresh token
GET    /api/auth/me                # Get current user
```

#### Characters
```
GET    /api/characters             # List user's characters
POST   /api/characters             # Create character
GET    /api/characters/:id         # Get character
PUT    /api/characters/:id         # Update character
DELETE /api/characters/:id         # Delete character
POST   /api/characters/:id/levelup # Level up character
POST   /api/characters/:id/rest    # Rest (short/long)
```

#### Campaigns
```
GET    /api/campaigns              # List campaigns
POST   /api/campaigns              # Create campaign
GET    /api/campaigns/:id          # Get campaign
PUT    /api/campaigns/:id          # Update campaign
DELETE /api/campaigns/:id          # Delete campaign
POST   /api/campaigns/:id/join     # Join campaign
POST   /api/campaigns/:id/leave    # Leave campaign
GET    /api/campaigns/:id/state    # Get world state
```

#### Sessions
```
GET    /api/sessions               # List sessions
POST   /api/sessions               # Create session
GET    /api/sessions/:id           # Get session
PUT    /api/sessions/:id           # Update session
POST   /api/sessions/:id/start     # Start session
POST   /api/sessions/:id/pause     # Pause session
POST   /api/sessions/:id/end       # End session
GET    /api/sessions/:id/state     # Get current state
```

#### Combat
```
POST   /api/combat/initiate        # Start combat
GET    /api/combat/:id             # Get combat state
POST   /api/combat/:id/initiative  # Roll initiative
POST   /api/combat/:id/action      # Execute action
POST   /api/combat/:id/next-turn   # Advance turn
POST   /api/combat/:id/end         # End combat
```

#### Dice
```
POST   /api/dice/roll              # Roll dice
POST   /api/dice/attack            # Attack roll
POST   /api/dice/damage            # Damage roll
POST   /api/dice/save              # Saving throw
POST   /api/dice/check             # Ability/skill check
```

### 5.2 WebSocket Events

#### Client -> Server
```typescript
// Session Events
{ type: 'session:join', sessionId: string }
{ type: 'session:leave', sessionId: string }
{ type: 'session:ready', characterId: string }

// Game Actions
{ type: 'action:speak', message: string }
{ type: 'action:move', destination: GridPosition }
{ type: 'action:attack', targetId: string, weaponId?: string }
{ type: 'action:cast', spellId: string, targets: string[] }
{ type: 'action:use', itemId: string, targetId?: string }
{ type: 'action:custom', description: string }

// Voice Events
{ type: 'voice:start' }
{ type: 'voice:stop' }
{ type: 'voice:audio', data: ArrayBuffer }

// Dice
{ type: 'dice:roll', expression: string, reason?: string }
```

#### Server -> Client
```typescript
// Session Events
{ type: 'session:joined', sessionState: SessionState }
{ type: 'session:player-joined', player: Player }
{ type: 'session:player-left', playerId: string }
{ type: 'session:state-update', state: Partial<SessionState> }

// Narrative
{ type: 'narrative:text', content: string, speaker?: string }
{ type: 'narrative:scene', scene: Scene }
{ type: 'narrative:choice', choices: Choice[] }

// Combat Events
{ type: 'combat:started', combat: CombatState }
{ type: 'combat:initiative', order: InitiativeEntry[] }
{ type: 'combat:turn', combatantId: string, actions: AvailableActions }
{ type: 'combat:action', result: ActionResult }
{ type: 'combat:ended', summary: CombatSummary }

// Voice Events
{ type: 'voice:dm-speaking', audioUrl: string }
{ type: 'voice:transcription', text: string, speaker: string }

// Dice Events
{ type: 'dice:result', result: DiceResult, roller: string }
```

---

## 6. Real-Time Communication

### 6.1 Voice Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Player    │────▶│   Media Server  │────▶│  Speech-to-Text │
│   Browser   │     │   (WebRTC SFU)  │     │    (Whisper)    │
└─────────────┘     └─────────────────┘     └────────┬────────┘
       ▲                                             │
       │                                             ▼
       │            ┌─────────────────┐     ┌─────────────────┐
       │◀───────────│  Text-to-Speech │◀────│    LLM Engine   │
       │            │   (ElevenLabs)  │     │    (Claude)     │
       │            └─────────────────┘     └─────────────────┘
       │
       └─────────────────────────────────────────────┘
                     Audio Streams
```

### 6.2 Voice Processing Pipeline

```typescript
interface VoiceService {
  // Input Processing
  startListening(sessionId: string, userId: string): Promise<void>;
  stopListening(sessionId: string, userId: string): Promise<void>;
  processAudioChunk(chunk: AudioChunk): Promise<void>;

  // Speech-to-Text
  transcribe(audio: AudioBuffer): Promise<TranscriptionResult>;
  detectSpeaker(audio: AudioBuffer, knownSpeakers: Speaker[]): Speaker;

  // Text-to-Speech
  synthesizeSpeech(text: string, voice: VoiceConfig): Promise<AudioBuffer>;
  streamSpeech(text: string, voice: VoiceConfig): AsyncIterable<AudioChunk>;

  // Voice Configuration
  setDMVoice(config: VoiceConfig): void;
  setNPCVoice(npcId: string, config: VoiceConfig): void;
}

interface VoiceConfig {
  provider: 'elevenlabs' | 'azure' | 'google';
  voiceId: string;
  speed: number;
  pitch: number;
  language: string;
}
```

### 6.3 WebSocket Connection Management

```typescript
class SessionConnectionManager {
  private connections: Map<string, WebSocket[]>;
  private redis: Redis;

  async joinSession(sessionId: string, ws: WebSocket, userId: string) {
    // Add to local connections
    this.addConnection(sessionId, ws);

    // Subscribe to Redis pub/sub for cross-server communication
    await this.redis.subscribe(`session:${sessionId}`);

    // Notify other participants
    this.broadcast(sessionId, {
      type: 'session:player-joined',
      player: await this.getPlayer(userId)
    });
  }

  async broadcast(sessionId: string, event: GameEvent) {
    // Local broadcast
    const connections = this.connections.get(sessionId) || [];
    connections.forEach(ws => ws.send(JSON.stringify(event)));

    // Cross-server broadcast via Redis
    await this.redis.publish(`session:${sessionId}`, JSON.stringify(event));
  }
}
```

---

## 7. Game Engine

### 7.1 Turn Resolution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      TURN RESOLUTION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Turn Start   │───▶│ Process      │───▶│ Validate     │      │
│  │ Effects      │    │ Conditions   │    │ Available    │      │
│  │              │    │              │    │ Actions      │      │
│  └──────────────┘    └──────────────┘    └──────┬───────┘      │
│                                                  │               │
│                                                  ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Turn End     │◀───│ Apply        │◀───│ Execute      │      │
│  │ Cleanup      │    │ Results      │    │ Action       │      │
│  │              │    │              │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Action Resolution Engine

```typescript
class ActionResolver {
  constructor(
    private rulesEngine: RulesEngine,
    private diceService: DiceService,
    private narrativeService: NarrativeService
  ) {}

  async resolveAction(
    action: CombatAction,
    context: CombatContext
  ): Promise<ActionResult> {
    // 1. Validate action is legal
    const validation = this.rulesEngine.validateAction(action, context);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 2. Resolve based on action type
    let result: ActionResult;
    switch (action.type) {
      case 'attack':
        result = await this.resolveAttack(action as AttackAction, context);
        break;
      case 'cast':
        result = await this.resolveCast(action as CastAction, context);
        break;
      case 'move':
        result = await this.resolveMovement(action as MoveAction, context);
        break;
      case 'custom':
        result = await this.resolveCustomAction(action as CustomAction, context);
        break;
      // ... other action types
    }

    // 3. Apply results to game state
    await this.applyResults(result, context);

    // 4. Generate narrative description
    result.narrative = await this.narrativeService.describeAction(result);

    return result;
  }

  private async resolveAttack(
    action: AttackAction,
    context: CombatContext
  ): Promise<AttackResult> {
    const attacker = context.getCombatant(action.attackerId);
    const target = context.getCombatant(action.targetId);
    const weapon = action.weaponId
      ? attacker.getWeapon(action.weaponId)
      : attacker.getUnarmedStrike();

    // Calculate attack roll
    const attackBonus = this.rulesEngine.calculateAttackBonus(attacker, weapon);
    const attackRoll = this.diceService.rollAttack(attackBonus, {
      advantage: context.hasAdvantage(attacker, target),
      disadvantage: context.hasDisadvantage(attacker, target)
    });

    const hit = attackRoll.total >= target.armorClass;
    const critical = attackRoll.natural === 20;
    const criticalMiss = attackRoll.natural === 1;

    let damage: DamageResult | undefined;
    if (hit && !criticalMiss) {
      const damageBonus = this.rulesEngine.calculateDamageBonus(attacker, weapon);
      damage = this.diceService.rollDamage(
        weapon.damage + '+' + damageBonus,
        critical
      );
    }

    return {
      type: 'attack',
      success: hit,
      attackRoll,
      damage,
      critical,
      criticalMiss,
      attacker: attacker.id,
      target: target.id,
      weapon: weapon.name
    };
  }
}
```

### 7.3 Condition System

```typescript
interface ConditionManager {
  conditions: Map<ConditionType, ConditionDefinition>;

  applyCondition(
    target: Combatant,
    condition: ConditionType,
    source?: string,
    duration?: Duration
  ): ActiveCondition;

  removeCondition(target: Combatant, conditionId: string): void;

  processConditions(target: Combatant, trigger: ConditionTrigger): ConditionEffect[];

  checkSave(target: Combatant, condition: ActiveCondition): boolean;
}

// D&D 5e Conditions
type ConditionType =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'exhaustion'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious';

interface ConditionDefinition {
  type: ConditionType;
  effects: ConditionEffect[];
  endConditions?: EndCondition[];
}

// Example: Prone condition
const proneCondition: ConditionDefinition = {
  type: 'prone',
  effects: [
    { type: 'movement', modifier: 'crawl' },  // Movement costs double
    { type: 'attack', modifier: 'disadvantage' },
    { type: 'melee_defense', modifier: 'disadvantage' },  // Melee attacks have advantage
    { type: 'ranged_defense', modifier: 'advantage' }  // Ranged attacks have disadvantage
  ],
  endConditions: [
    { type: 'action', action: 'stand' }  // Can use half movement to stand
  ]
};
```

---

## 8. AI/LLM Integration

### 8.1 AI DM Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI DM SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Context Manager                        │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│  │  │Campaign │  │ Session │  │Character│  │  World  │    │   │
│  │  │ Context │  │ History │  │  Data   │  │  State  │    │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Prompt Builder                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   System    │  │   Dynamic   │  │    Rules    │     │   │
│  │  │   Prompt    │  │   Context   │  │  Reference  │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     LLM Interface                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   Claude    │  │   OpenAI    │  │   Local     │     │   │
│  │  │   Client    │  │   Client    │  │   (Ollama)  │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Response Processor                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │  Narrative  │  │   Action    │  │    State    │     │   │
│  │  │  Extractor  │  │   Parser    │  │   Updater   │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Prompt Engineering

```typescript
class PromptBuilder {
  buildDMPrompt(context: GameContext): string {
    return `
# Role
You are an expert Dungeon Master running a D&D 5th Edition campaign. Your role is to:
- Narrate the story engagingly and descriptively
- Control all NPCs and monsters with distinct personalities
- Adjudicate rules fairly while prioritizing fun
- React dynamically to player actions
- Maintain campaign consistency and continuity

# Campaign Context
${this.formatCampaignContext(context.campaign)}

# Current Scene
${this.formatScene(context.currentScene)}

# Active Characters
${this.formatCharacters(context.characters)}

# Recent Events
${this.formatRecentEvents(context.eventLog)}

# Current Situation
${context.currentSituation}

# Rules Reference
${this.getRelevantRules(context)}

# Instructions
- Respond in character as the DM
- Describe outcomes vividly but concisely
- When dice rolls are needed, specify the type (e.g., "Roll a Perception check")
- If combat should begin, declare "COMBAT INITIATED" with combatants
- Track NPC reactions based on their personalities
- Maintain the tone: ${context.campaign.settings.tone}

# Player Action
${context.playerAction}

Respond as the DM:`;
  }

  buildNPCPrompt(npc: NPC, context: ConversationContext): string {
    return `
# Character
You are ${npc.name}, ${npc.description}

# Personality
${npc.personality}

# Knowledge
${this.formatNPCKnowledge(npc, context)}

# Goals
${npc.goals.join('\n')}

# Current Situation
${context.situation}

# Speaking With
${this.formatSpeakers(context.speakers)}

# Conversation So Far
${this.formatConversation(context.conversationLog)}

# Player Says
"${context.playerStatement}"

Respond in character as ${npc.name}. Keep response concise (1-3 sentences unless more is needed):`;
  }
}
```

### 8.3 Response Processing

```typescript
interface DMResponse {
  narrative: string;
  actions?: DMAction[];
  diceRequests?: DiceRequest[];
  stateChanges?: StateChange[];
  combatInitiation?: CombatInitiation;
  npcDialogue?: NPCDialogue[];
}

class ResponseProcessor {
  parseResponse(rawResponse: string, context: GameContext): DMResponse {
    const response: DMResponse = {
      narrative: this.extractNarrative(rawResponse)
    };

    // Parse combat initiation
    if (rawResponse.includes('COMBAT INITIATED')) {
      response.combatInitiation = this.parseCombatInitiation(rawResponse);
    }

    // Parse dice requests
    const diceMatches = rawResponse.matchAll(/\[ROLL:\s*(.+?)\]/g);
    response.diceRequests = Array.from(diceMatches).map(m =>
      this.parseDiceRequest(m[1])
    );

    // Parse state changes
    response.stateChanges = this.parseStateChanges(rawResponse, context);

    // Parse NPC dialogue
    response.npcDialogue = this.parseNPCDialogue(rawResponse);

    return response;
  }

  private parseDiceRequest(request: string): DiceRequest {
    // Examples: "Perception check DC 15", "Attack roll", "2d6 fire damage"
    const patterns = {
      abilityCheck: /(\w+)\s+check(?:\s+DC\s*(\d+))?/i,
      savingThrow: /(\w+)\s+(?:saving throw|save)(?:\s+DC\s*(\d+))?/i,
      attackRoll: /attack\s+roll/i,
      damage: /(\d+d\d+(?:\+\d+)?)\s+(\w+)\s+damage/i
    };

    // ... parsing logic
  }
}
```

---

## 9. Persistence Layer

### 9.1 Database Schema (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Characters
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  race JSONB NOT NULL,
  classes JSONB NOT NULL,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  ability_scores JSONB NOT NULL,
  max_hit_points INTEGER NOT NULL,
  current_hit_points INTEGER NOT NULL,
  temporary_hit_points INTEGER DEFAULT 0,
  proficiencies JSONB NOT NULL,
  features JSONB DEFAULT '[]',
  equipment JSONB DEFAULT '[]',
  spellcasting JSONB,
  personality JSONB DEFAULT '{}',
  backstory TEXT,
  conditions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  setting TEXT,
  world_state JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Players
CREATE TABLE campaign_players (
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  role VARCHAR(20) DEFAULT 'player',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (campaign_id, user_id)
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'preparing',
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  game_state JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session Events (for audit/replay)
CREATE TABLE session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  actor_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NPCs
CREATE TABLE npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  personality TEXT,
  stats JSONB,
  location_id UUID,
  knowledge JSONB DEFAULT '[]',
  relationships JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  parent_location_id UUID REFERENCES locations(id),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_characters_user ON characters(user_id);
CREATE INDEX idx_characters_campaign ON characters(campaign_id);
CREATE INDEX idx_sessions_campaign ON sessions(campaign_id);
CREATE INDEX idx_session_events_session ON session_events(session_id);
CREATE INDEX idx_session_events_created ON session_events(created_at);
CREATE INDEX idx_npcs_campaign ON npcs(campaign_id);
```

### 9.2 Caching Strategy (Redis)

```typescript
interface CacheStrategy {
  // Session state - frequently accessed, short TTL
  sessionState: {
    key: 'session:{sessionId}:state',
    ttl: 3600,  // 1 hour
    type: 'hash'
  };

  // Active combat - high frequency updates
  combatState: {
    key: 'combat:{combatId}',
    ttl: 7200,  // 2 hours
    type: 'hash'
  };

  // Character data - medium frequency
  characterCache: {
    key: 'character:{characterId}',
    ttl: 1800,  // 30 minutes
    type: 'json'
  };

  // Reference data - long TTL
  referenceData: {
    key: 'ref:{type}:{id}',
    ttl: 86400,  // 24 hours
    type: 'json'
  };

  // Pub/Sub channels
  channels: {
    sessionEvents: 'session:{sessionId}:events',
    combatUpdates: 'combat:{combatId}:updates',
    voiceStream: 'voice:{sessionId}:stream'
  };
}
```

---

## 10. Security & Authentication

### 10.1 Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────▶│  Login  │────▶│  Verify │────▶│  Issue  │
│         │     │  Form   │     │Password │     │  JWT    │
└─────────┘     └─────────┘     └─────────┘     └────┬────┘
                                                      │
                                                      ▼
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Access │◀────│  Store  │◀────│  HTTP   │◀────│ Refresh │
│  App    │     │ Tokens  │     │  Only   │     │  Token  │
└─────────┘     └─────────┘     │ Cookie  │     └─────────┘
                                └─────────┘
```

### 10.2 Security Measures

```typescript
// JWT Configuration
const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m'
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d'
  }
};

// Rate Limiting
const rateLimits = {
  api: {
    windowMs: 60 * 1000,  // 1 minute
    max: 100  // requests per window
  },
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5  // login attempts
  },
  dice: {
    windowMs: 1000,  // 1 second
    max: 10  // rolls per second
  }
};

// Input Validation
const validationRules = {
  characterName: z.string().min(1).max(100).regex(/^[\w\s'-]+$/),
  diceExpression: z.string().regex(/^\d+d\d+([+-]\d+)?$/),
  message: z.string().max(2000).trim()
};
```

### 10.3 Authorization

```typescript
// Role-based permissions
const permissions = {
  player: [
    'character:read:own',
    'character:write:own',
    'session:join',
    'dice:roll',
    'action:submit'
  ],
  dm: [
    ...permissions.player,
    'campaign:manage',
    'session:manage',
    'npc:manage',
    'combat:manage',
    'override:rules'
  ],
  admin: [
    ...permissions.dm,
    'user:manage',
    'system:configure'
  ]
};

// Session-level authorization
const sessionPermissions = {
  owner: ['session:end', 'session:kick', 'session:configure'],
  participant: ['session:join', 'session:leave', 'session:interact'],
  spectator: ['session:observe']
};
```

---

## 11. Deployment Architecture

### 11.1 Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN (CloudFlare)                         │
│                    Static Assets, DDoS Protection                │
└─────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────────┐
│                          Load Balancer                           │
│                         (AWS ALB / nginx)                        │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   Web Server  │       │   Web Server  │       │   Web Server  │
│   (Next.js)   │       │   (Next.js)   │       │   (Next.js)   │
│   Instance 1  │       │   Instance 2  │       │   Instance N  │
└───────┬───────┘       └───────┬───────┘       └───────┬───────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  PostgreSQL   │       │    Redis      │       │    S3/Blob    │
│  (Primary)    │       │   Cluster     │       │    Storage    │
│    + Replica  │       │               │       │               │
└───────────────┘       └───────────────┘       └───────────────┘
```

### 11.2 Environment Configuration

```bash
# .env.example

# Application
NODE_ENV=production
APP_URL=https://dndmaster.app
API_URL=https://api.dndmaster.app

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dndmaster
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://host:6379
REDIS_PASSWORD=

# Authentication
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
SESSION_SECRET=

# AI Services
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Voice Services
ELEVENLABS_API_KEY=
WHISPER_API_URL=

# WebRTC
TURN_SERVER_URL=
TURN_USERNAME=
TURN_CREDENTIAL=

# Storage
S3_BUCKET=
S3_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Monitoring
SENTRY_DSN=
```

---

## 12. Technology Stack

### 12.1 Core Technologies

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 16 + React 19 | App Router, Server Components, excellent DX |
| **Language** | TypeScript | Type safety, better tooling, maintainability |
| **Styling** | Tailwind CSS | Rapid UI development, consistent design |
| **State** | Zustand | Lightweight, simple, works with SSR |
| **Real-time** | Socket.io | Reliable WebSocket with fallbacks |
| **Database** | PostgreSQL | JSONB support, reliability, ACID compliance |
| **Cache** | Redis | Pub/sub, session storage, caching |
| **ORM** | Prisma | Type-safe queries, migrations, good DX |
| **Auth** | NextAuth.js | Built for Next.js, multiple providers |

### 12.2 AI/ML Services

| Service | Provider | Alternative |
|---------|----------|-------------|
| **LLM** | Claude (Anthropic) | GPT-4 (OpenAI), Llama (local) |
| **Speech-to-Text** | Whisper (OpenAI) | Azure Speech, Google Speech |
| **Text-to-Speech** | ElevenLabs | Azure Speech, Google TTS |

### 12.3 Infrastructure

| Component | Service | Alternative |
|-----------|---------|-------------|
| **Hosting** | Vercel | AWS, GCP, Railway |
| **Database** | Supabase / Neon | AWS RDS, PlanetScale |
| **Cache** | Upstash Redis | AWS ElastiCache |
| **Storage** | AWS S3 | Cloudflare R2 |
| **CDN** | Cloudflare | AWS CloudFront |
| **Monitoring** | Sentry + Datadog | New Relic |

### 12.4 Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Jest** | Unit testing |
| **Playwright** | E2E testing |
| **Husky** | Git hooks |
| **GitHub Actions** | CI/CD |

---

## Appendices

### A. D&D 5e Quick Reference

#### Ability Score Modifiers
| Score | Modifier |
|-------|----------|
| 1 | -5 |
| 2-3 | -4 |
| 4-5 | -3 |
| 6-7 | -2 |
| 8-9 | -1 |
| 10-11 | 0 |
| 12-13 | +1 |
| 14-15 | +2 |
| 16-17 | +3 |
| 18-19 | +4 |
| 20-21 | +5 |

#### Proficiency Bonus by Level
| Level | Bonus |
|-------|-------|
| 1-4 | +2 |
| 5-8 | +3 |
| 9-12 | +4 |
| 13-16 | +5 |
| 17-20 | +6 |

### B. API Error Codes

| Code | Description |
|------|-------------|
| 1001 | Invalid character data |
| 1002 | Character not found |
| 2001 | Campaign not found |
| 2002 | Not authorized for campaign |
| 3001 | Session not found |
| 3002 | Session already active |
| 4001 | Invalid dice expression |
| 4002 | Invalid combat action |
| 5001 | Voice service unavailable |
| 5002 | Transcription failed |

### C. WebSocket Event Reference

See Section 5.2 for complete event documentation.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-24 | Claude | Initial architecture document |

---

*This document serves as the technical blueprint for DnD-Master. It should be updated as the system evolves and new requirements emerge.*
