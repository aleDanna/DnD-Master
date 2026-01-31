// Frontend content types for Rules Explorer
// T030: Create frontend content types (mirror backend types)

/**
 * Source citation for tracking content origin
 */
export interface SourceCitation {
  document: string | null;
  page: number | null;
}

/**
 * Content type identifiers
 */
export type ContentType =
  | 'rule'
  | 'class'
  | 'subclass'
  | 'race'
  | 'subrace'
  | 'spell'
  | 'monster'
  | 'item'
  | 'background'
  | 'feat'
  | 'condition'
  | 'skill';

/**
 * Content categories for navigation
 */
export type ContentCategory =
  | 'rules'
  | 'classes'
  | 'races'
  | 'spells'
  | 'bestiary'
  | 'items'
  | 'backgrounds'
  | 'feats'
  | 'conditions'
  | 'skills';

// ============================================
// Rules
// ============================================

export interface RuleCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  description: string | null;
  children?: RuleCategory[];
  rules?: RuleSummary[];
}

export interface RuleSummary {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  summary: string | null;
  source: SourceCitation;
}

export interface Rule {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  summary: string | null;
  content: string;
  keywords: string[];
  source: SourceCitation;
}

// ============================================
// Classes
// ============================================

export interface ClassFeature {
  level: number;
  name: string;
  description: string;
}

export interface SkillChoices {
  count: number;
  options: string[];
}

export interface ClassSummary {
  id: string;
  name: string;
  slug: string;
  hitDie: string;
  primaryAbility: string;
  source: SourceCitation;
}

export interface Class {
  id: string;
  name: string;
  slug: string;
  description: string;
  hitDie: string;
  primaryAbility: string;
  savingThrows: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  skillChoices: SkillChoices | null;
  features: ClassFeature[];
  source: SourceCitation;
  subclasses?: SubclassSummary[];
}

export interface SubclassSummary {
  id: string;
  name: string;
  slug: string;
  classId: string;
  source: SourceCitation;
}

export interface Subclass {
  id: string;
  name: string;
  slug: string;
  classId: string;
  description: string;
  features: ClassFeature[];
  source: SourceCitation;
}

// ============================================
// Races
// ============================================

export interface AbilityScoreIncrease {
  ability: string;
  bonus: number;
}

export interface RacialTrait {
  name: string;
  description: string;
}

export interface RaceSummary {
  id: string;
  name: string;
  slug: string;
  size: string;
  speed: number;
  source: SourceCitation;
}

export interface Race {
  id: string;
  name: string;
  slug: string;
  description: string;
  abilityScoreIncrease: AbilityScoreIncrease[];
  ageDescription: string | null;
  size: string;
  speed: number;
  languages: string[];
  traits: RacialTrait[];
  source: SourceCitation;
  subraces?: SubraceSummary[];
}

export interface SubraceSummary {
  id: string;
  name: string;
  slug: string;
  raceId: string;
  source: SourceCitation;
}

export interface Subrace {
  id: string;
  name: string;
  slug: string;
  raceId: string;
  description: string | null;
  abilityScoreIncrease: AbilityScoreIncrease[] | null;
  traits: RacialTrait[] | null;
  source: SourceCitation;
}

// ============================================
// Spells
// ============================================

export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  materialDescription?: string;
}

export type MagicSchool =
  | 'Abjuration'
  | 'Conjuration'
  | 'Divination'
  | 'Enchantment'
  | 'Evocation'
  | 'Illusion'
  | 'Necromancy'
  | 'Transmutation';

export interface SpellSummary {
  id: string;
  name: string;
  slug: string;
  level: number;
  school: string;
  concentration: boolean;
  ritual: boolean;
  source: SourceCitation;
}

export interface Spell {
  id: string;
  name: string;
  slug: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: SpellComponents;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevels: string | null;
  classes?: string[];
  source: SourceCitation;
}

// ============================================
// Monsters
// ============================================

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Speed {
  walk?: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
  hover?: boolean;
}

export interface Senses {
  darkvision?: number;
  blindsight?: number;
  tremorsense?: number;
  truesight?: number;
  passivePerception?: number;
}

export interface MonsterTrait {
  name: string;
  description: string;
}

