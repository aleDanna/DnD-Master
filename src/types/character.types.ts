import type {
  AbilityScores,
  AbilityType,
  ActiveCondition,
  Alignment,
  Background,
  CharacterClass,
  Currency,
  DeathSaves,
  EquippedItems,
  HitDice,
  InventoryItem,
  Proficiencies,
  Race,
  Skill,
  Spellcasting,
} from './dnd.types';

// ============================================
// Character Types
// ============================================

export interface CharacterAppearance {
  age?: number;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  description?: string;
  portrait?: string; // URL to portrait image
}

export interface CharacterPersonality {
  traits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
}

export interface CharacterFeature {
  name: string;
  source: string; // e.g., "Race: Elf", "Class: Fighter 3"
  description: string;
  usesPerRest?: {
    type: 'short' | 'long';
    max: number;
    current: number;
  };
}

export interface Character {
  id: string;
  userId: string;
  campaignId?: string;

  // Basic Info
  name: string;
  race: Race;
  classes: CharacterClass[];
  level: number;
  experiencePoints: number;
  background?: Background;
  alignment?: Alignment;

  // Ability Scores
  abilityScores: AbilityScores;

  // Combat Stats
  maxHitPoints: number;
  currentHitPoints: number;
  temporaryHitPoints: number;
  armorClass: number;
  speed: number;
  hitDice: HitDice[];
  deathSaves: DeathSaves;

  // Proficiencies
  proficiencies: Proficiencies;

  // Features & Traits
  features: CharacterFeature[];

  // Equipment
  inventory: InventoryItem[];
  equippedItems: EquippedItems;
  currency: Currency;

  // Spellcasting (if applicable)
  spellcasting?: Spellcasting;

  // Character Details
  personality: CharacterPersonality;
  backstory?: string;
  appearance?: CharacterAppearance;

  // State
  conditions: ActiveCondition[];
  exhaustionLevel: number;
  inspiration: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Character Creation Types
// ============================================

export interface CharacterCreationData {
  name: string;
  race: Race;
  classes: CharacterClass[];
  abilityScores: AbilityScores;
  background?: Background;
  alignment?: Alignment;
  personality?: CharacterPersonality;
  backstory?: string;
  appearance?: CharacterAppearance;
}

export interface AbilityScoreMethod {
  type: 'standard-array' | 'point-buy' | 'roll';
}

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const POINT_BUY_TOTAL = 27;

// ============================================
// Level Up Types
// ============================================

export interface LevelUpChoices {
  characterId: string;
  classId: string; // Which class to level up
  hitPointMethod: 'roll' | 'average';
  hitPointRoll?: number; // If rolled
  abilityScoreImprovement?: {
    type: 'ability-scores' | 'feat';
    abilityIncreases?: Partial<AbilityScores>;
    featId?: string;
  };
  subclassChoice?: string;
  spellChoices?: string[]; // New spell IDs
  skillChoices?: Skill[];
  otherChoices?: Record<string, unknown>;
}

// ============================================
// Derived Stats
// ============================================

export interface DerivedStats {
  abilityModifiers: AbilityScores;
  proficiencyBonus: number;
  initiative: number;
  passivePerception: number;
  passiveInvestigation: number;
  passiveInsight: number;
  armorClass: number;
  spellSaveDC?: number;
  spellAttackBonus?: number;
}

// ============================================
// Character Validation
// ============================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// ============================================
// Character Sheet Sections
// ============================================

export interface SkillCheckInfo {
  skill: Skill;
  ability: AbilityType;
  proficient: boolean;
  expertise: boolean;
  modifier: number;
}

export interface SavingThrowInfo {
  ability: AbilityType;
  proficient: boolean;
  modifier: number;
}

export interface AttackInfo {
  name: string;
  attackBonus: number;
  damage: string;
  damageType: string;
  properties: string[];
  range?: string;
}
