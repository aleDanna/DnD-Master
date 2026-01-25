import type { Character } from './character.types';

// ============================================
// Campaign Types
// ============================================

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface CampaignSettings {
  allowPvP: boolean;
  deathSavesPublic: boolean;
  rollsPublic: boolean;
  experienceTracking: 'milestone' | 'experience' | 'none';
  restRules: 'standard' | 'gritty' | 'epic';
  encumbranceRules: 'none' | 'standard' | 'variant';
  multiclassingAllowed: boolean;
  featsAllowed: boolean;
  startingLevel: number;
  startingEquipment: 'standard' | 'gold' | 'custom';
  tone: 'serious' | 'balanced' | 'lighthearted';
  difficulty: 'easy' | 'normal' | 'hard' | 'deadly';
}

export const DEFAULT_CAMPAIGN_SETTINGS: CampaignSettings = {
  allowPvP: false,
  deathSavesPublic: false,
  rollsPublic: true,
  experienceTracking: 'milestone',
  restRules: 'standard',
  encumbranceRules: 'none',
  multiclassingAllowed: true,
  featsAllowed: true,
  startingLevel: 1,
  startingEquipment: 'standard',
  tone: 'balanced',
  difficulty: 'normal',
};

export interface HouseRule {
  id: string;
  name: string;
  description: string;
  category: 'combat' | 'exploration' | 'social' | 'magic' | 'other';
}

export interface CampaignPlayer {
  id: string;
  campaignId: string;
  userId: string;
  characterId?: string;
  role: 'player' | 'co-dm' | 'spectator';
  joinedAt: Date;
  // Populated relations
  user?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  character?: Character;
}

export interface Campaign {
  id: string;
  ownerId: string;

  // Basic Info
  name: string;
  description?: string;
  setting?: string;
  startingLevel: number;

  // Participants
  players: CampaignPlayer[];

  // World State
  worldState: WorldState;

  // Configuration
  settings: CampaignSettings;
  houseRules: HouseRule[];

  // Status
  status: CampaignStatus;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// World State Types
// ============================================

export interface WorldState {
  currentDate?: GameDate;
  weather?: string;
  currentLocation?: string;
  partyGold?: number;
  globalFlags: Record<string, boolean | string | number>;
  notes: string[];
}

export interface GameDate {
  year: number;
  month: number;
  day: number;
  calendarName?: string;
}

// ============================================
// NPC Types
// ============================================

export interface NPCRelationship {
  npcId: string;
  type: 'ally' | 'neutral' | 'enemy' | 'family' | 'romantic' | 'rival';
  description?: string;
}

export interface NPC {
  id: string;
  campaignId: string;

  name: string;
  description?: string;
  personality?: string;
  appearance?: string;

  // Stats (for combat-capable NPCs)
  stats?: NPCStats;

  // Location
  locationId?: string;

  // Knowledge & Relationships
  knowledge: string[];
  relationships: NPCRelationship[];

  // Goals
  goals: string[];

  // State
  isAlive: boolean;
  isKnownToParty: boolean;
  disposition: 'friendly' | 'neutral' | 'hostile';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface NPCStats {
  armorClass: number;
  hitPoints: number;
  maxHitPoints: number;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  challengeRating?: number;
  actions?: string[];
}

// ============================================
// Location Types
// ============================================

export type LocationType =
  | 'world'
  | 'continent'
  | 'region'
  | 'city'
  | 'town'
  | 'village'
  | 'dungeon'
  | 'building'
  | 'room'
  | 'wilderness'
  | 'landmark'
  | 'other';

export interface LocationProperties {
  population?: number;
  government?: string;
  economy?: string;
  climate?: string;
  terrain?: string;
  dangerLevel?: 'safe' | 'low' | 'medium' | 'high' | 'deadly';
  pointsOfInterest?: string[];
  secrets?: string[];
}

export interface Location {
  id: string;
  campaignId: string;
  parentLocationId?: string;

  name: string;
  description?: string;
  locationType: LocationType;

  properties: LocationProperties;

  // Relations
  childLocations?: Location[];
  npcs?: NPC[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Quest Types
// ============================================

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed' | 'hidden';

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  optional: boolean;
}

export interface QuestReward {
  experience?: number;
  gold?: number;
  items?: string[];
  reputation?: Record<string, number>;
  other?: string[];
}

export interface Quest {
  id: string;
  campaignId: string;

  title: string;
  description?: string;

  status: QuestStatus;
  questGiverId?: string; // NPC ID

  objectives: QuestObjective[];
  rewards: QuestReward;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Campaign Creation Types
// ============================================

export interface CampaignCreationData {
  name: string;
  description?: string;
  setting?: string;
  settings?: Partial<CampaignSettings>;
}

export interface CampaignUpdateData {
  name?: string;
  description?: string;
  setting?: string;
  settings?: Partial<CampaignSettings>;
  houseRules?: HouseRule[];
  status?: CampaignStatus;
}
