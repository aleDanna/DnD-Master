// Handbook Types - T004
// TypeScript interfaces for D&D content types

// ============================================================================
// Enums
// ============================================================================

export type SizeCategory = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';

export type ItemType =
  | 'weapon'
  | 'armor'
  | 'adventuring_gear'
  | 'tool'
  | 'mount'
  | 'vehicle'
  | 'trade_good'
  | 'magic_item';

export type Rarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very_rare'
  | 'legendary'
  | 'artifact';

export type SpellSchool =
  | 'abjuration'
  | 'conjuration'
  | 'divination'
  | 'enchantment'
  | 'evocation'
  | 'illusion'
  | 'necromancy'
  | 'transmutation';

export type ContentType =
  | 'spell'
  | 'monster'
  | 'item'
  | 'class'
  | 'race'
  | 'rule'
  | 'feat'
  | 'background'
  | 'condition'
  | 'subclass'
  | 'subrace';

// ============================================================================
// Reference Entities
// ============================================================================

export interface Ability {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  abilityId: string;
  abilityName: string;
  description: string;
}

export interface Condition {
  id: string;
  name: string;
  slug: string;
  description: string;
}

// ============================================================================
// Rules
// ============================================================================

export interface RuleCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  childCount?: number;
}

export interface RuleSummary {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  categoryPath: string[];
  summary: string;
}

export interface Rule extends RuleSummary {
  content: string;
  keywords: string[];
  relatedRules?: RuleSummary[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Spells
// ============================================================================

export interface SpellSummary {
  id: string;
  name: string;
  slug: string;
  level: number;
  school: SpellSchool;
  castingTime: string;
  concentration: boolean;
  ritual: boolean;
}

export interface Spell extends SpellSummary {
  range: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialDescription?: string;
  };
  duration: string;
  description: string;
  atHigherLevels?: string;
  classes: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Monsters
// ============================================================================

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface MonsterSummary {
  id: string;
  name: string;
  slug: string;
  size: SizeCategory;
  monsterType: string;
  challengeRating: string;
  armorClass: number;
  hitPoints: number;
}

export interface MonsterAction {
  name: string;
  description: string;
  attackBonus?: number;
  damage?: string;
}

export interface Monster extends MonsterSummary {
  alignment: string;
  speed: Record<string, number>;
  abilityScores: AbilityScores;
  savingThrows?: Record<string, number>;
  skills?: Record<string, number>;
  damageResistances?: string[];
  damageImmunities?: string[];
  conditionImmunities?: string[];
  senses: string;
  languages: string;
  traits: MonsterAction[];
  actions: MonsterAction[];
  legendaryActions?: MonsterAction[];
  lairActions?: MonsterAction[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Items
// ============================================================================

export interface ItemSummary {
  id: string;
  name: string;
  slug: string;
  itemType: ItemType;
  rarity: Rarity | null;
  attunementRequired: boolean;
}

export interface Item extends ItemSummary {
  description: string;
  damage?: string;
  damageType?: string;
  armorClass?: number;
  weight?: number;
  cost?: string;
  properties?: string[];
  attunementRequirements?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Classes
// ============================================================================

export interface ClassSummary {
  id: string;
  name: string;
  slug: string;
  hitDie: string;
  primaryAbility: string;
}

export interface ClassFeature {
  id: string;
  name: string;
  level: number;
  description: string;
  subclassId?: string;
}

export interface Subclass {
  id: string;
  classId: string;
  name: string;
  slug: string;
  subclassLevel: number;
  description: string;
  features: ClassFeature[];
}

export interface Class extends ClassSummary {
  description: string;
  savingThrows: string[];
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
    skills: { choose: number; from: string[] };
  };
  equipment: string[];
  features: ClassFeature[];
  subclasses: Subclass[];
  spellcastingAbility?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Races
// ============================================================================

export interface RaceSummary {
  id: string;
  name: string;
  slug: string;
  size: SizeCategory;
  speed: number;
}

export interface RaceTrait {
  name: string;
  description: string;
}

export interface Subrace {
  id: string;
  raceId: string;
  name: string;
  slug: string;
  abilityScoreIncrease: Record<string, number>;
  traits: RaceTrait[];
}

export interface Race extends RaceSummary {
  description: string;
  abilityScoreIncrease: Record<string, number>;
  traits: RaceTrait[];
  languages: string[];
  subraces: Subrace[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Backgrounds
// ============================================================================

export interface BackgroundSummary {
  id: string;
  name: string;
  slug: string;
  skillProficiencies: string[];
}

export interface Background extends BackgroundSummary {
  description: string;
  toolProficiencies: string[];
  languages: number;
  equipment: string[];
  feature: {
    name: string;
    description: string;
  };
  characteristics: {
    personalityTraits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Feats
// ============================================================================

export interface FeatSummary {
  id: string;
  name: string;
  slug: string;
  prerequisites: string | null;
}

export interface Feat extends FeatSummary {
  description: string;
  benefits: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Search
// ============================================================================

export interface SearchResult {
  type: ContentType;
  id: string;
  name: string;
  slug: string;
  score: number;
  excerpt: string;
  attributes: Record<string, unknown>;
}

export interface SearchResultGroup {
  type: ContentType;
  count: number;
  results: SearchResult[];
}

export interface SearchResponse {
  query: string;
  total: number;
  groups: SearchResultGroup[];
}

export interface Citation {
  type: ContentType;
  id: string;
  slug: string;
  name: string;
  excerpt: string;
}

// ============================================================================
// Filters
// ============================================================================

export interface SpellFilters {
  level?: number[];
  school?: SpellSchool[];
  class?: string[];
  concentration?: boolean;
  ritual?: boolean;
}

export interface MonsterFilters {
  challengeRatingMin?: number;
  challengeRatingMax?: number;
  size?: SizeCategory[];
  type?: string[];
}

export interface ItemFilters {
  type?: ItemType[];
  rarity?: Rarity[];
  attunementRequired?: boolean;
}

export interface ClassFilters {
  primaryAbility?: string[];
}

// ============================================================================
// Pagination
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
