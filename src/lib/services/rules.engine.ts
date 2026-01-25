import type {
  AbilityScores,
  AbilityType,
  Skill,
  SKILL_ABILITY_MAP,
  ConditionType,
  ArmorType,
  Weapon,
  Armor,
} from '@/types/dnd.types';
import type { Character, DerivedStats, SkillCheckInfo, SavingThrowInfo, AttackInfo } from '@/types/character.types';

// ============================================
// Constants
// ============================================

export const PROFICIENCY_BONUS_BY_LEVEL: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 2,
  5: 3, 6: 3, 7: 3, 8: 3,
  9: 4, 10: 4, 11: 4, 12: 4,
  13: 5, 14: 5, 15: 5, 16: 5,
  17: 6, 18: 6, 19: 6, 20: 6,
};

export const SKILL_TO_ABILITY: Record<Skill, AbilityType> = {
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

export const EXPERIENCE_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

// ============================================
// Condition Effects
// ============================================

export interface ConditionEffects {
  cantMove: boolean;
  cantTakeActions: boolean;
  cantTakeReactions: boolean;
  attacksHaveDisadvantage: boolean;
  attacksAgainstHaveAdvantage: boolean;
  autoFailStrengthSaves: boolean;
  autoFailDexteritySaves: boolean;
  speedZero: boolean;
  incapacitated: boolean;
  otherEffects: string[];
}

const CONDITION_EFFECTS: Record<ConditionType, Partial<ConditionEffects>> = {
  blinded: {
    attacksHaveDisadvantage: true,
    attacksAgainstHaveAdvantage: true,
    otherEffects: ['Cannot see', 'Auto-fail checks requiring sight'],
  },
  charmed: {
    otherEffects: ['Cannot attack charmer', 'Charmer has advantage on social checks'],
  },
  deafened: {
    otherEffects: ['Cannot hear', 'Auto-fail checks requiring hearing'],
  },
  exhaustion: {
    otherEffects: ['Effects depend on exhaustion level'],
  },
  frightened: {
    attacksHaveDisadvantage: true,
    otherEffects: ['Cannot willingly move closer to source of fear'],
  },
  grappled: {
    speedZero: true,
    otherEffects: ['Speed becomes 0'],
  },
  incapacitated: {
    cantTakeActions: true,
    cantTakeReactions: true,
    incapacitated: true,
  },
  invisible: {
    attacksAgainstHaveAdvantage: false,
    otherEffects: ['Heavily obscured', 'Advantage on attacks', 'Attacks against have disadvantage'],
  },
  paralyzed: {
    cantMove: true,
    cantTakeActions: true,
    cantTakeReactions: true,
    autoFailStrengthSaves: true,
    autoFailDexteritySaves: true,
    attacksAgainstHaveAdvantage: true,
    incapacitated: true,
    otherEffects: ['Attacks within 5 feet are critical hits'],
  },
  petrified: {
    cantMove: true,
    cantTakeActions: true,
    cantTakeReactions: true,
    autoFailStrengthSaves: true,
    autoFailDexteritySaves: true,
    attacksAgainstHaveAdvantage: true,
    incapacitated: true,
    otherEffects: ['Resistance to all damage', 'Immune to poison and disease'],
  },
  poisoned: {
    attacksHaveDisadvantage: true,
    otherEffects: ['Disadvantage on ability checks'],
  },
  prone: {
    otherEffects: [
      'Disadvantage on attacks',
      'Melee attacks within 5 feet have advantage',
      'Ranged attacks have disadvantage',
      'Must use half movement to stand',
    ],
  },
  restrained: {
    speedZero: true,
    attacksHaveDisadvantage: true,
    attacksAgainstHaveAdvantage: true,
    otherEffects: ['Disadvantage on Dexterity saves'],
  },
  stunned: {
    cantMove: true,
    cantTakeActions: true,
    cantTakeReactions: true,
    autoFailStrengthSaves: true,
    autoFailDexteritySaves: true,
    attacksAgainstHaveAdvantage: true,
    incapacitated: true,
  },
  unconscious: {
    cantMove: true,
    cantTakeActions: true,
    cantTakeReactions: true,
    autoFailStrengthSaves: true,
    autoFailDexteritySaves: true,
    attacksAgainstHaveAdvantage: true,
    incapacitated: true,
    otherEffects: ['Drops held items', 'Falls prone', 'Attacks within 5 feet are critical hits'],
  },
};

// ============================================
// Rules Engine
// ============================================

export class RulesEngine {
  /**
   * Calculate ability modifier from ability score
   * Formula: floor((score - 10) / 2)
   */
  calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Calculate all ability modifiers
   */
  calculateAllModifiers(abilityScores: AbilityScores): AbilityScores {
    return {
      strength: this.calculateModifier(abilityScores.strength),
      dexterity: this.calculateModifier(abilityScores.dexterity),
      constitution: this.calculateModifier(abilityScores.constitution),
      intelligence: this.calculateModifier(abilityScores.intelligence),
      wisdom: this.calculateModifier(abilityScores.wisdom),
      charisma: this.calculateModifier(abilityScores.charisma),
    };
  }

  /**
   * Get proficiency bonus for a given level
   */
  getProficiencyBonus(level: number): number {
    const clampedLevel = Math.max(1, Math.min(20, level));
    return PROFICIENCY_BONUS_BY_LEVEL[clampedLevel];
  }

  /**
   * Calculate total character level (sum of all class levels)
   */
  calculateTotalLevel(character: Character): number {
    return character.classes.reduce((total, cls) => total + cls.level, 0);
  }

  /**
   * Calculate Armor Class
   */
  calculateArmorClass(character: Character): number {
    const dexMod = this.calculateModifier(character.abilityScores.dexterity);
    const equippedArmor = character.equippedItems.armor?.armor;
    const equippedShield = character.equippedItems.shield?.armor;

    let ac = 10 + dexMod; // Base AC (unarmored)

    if (equippedArmor) {
      ac = equippedArmor.baseAC;

      if (equippedArmor.addDexModifier) {
        if (equippedArmor.maxDexBonus !== undefined) {
          ac += Math.min(dexMod, equippedArmor.maxDexBonus);
        } else {
          ac += dexMod;
        }
      }
    }

    // Add shield bonus
    if (equippedShield) {
      ac += equippedShield.baseAC; // Shields typically add +2
    }

    return ac;
  }

  /**
   * Calculate initiative modifier
   */
  calculateInitiative(character: Character): number {
    return this.calculateModifier(character.abilityScores.dexterity);
  }

  /**
   * Calculate passive perception
   */
  calculatePassivePerception(character: Character): number {
    const wisMod = this.calculateModifier(character.abilityScores.wisdom);
    const profBonus = this.getProficiencyBonus(this.calculateTotalLevel(character));
    const isProficient = character.proficiencies.skills.includes('perception');

    return 10 + wisMod + (isProficient ? profBonus : 0);
  }

  /**
   * Calculate passive investigation
   */
  calculatePassiveInvestigation(character: Character): number {
    const intMod = this.calculateModifier(character.abilityScores.intelligence);
    const profBonus = this.getProficiencyBonus(this.calculateTotalLevel(character));
    const isProficient = character.proficiencies.skills.includes('investigation');

    return 10 + intMod + (isProficient ? profBonus : 0);
  }

  /**
   * Calculate passive insight
   */
  calculatePassiveInsight(character: Character): number {
    const wisMod = this.calculateModifier(character.abilityScores.wisdom);
    const profBonus = this.getProficiencyBonus(this.calculateTotalLevel(character));
    const isProficient = character.proficiencies.skills.includes('insight');

    return 10 + wisMod + (isProficient ? profBonus : 0);
  }

  /**
   * Calculate spell save DC
   */
  calculateSpellSaveDC(character: Character): number | undefined {
    if (!character.spellcasting) return undefined;

    const spellcastingAbility = character.spellcasting.spellcastingAbility;
    const abilityMod = this.calculateModifier(
      character.abilityScores[spellcastingAbility]
    );
    const profBonus = this.getProficiencyBonus(this.calculateTotalLevel(character));

    return 8 + profBonus + abilityMod;
  }

  /**
   * Calculate spell attack bonus
   */
  calculateSpellAttackBonus(character: Character): number | undefined {
    if (!character.spellcasting) return undefined;

    const spellcastingAbility = character.spellcasting.spellcastingAbility;
    const abilityMod = this.calculateModifier(
      character.abilityScores[spellcastingAbility]
    );
    const profBonus = this.getProficiencyBonus(this.calculateTotalLevel(character));

    return profBonus + abilityMod;
  }

  /**
   * Calculate attack bonus for a weapon
   */
  calculateAttackBonus(character: Character, weapon: Weapon): number {
    const profBonus = this.getProficiencyBonus(this.calculateTotalLevel(character));

    // Determine if character is proficient with the weapon
    const isProficient = this.isWeaponProficient(character, weapon);

    // Determine which ability modifier to use
    let abilityMod: number;

    if (weapon.properties.includes('finesse')) {
      // Finesse weapons can use STR or DEX, whichever is higher
      const strMod = this.calculateModifier(character.abilityScores.strength);
      const dexMod = this.calculateModifier(character.abilityScores.dexterity);
      abilityMod = Math.max(strMod, dexMod);
    } else if (weapon.weaponType === 'ranged') {
      // Ranged weapons use DEX
      abilityMod = this.calculateModifier(character.abilityScores.dexterity);
    } else {
      // Melee weapons use STR
      abilityMod = this.calculateModifier(character.abilityScores.strength);
    }

    return abilityMod + (isProficient ? profBonus : 0);
  }

  /**
   * Calculate damage bonus for a weapon
   */
  calculateDamageBonus(character: Character, weapon: Weapon): number {
    if (weapon.properties.includes('finesse')) {
      const strMod = this.calculateModifier(character.abilityScores.strength);
      const dexMod = this.calculateModifier(character.abilityScores.dexterity);
      return Math.max(strMod, dexMod);
    } else if (weapon.weaponType === 'ranged') {
      return this.calculateModifier(character.abilityScores.dexterity);
    } else {
      return this.calculateModifier(character.abilityScores.strength);
    }
  }

  /**
   * Check if character is proficient with a weapon
   */
  isWeaponProficient(character: Character, weapon: Weapon): boolean {
    const weaponProfs = character.proficiencies.weapons;

    // Check for specific weapon proficiency
    if (weaponProfs.includes(weapon.name.toLowerCase())) {
      return true;
    }

    // Check for category proficiency (simple/martial)
    if (weaponProfs.includes(weapon.category)) {
      return true;
    }

    return false;
  }

  /**
   * Get skill check info for all skills
   */
  getSkillCheckInfo(character: Character): SkillCheckInfo[] {
    const level = this.calculateTotalLevel(character);
    const profBonus = this.getProficiencyBonus(level);
    const modifiers = this.calculateAllModifiers(character.abilityScores);

    const skills: Skill[] = Object.keys(SKILL_TO_ABILITY) as Skill[];

    return skills.map((skill) => {
      const ability = SKILL_TO_ABILITY[skill];
      const abilityMod = modifiers[ability];
      const proficient = character.proficiencies.skills.includes(skill);
      // TODO: Implement expertise check
      const expertise = false;

      let modifier = abilityMod;
      if (proficient) {
        modifier += profBonus;
      }
      if (expertise) {
        modifier += profBonus; // Expertise doubles proficiency
      }

      return {
        skill,
        ability,
        proficient,
        expertise,
        modifier,
      };
    });
  }

  /**
   * Get saving throw info for all abilities
   */
  getSavingThrowInfo(character: Character): SavingThrowInfo[] {
    const level = this.calculateTotalLevel(character);
    const profBonus = this.getProficiencyBonus(level);
    const modifiers = this.calculateAllModifiers(character.abilityScores);

    const abilities: AbilityType[] = [
      'strength',
      'dexterity',
      'constitution',
      'intelligence',
      'wisdom',
      'charisma',
    ];

    return abilities.map((ability) => {
      const abilityMod = modifiers[ability];
      const proficient = character.proficiencies.savingThrows.includes(ability);

      return {
        ability,
        proficient,
        modifier: abilityMod + (proficient ? profBonus : 0),
      };
    });
  }

  /**
   * Calculate all derived stats for a character
   */
  calculateDerivedStats(character: Character): DerivedStats {
    return {
      abilityModifiers: this.calculateAllModifiers(character.abilityScores),
      proficiencyBonus: this.getProficiencyBonus(this.calculateTotalLevel(character)),
      initiative: this.calculateInitiative(character),
      passivePerception: this.calculatePassivePerception(character),
      passiveInvestigation: this.calculatePassiveInvestigation(character),
      passiveInsight: this.calculatePassiveInsight(character),
      armorClass: this.calculateArmorClass(character),
      spellSaveDC: this.calculateSpellSaveDC(character),
      spellAttackBonus: this.calculateSpellAttackBonus(character),
    };
  }

  /**
   * Get effects of a condition
   */
  getConditionEffects(condition: ConditionType): ConditionEffects {
    const effects = CONDITION_EFFECTS[condition] || {};
    return {
      cantMove: effects.cantMove || false,
      cantTakeActions: effects.cantTakeActions || false,
      cantTakeReactions: effects.cantTakeReactions || false,
      attacksHaveDisadvantage: effects.attacksHaveDisadvantage || false,
      attacksAgainstHaveAdvantage: effects.attacksAgainstHaveAdvantage || false,
      autoFailStrengthSaves: effects.autoFailStrengthSaves || false,
      autoFailDexteritySaves: effects.autoFailDexteritySaves || false,
      speedZero: effects.speedZero || false,
      incapacitated: effects.incapacitated || false,
      otherEffects: effects.otherEffects || [],
    };
  }

  /**
   * Calculate level from experience points
   */
  calculateLevelFromXP(xp: number): number {
    let level = 1;
    for (let i = 20; i >= 1; i--) {
      if (xp >= EXPERIENCE_THRESHOLDS[i]) {
        level = i;
        break;
      }
    }
    return level;
  }

  /**
   * Get XP required for next level
   */
  getXPForNextLevel(currentLevel: number): number {
    if (currentLevel >= 20) return 0;
    return EXPERIENCE_THRESHOLDS[currentLevel + 1];
  }

  /**
   * Calculate carrying capacity
   */
  calculateCarryingCapacity(character: Character): number {
    return character.abilityScores.strength * 15; // pounds
  }

  /**
   * Check concentration save DC after taking damage
   */
  getConcentrationSaveDC(damageTaken: number): number {
    return Math.max(10, Math.floor(damageTaken / 2));
  }

  /**
   * Calculate hit points gained on level up
   */
  calculateHitPointsOnLevelUp(
    hitDie: number,
    constitutionModifier: number,
    rollResult?: number
  ): number {
    const dieValue = rollResult !== undefined ? rollResult : Math.ceil(hitDie / 2) + 1;
    return Math.max(1, dieValue + constitutionModifier);
  }

  /**
   * Calculate starting hit points at level 1
   */
  calculateStartingHitPoints(hitDie: number, constitutionModifier: number): number {
    return hitDie + constitutionModifier;
  }
}

// Singleton instance
export const rulesEngine = new RulesEngine();