export interface MonsterAction {
  name: string;
  description: string;
  attackBonus?: number;
  damage?: string;
}

export interface MonsterSummary {
  id: string;
  name: string;
  slug: string;
  size: string;
  type: string;
  challengeRating: string;
  source: SourceCitation;
}

export interface Monster {
  id: string;
  name: string;
  slug: string;
  size: string;
  type: string;
  subtype: string | null;
  alignment: string | null;
  armorClass: number;
  armorType: string | null;
  hitPoints: number;
  hitDice: string;
  speed: Speed;
  abilityScores: AbilityScores;
  savingThrows: Record<string, number> | null;
  skills: Record<string, number> | null;
  damageVulnerabilities: string[];
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  senses: Senses | null;
  languages: string[];
  challengeRating: string;
  challengeRatingNumeric: number;
  experiencePoints: number;
  traits: MonsterTrait[] | null;
  actions: MonsterAction[];
  reactions: MonsterTrait[] | null;
  legendaryActions: MonsterTrait[] | null;
  lairActions: MonsterTrait[] | null;
  description: string | null;
  source: SourceCitation;
}

// ============================================
// Items
// ============================================

export interface ItemCost {
  amount: number;
  currency: 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
}

export interface WeaponDamage {
  dice: string;
  type: string;
}

export interface ArmorClassBonus {
  base: number;
  dexBonus?: boolean;
  maxDexBonus?: number;
  stealthDisadvantage?: boolean;
  strengthRequirement?: number;
}

export interface ItemSummary {
  id: string;
  name: string;
  slug: string;
  type: string;
  rarity: string | null;
  cost: ItemCost | null;
  source: SourceCitation;
}

export interface Item {
  id: string;
  name: string;
  slug: string;
  type: string;
  subtype: string | null;
  rarity: string | null;
  cost: ItemCost | null;
  weight: number | null;
  properties: string[];
  damage: WeaponDamage | null;
  armorClass: ArmorClassBonus | null;
  description: string;
  requiresAttunement: boolean | null;
  source: SourceCitation;
}

// ============================================
// Backgrounds
// ============================================

export interface SuggestedCharacteristics {
  personalityTraits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
}

export interface BackgroundSummary {
  id: string;
  name: string;
  slug: string;
  skillProficiencies: string[];
  source: SourceCitation;
}

export interface Background {
  id: string;
  name: string;
  slug: string;
  description: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number | null;
  equipment: string;
  featureName: string;
  featureDescription: string;
  suggestedCharacteristics: SuggestedCharacteristics | null;
  source: SourceCitation;
}

// ============================================
// Feats
// ============================================

export interface FeatBenefit {
  abilityScoreIncrease?: { ability: string; bonus: number }[];
  proficiencies?: string[];
  other?: string[];
}

export interface FeatSummary {
  id: string;
  name: string;
  slug: string;
  prerequisites: string | null;
  source: SourceCitation;
}

export interface Feat {
  id: string;
  name: string;
  slug: string;
  prerequisites: string | null;
  description: string;
  benefits: FeatBenefit | null;
  source: SourceCitation;
}

// ============================================
// Conditions
// ============================================

export interface ConditionSummary {
  id: string;
  name: string;
  slug: string;
  source: SourceCitation;
}

export interface Condition {
  id: string;
  name: string;
  slug: string;
  description: string;
  source: SourceCitation;
}

// ============================================
// Skills
// ============================================

export interface SkillSummary {
  id: string;
  name: string;
  slug: string;
  ability: string;
  source: SourceCitation;
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  ability: string;
  description: string;
  source: SourceCitation;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get spell level display text
 */
export function getSpellLevelText(level: number): string {
  if (level === 0) return 'Cantrip';
  return `${level}${getOrdinalSuffix(level)} Level`;
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Get ability modifier from score
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Format ability modifier for display
 */
export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Format item cost for display
 */
export function formatCost(cost: ItemCost | null): string {
  if (!cost) return '-';
  return `${cost.amount} ${cost.currency}`;
}

/**
 * Format weight for display
 */
export function formatWeight(weight: number | null): string {
  if (weight === null) return '-';
  return `${weight} lb${weight !== 1 ? 's' : ''}`;
}
