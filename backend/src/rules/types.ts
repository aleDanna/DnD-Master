/**
 * Types for D&D Rules parsing and lookup
 */

export interface RuleSection {
  id: string;
  title: string;
  source: 'basic_rules' | 'players_handbook';
  chapter: string;
  chapterNumber: number;
  part?: string;
  content: string;
  subsections: RuleSubsection[];
  keywords: string[];
  pageReference?: string;
}

export interface RuleSubsection {
  id: string;
  title: string;
  content: string;
  keywords: string[];
}

export interface RuleCitation {
  ruleId: string;
  title: string;
  source: string; // "Basic Rules, Ch. 9" or "PHB p.194"
  excerpt: string;
}

export interface SpellDefinition {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  higherLevels?: string;
  classes: string[];
  source: 'basic_rules' | 'players_handbook';
}

export interface MonsterStats {
  name: string;
  size: string;
  type: string;
  alignment: string;
  armorClass: number;
  hitPoints: string;
  speed: string;
  abilityScores: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  skills?: string;
  senses: string;
  languages: string;
  challengeRating: string;
  traits?: string[];
  actions?: string[];
  legendaryActions?: string[];
  source: 'basic_rules' | 'players_handbook';
}

export interface RaceDefinition {
  name: string;
  abilityScoreIncrease: string;
  age: string;
  alignment: string;
  size: string;
  speed: string;
  traits: string[];
  languages: string;
  subraces?: SubraceDefinition[];
  source: 'basic_rules' | 'players_handbook';
}

export interface SubraceDefinition {
  name: string;
  abilityScoreIncrease: string;
  traits: string[];
}

export interface ClassDefinition {
  name: string;
  hitDie: string;
  primaryAbility: string;
  savingThrowProficiencies: string;
  armorProficiencies: string;
  weaponProficiencies: string;
  skillChoices: string;
  equipment: string[];
  features: ClassFeature[];
  source: 'basic_rules' | 'players_handbook';
}

export interface ClassFeature {
  name: string;
  level: number;
  description: string;
}

export interface RulesIndex {
  sections: Map<string, RuleSection>;
  spells: Map<string, SpellDefinition>;
  monsters: Map<string, MonsterStats>;
  races: Map<string, RaceDefinition>;
  classes: Map<string, ClassDefinition>;
  keywordIndex: Map<string, string[]>; // keyword -> section IDs
}

export interface SearchResult {
  type: 'section' | 'spell' | 'monster' | 'race' | 'class';
  id: string;
  title: string;
  source: string;
  excerpt: string;
  relevanceScore: number;
}
