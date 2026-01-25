// ============================================
// D&D 5e Core Types
// ============================================

// Ability Scores
export type AbilityType =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// Skills
export type Skill =
  | 'acrobatics'
  | 'animalHandling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleightOfHand'
  | 'stealth'
  | 'survival';

export const SKILL_ABILITY_MAP: Record<Skill, AbilityType> = {
  acrobatics: 'dexterity',
  animalHandling: 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  sleightOfHand: 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
};

// Alignment
export type Alignment =
  | 'lawful-good'
  | 'neutral-good'
  | 'chaotic-good'
  | 'lawful-neutral'
  | 'true-neutral'
  | 'chaotic-neutral'
  | 'lawful-evil'
  | 'neutral-evil'
  | 'chaotic-evil';

// Size Categories
export type CreatureSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

// Damage Types
export type DamageType =
  | 'acid'
  | 'bludgeoning'
  | 'cold'
  | 'fire'
  | 'force'
  | 'lightning'
  | 'necrotic'
  | 'piercing'
  | 'poison'
  | 'psychic'
  | 'radiant'
  | 'slashing'
  | 'thunder';

// Conditions
export type ConditionType =
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

export interface ActiveCondition {
  type: ConditionType;
  source?: string;
  duration?: Duration;
  level?: number; // For exhaustion
  saveDC?: number;
  saveAbility?: AbilityType;
}

export interface Duration {
  type: 'rounds' | 'minutes' | 'hours' | 'days' | 'until_dispelled' | 'special';
  value?: number;
  remaining?: number;
}

// Armor Types
export type ArmorType = 'light' | 'medium' | 'heavy' | 'shield';

// Weapon Types
export type WeaponCategory = 'simple' | 'martial';
export type WeaponType = 'melee' | 'ranged';

export type WeaponProperty =
  | 'ammunition'
  | 'finesse'
  | 'heavy'
  | 'light'
  | 'loading'
  | 'reach'
  | 'special'
  | 'thrown'
  | 'two-handed'
  | 'versatile';

// Spell Schools
export type SpellSchool =
  | 'abjuration'
  | 'conjuration'
  | 'divination'
  | 'enchantment'
  | 'evocation'
  | 'illusion'
  | 'necromancy'
  | 'transmutation';

// Currency
export interface Currency {
  cp: number; // Copper pieces
  sp: number; // Silver pieces
  ep: number; // Electrum pieces
  gp: number; // Gold pieces
  pp: number; // Platinum pieces
}

// Death Saves
export interface DeathSaves {
  successes: number;
  failures: number;
}

// Hit Dice
export interface HitDice {
  dieType: number; // 6, 8, 10, 12
  total: number;
  used: number;
}

// Dice Expression
export interface DiceExpression {
  count: number;
  sides: number;
  modifier: number;
}

// Proficiency
export interface Proficiencies {
  savingThrows: AbilityType[];
  skills: Skill[];
  tools: string[];
  weapons: string[];
  armor: ArmorType[];
  languages: string[];
}

// ============================================
// Race Types
// ============================================

export interface RacialTrait {
  name: string;
  description: string;
  mechanicalEffect?: string;
}

export interface Subrace {
  id: string;
  name: string;
  abilityScoreIncreases: Partial<AbilityScores>;
  traits: RacialTrait[];
}

export interface Race {
  id: string;
  name: string;
  abilityScoreIncreases: Partial<AbilityScores>;
  size: CreatureSize;
  speed: number;
  traits: RacialTrait[];
  languages: string[];
  subraces?: Subrace[];
  selectedSubrace?: Subrace;
}

// ============================================
// Class Types
// ============================================

export interface ClassFeature {
  name: string;
  level: number;
  description: string;
  mechanicalEffect?: string;
}

export interface SpellcastingProgression {
  spellcastingAbility: AbilityType;
  cantripsKnown?: number[];
  spellsKnown?: number[];
  spellSlots: Record<number, number[]>; // Level -> slots per spell level
}

export interface Subclass {
  id: string;
  name: string;
  features: ClassFeature[];
}

export interface CharacterClass {
  id: string;
  name: string;
  level: number;
  hitDie: number;
  primaryAbility: AbilityType[];
  savingThrows: AbilityType[];
  armorProficiencies: ArmorType[];
  weaponProficiencies: string[];
  skillChoices: { options: Skill[]; count: number };
  selectedSkills?: Skill[];
  features: ClassFeature[];
  subclass?: Subclass;
  spellcasting?: SpellcastingProgression;
}

