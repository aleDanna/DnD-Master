/**
 * Character type definitions
 * Represents a D&D player character
 */

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface SkillProficiencies {
  [skillName: string]: {
    proficient: boolean;
    expertise: boolean;
    bonus: number;
  };
}

export interface EquipmentItem {
  name: string;
  quantity: number;
  equipped: boolean;
  description?: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  prepared: boolean;
}

export interface Feature {
  name: string;
  source: string; // "Class", "Race", "Background"
  description: string;
}

export interface Character {
  id: string;
  campaign_id: string;
  user_id: string;
  name: string;
  race: string;
  class: string;
  level: number;

  // Core stats
  max_hp: number;
  current_hp: number;
  armor_class: number;
  speed: number;

  // Ability scores
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  // JSON fields
  skills: SkillProficiencies;
  proficiencies: string[];
  equipment: EquipmentItem[];
  spells: Spell[];
  features: Feature[];
  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateCharacterInput {
  campaign_id: string;
  name: string;
  race: string;
  class: string;
  level?: number;
  max_hp: number;
  current_hp: number;
  armor_class: number;
  speed?: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  skills?: SkillProficiencies;
  proficiencies?: string[];
  equipment?: EquipmentItem[];
  spells?: Spell[];
  features?: Feature[];
  notes?: string;
}

export interface UpdateCharacterInput {
  name?: string;
  race?: string;
  class?: string;
  level?: number;
  max_hp?: number;
  current_hp?: number;
  armor_class?: number;
  speed?: number;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  skills?: SkillProficiencies;
  proficiencies?: string[];
  equipment?: EquipmentItem[];
  spells?: Spell[];
  features?: Feature[];
  notes?: string;
}

/**
 * Calculate ability modifier from score (D&D 5e formula)
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