// ============================================
// Background Types
// ============================================

export interface Background {
  id: string;
  name: string;
  skillProficiencies: Skill[];
  toolProficiencies: string[];
  languages: number; // Number of languages to choose
  selectedLanguages?: string[];
  equipment: string[];
  feature: {
    name: string;
    description: string;
  };
  suggestedCharacteristics: {
    personalityTraits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
  };
}

// ============================================
// Equipment Types
// ============================================

export interface Cost {
  amount: number;
  unit: 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
}

export interface Weapon {
  id: string;
  name: string;
  category: WeaponCategory;
  weaponType: WeaponType;
  damage: string;
  damageType: DamageType;
  properties: WeaponProperty[];
  weight: number;
  cost: Cost;
  range?: { normal: number; long: number };
  versatileDamage?: string;
}

export interface Armor {
  id: string;
  name: string;
  type: ArmorType;
  baseAC: number;
  addDexModifier: boolean;
  maxDexBonus?: number;
  strengthRequirement?: number;
  stealthDisadvantage: boolean;
  weight: number;
  cost: Cost;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  description?: string;
  equipped?: boolean;
  // Weapon/Armor specific
  weapon?: Weapon;
  armor?: Armor;
  // Magic item specific
  magical?: boolean;
  attunement?: boolean;
  attuned?: boolean;
}

export interface EquippedItems {
  armor?: InventoryItem;
  shield?: InventoryItem;
  mainHand?: InventoryItem;
  offHand?: InventoryItem;
}

// ============================================
// Spell Types
// ============================================

export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  materialDescription?: string;
  materialCost?: Cost;
  materialConsumed?: boolean;
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 for cantrips
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
  damage?: {
    type: DamageType;
    diceExpression: string;
    scaling?: Record<number, string>; // Spell level -> damage
  };
  savingThrow?: {
    ability: AbilityType;
    effect: string; // "half damage", "negates", etc.
  };
}

export interface SpellSlots {
  [level: number]: {
    total: number;
    used: number;
  };
}

export interface Spellcasting {
  spellcastingAbility: AbilityType;
  spellSlots: SpellSlots;
  spellsKnown: Spell[];
  preparedSpells: string[]; // Spell IDs
  cantripsKnown: Spell[];
}

// ============================================
// Monster Types
// ============================================

export type CreatureType =
  | 'aberration'
  | 'beast'
  | 'celestial'
  | 'construct'
  | 'dragon'
  | 'elemental'
  | 'fey'
  | 'fiend'
  | 'giant'
  | 'humanoid'
  | 'monstrosity'
  | 'ooze'
  | 'plant'
  | 'undead';

export interface MonsterTrait {
  name: string;
  description: string;
}

export interface MonsterAction {
  name: string;
  description: string;
  attackBonus?: number;
  damage?: string;
  damageType?: DamageType;
  reach?: number;
  range?: { normal: number; long: number };
}

export interface LegendaryAction {
  name: string;
  description: string;
  cost: number;
}

export interface Monster {
  id: string;
  name: string;
  size: CreatureSize;
  type: CreatureType;
  subtype?: string;
  alignment: string;
  armorClass: number;
  armorType?: string;
  hitPoints: number;
  hitDice: string;
  speed: {
    walk?: number;
    fly?: number;
    swim?: number;
    climb?: number;
    burrow?: number;
  };
  abilityScores: AbilityScores;
  savingThrows?: Partial<AbilityScores>;
  skills?: Partial<Record<Skill, number>>;
  damageVulnerabilities?: DamageType[];
  damageResistances?: DamageType[];
  damageImmunities?: DamageType[];
  conditionImmunities?: ConditionType[];
  senses: {
    darkvision?: number;
    blindsight?: number;
    tremorsense?: number;
    truesight?: number;
    passivePerception: number;
  };
  languages: string[];
  challengeRating: number;
  experiencePoints: number;
  traits?: MonsterTrait[];
  actions: MonsterAction[];
  reactions?: MonsterAction[];
  legendaryActions?: LegendaryAction[];
  legendaryActionsPerRound?: number;
}
