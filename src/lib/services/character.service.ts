import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { rulesEngine } from './rules.engine';
import type {
  AbilityScores,
  AbilityType,
  Race,
  CharacterClass,
  Background,
  Alignment,
  Skill,
  Currency,
  DeathSaves,
  HitDice,
  Proficiencies,
  InventoryItem,
  EquippedItems,
  ActiveCondition,
  Spellcasting,
} from '@/types/dnd.types';
import type {
  Character,
  CharacterCreationData,
  CharacterPersonality,
  CharacterAppearance,
  CharacterFeature,
  LevelUpChoices,
  ValidationResult,
  ValidationError,
  DerivedStats,
} from '@/types/character.types';

// ============================================
// Internal Types
// ============================================

type DbCharacter = {
  id: string;
  userId: string;
  campaignId: string | null;
  name: string;
  race: unknown;
  classes: unknown;
  level: number;
  experiencePoints: number;
  background: unknown;
  alignment: string | null;
  abilityScores: unknown;
  maxHitPoints: number;
  currentHitPoints: number;
  temporaryHitPoints: number;
  armorClass: number;
  speed: number;
  hitDice: unknown;
  deathSaves: unknown;
  proficiencies: unknown;
  features: unknown;
  equipment: unknown;
  currency: unknown;
  spellcasting: unknown;
  personality: unknown;
  backstory: string | null;
  appearance: unknown;
  conditions: unknown;
  exhaustionLevel: number;
  inspiration: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================
// Validation Schemas
// ============================================

const abilityScoresSchema = z.object({
  strength: z.number().min(1).max(30),
  dexterity: z.number().min(1).max(30),
  constitution: z.number().min(1).max(30),
  intelligence: z.number().min(1).max(30),
  wisdom: z.number().min(1).max(30),
  charisma: z.number().min(1).max(30),
});

const characterCreationSchema = z.object({
  name: z.string().min(1).max(100),
  race: z.object({
    id: z.string(),
    name: z.string(),
  }).passthrough(),
  classes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    level: z.number().min(1).max(20),
  }).passthrough()).min(1),
  abilityScores: abilityScoresSchema,
  background: z.object({
    id: z.string(),
    name: z.string(),
  }).passthrough().optional(),
  alignment: z.string().optional(),
});

// ============================================
// Character Service
// ============================================

export class CharacterService {
  /**
   * Create a new character
   */
  async createCharacter(
    userId: string,
    data: CharacterCreationData,
    campaignId?: string
  ): Promise<Character> {
    // Validate input
    const validation = this.validateCharacterCreation(data);
    if (!validation.valid) {
      throw new Error(`Invalid character data: ${validation.errors[0]?.message}`);
    }

    // Calculate initial stats
    const totalLevel = data.classes.reduce((sum, cls) => sum + cls.level, 0);
    const conMod = rulesEngine.calculateModifier(data.abilityScores.constitution);
    const primaryClass = data.classes[0];

    // Calculate starting HP
    let maxHitPoints = rulesEngine.calculateStartingHitPoints(
      primaryClass.hitDie,
      conMod
    );

    // Add HP for additional levels
    for (let level = 2; level <= totalLevel; level++) {
      maxHitPoints += rulesEngine.calculateHitPointsOnLevelUp(
        primaryClass.hitDie,
        conMod
      );
    }

    // Build proficiencies from class and background
    const proficiencies = this.buildProficiencies(data);

    // Build features from race and class
    const features = this.buildFeatures(data);

    // Build hit dice
    const hitDice = this.buildHitDice(data.classes);

    // Create character in database
    const dbCharacter = await prisma.character.create({
      data: {
        userId,
        campaignId,
        name: data.name,
        race: data.race as object,
        classes: data.classes as object[],
        level: totalLevel,
        experiencePoints: 0,
        background: data.background as object || null,
        alignment: data.alignment || null,
        abilityScores: data.abilityScores,
        maxHitPoints,
        currentHitPoints: maxHitPoints,
        temporaryHitPoints: 0,
        armorClass: 10 + rulesEngine.calculateModifier(data.abilityScores.dexterity),
        speed: data.race.speed,
        hitDice: hitDice,
        deathSaves: { successes: 0, failures: 0 },
        proficiencies,
        features,
        equipment: [],
        currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
        spellcasting: null,
        personality: data.personality || { traits: [], ideals: [], bonds: [], flaws: [] },
        backstory: data.backstory || null,
        appearance: data.appearance || null,
        conditions: [],
        exhaustionLevel: 0,
        inspiration: false,
      },
    });

    return this.mapDbToCharacter(dbCharacter);
  }

  /**
   * Get character by ID
   */
  async getCharacterById(characterId: string): Promise<Character | null> {
    const dbCharacter = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!dbCharacter) return null;

    return this.mapDbToCharacter(dbCharacter);
  }

  /**
   * Get all characters for a user
   */
  async getCharactersByUserId(userId: string): Promise<Character[]> {
    const dbCharacters = await prisma.character.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return dbCharacters.map((c: DbCharacter) => this.mapDbToCharacter(c));
  }

  /**
   * Get all characters for a campaign
   */
  async getCharactersByCampaignId(campaignId: string): Promise<Character[]> {
    const dbCharacters = await prisma.character.findMany({
      where: { campaignId },
      orderBy: { name: 'asc' },
    });

    return dbCharacters.map((c: DbCharacter) => this.mapDbToCharacter(c));
  }

  /**
   * Update character
   */
  async updateCharacter(
    characterId: string,
    updates: Partial<Character>
  ): Promise<Character> {
    const dbCharacter = await prisma.character.update({
      where: { id: characterId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.abilityScores && { abilityScores: updates.abilityScores }),
        ...(updates.currentHitPoints !== undefined && {
          currentHitPoints: updates.currentHitPoints,
        }),
        ...(updates.temporaryHitPoints !== undefined && {
          temporaryHitPoints: updates.temporaryHitPoints,
        }),
        ...(updates.conditions && { conditions: updates.conditions }),
        ...(updates.exhaustionLevel !== undefined && {
          exhaustionLevel: updates.exhaustionLevel,
        }),
        ...(updates.inspiration !== undefined && {
          inspiration: updates.inspiration,
        }),
        ...(updates.inventory && { equipment: updates.inventory }),
        ...(updates.currency && { currency: updates.currency }),
        ...(updates.spellcasting && { spellcasting: updates.spellcasting }),
        ...(updates.personality && { personality: updates.personality }),
        ...(updates.backstory !== undefined && { backstory: updates.backstory }),
        ...(updates.appearance && { appearance: updates.appearance }),
      },
    });

    return this.mapDbToCharacter(dbCharacter);
  }

  /**
   * Delete character
   */
  async deleteCharacter(characterId: string): Promise<void> {
    await prisma.character.delete({
      where: { id: characterId },
    });
  }

  /**
   * Apply damage to character
   */
  async applyDamage(
    characterId: string,
    damage: number,
    damageType?: string
  ): Promise<Character> {
    const character = await this.getCharacterById(characterId);
    if (!character) throw new Error('Character not found');

    let remainingDamage = damage;

    // First reduce temporary HP
    if (character.temporaryHitPoints > 0) {
      if (character.temporaryHitPoints >= remainingDamage) {
        character.temporaryHitPoints -= remainingDamage;
        remainingDamage = 0;
      } else {
        remainingDamage -= character.temporaryHitPoints;
        character.temporaryHitPoints = 0;
      }
    }

    // Then reduce current HP
    character.currentHitPoints = Math.max(
      0,
      character.currentHitPoints - remainingDamage
    );

    return this.updateCharacter(characterId, {
      currentHitPoints: character.currentHitPoints,
      temporaryHitPoints: character.temporaryHitPoints,
    });
  }

  /**
   * Heal character
   */
  async healCharacter(characterId: string, healing: number): Promise<Character> {
    const character = await this.getCharacterById(characterId);
    if (!character) throw new Error('Character not found');

    const newHP = Math.min(
      character.maxHitPoints,
      character.currentHitPoints + healing
    );

    return this.updateCharacter(characterId, {
      currentHitPoints: newHP,
    });
  }

  /**
   * Add temporary hit points
   */
  async addTemporaryHP(characterId: string, tempHP: number): Promise<Character> {
    const character = await this.getCharacterById(characterId);
    if (!character) throw new Error('Character not found');

    // Temporary HP don't stack, take the higher value
    const newTempHP = Math.max(character.temporaryHitPoints, tempHP);

    return this.updateCharacter(characterId, {
      temporaryHitPoints: newTempHP,
    });
  }

  /**
   * Apply a short rest
   */
  async shortRest(characterId: string, hitDiceToSpend: number[]): Promise<Character> {
    const character = await this.getCharacterById(characterId);
    if (!character) throw new Error('Character not found');

    const conMod = rulesEngine.calculateModifier(character.abilityScores.constitution);
    let healingTotal = 0;

    // Roll hit dice for healing
    const updatedHitDice = [...character.hitDice];

    for (const dieIndex of hitDiceToSpend) {
      const hitDie = updatedHitDice[dieIndex];
      if (hitDie && hitDie.used < hitDie.total) {
        // Roll the hit die
        const roll = Math.floor(Math.random() * hitDie.dieType) + 1;
        healingTotal += Math.max(0, roll + conMod);
        hitDie.used++;
      }
    }

    const newHP = Math.min(
      character.maxHitPoints,
      character.currentHitPoints + healingTotal
    );

    // Update character
    await prisma.character.update({
      where: { id: characterId },
      data: {
        currentHitPoints: newHP,
        hitDice: updatedHitDice,
      },
    });

    return this.getCharacterById(characterId) as Promise<Character>;
  }

  /**
   * Apply a long rest
   */
  async longRest(characterId: string): Promise<Character> {
    const character = await this.getCharacterById(characterId);
    if (!character) throw new Error('Character not found');

    // Restore all HP
    const newHP = character.maxHitPoints;

    // Restore half of hit dice (minimum 1)
    const updatedHitDice = character.hitDice.map((hd) => {
      const toRestore = Math.max(1, Math.floor(hd.total / 2));
      return {
        ...hd,
        used: Math.max(0, hd.used - toRestore),
      };
    });

    // Restore spell slots if applicable
    let updatedSpellcasting = character.spellcasting;
    if (updatedSpellcasting) {
      const restoredSlots = { ...updatedSpellcasting.spellSlots };
      for (const level of Object.keys(restoredSlots)) {
        restoredSlots[parseInt(level)].used = 0;
      }
      updatedSpellcasting = { ...updatedSpellcasting, spellSlots: restoredSlots };
    }

    // Reduce exhaustion by 1
    const newExhaustion = Math.max(0, character.exhaustionLevel - 1);

    await prisma.character.update({
      where: { id: characterId },
      data: {
        currentHitPoints: newHP,
        temporaryHitPoints: 0,
        hitDice: updatedHitDice,
        spellcasting: updatedSpellcasting,
        exhaustionLevel: newExhaustion,
      },
    });

    return this.getCharacterById(characterId) as Promise<Character>;
  }

  /**
   * Level up character
   */
  async levelUp(
    characterId: string,
    choices: LevelUpChoices
  ): Promise<Character> {
    const character = await this.getCharacterById(characterId);
    if (!character) throw new Error('Character not found');

    // Find the class to level up
    const classIndex = character.classes.findIndex(
      (c) => c.id === choices.classId
    );
    if (classIndex === -1) throw new Error('Class not found');

    const updatedClasses = [...character.classes];
    updatedClasses[classIndex] = {
      ...updatedClasses[classIndex],
      level: updatedClasses[classIndex].level + 1,
    };

    // Calculate new HP
    const conMod = rulesEngine.calculateModifier(character.abilityScores.constitution);
    const hitDie = updatedClasses[classIndex].hitDie;
    const hpGain = rulesEngine.calculateHitPointsOnLevelUp(
      hitDie,
      conMod,
      choices.hitPointMethod === 'roll' ? choices.hitPointRoll : undefined
    );

    // Update hit dice
    const updatedHitDice = [...character.hitDice];
    const hdIndex = updatedHitDice.findIndex((hd) => hd.dieType === hitDie);
    if (hdIndex !== -1) {
      updatedHitDice[hdIndex] = {
        ...updatedHitDice[hdIndex],
        total: updatedHitDice[hdIndex].total + 1,
      };
    } else {
      updatedHitDice.push({ dieType: hitDie, total: 1, used: 0 });
    }

    // Apply ability score improvement if applicable
    let updatedAbilityScores = character.abilityScores;
    if (choices.abilityScoreImprovement?.type === 'ability-scores') {
      const increases = choices.abilityScoreImprovement.abilityIncreases || {};
      updatedAbilityScores = {
        strength: character.abilityScores.strength + (increases.strength || 0),
        dexterity: character.abilityScores.dexterity + (increases.dexterity || 0),
        constitution:
          character.abilityScores.constitution + (increases.constitution || 0),
        intelligence:
          character.abilityScores.intelligence + (increases.intelligence || 0),
        wisdom: character.abilityScores.wisdom + (increases.wisdom || 0),
        charisma: character.abilityScores.charisma + (increases.charisma || 0),
      };
    }

    const newLevel = updatedClasses.reduce((sum, c) => sum + c.level, 0);

    await prisma.character.update({
      where: { id: characterId },
      data: {
        classes: updatedClasses,
        level: newLevel,
        maxHitPoints: character.maxHitPoints + hpGain,
        currentHitPoints: character.currentHitPoints + hpGain,
        abilityScores: updatedAbilityScores,
        hitDice: updatedHitDice,
      },
    });

    return this.getCharacterById(characterId) as Promise<Character>;
  }

  /**
   * Add condition to character
   */
  async addCondition(
    characterId: string,
    condition: ActiveCondition
  ): Promise<Character> {
    const character = await this.getCharacterById(characterId);
    if (!character) throw new Error('Character not found');

    // Check if condition already exists
    const existingIndex = character.conditions.findIndex(
      (c) => c.type === condition.type
    );

    let updatedConditions = [...character.conditions];
    if (existingIndex !== -1) {
      // Replace existing condition
      updatedConditions[existingIndex] = condition;
    } else {
      updatedConditions.push(condition);
    }

    return this.updateCharacter(characterId, {
      conditions: updatedConditions,
    });
  }

  /**
   * Remove condition from character
   */
  async removeCondition(
    characterId: string,
    conditionType: string
  ): Promise<Character> {
    const character = await this.getCharacterById(characterId);
    if (!character) throw new Error('Character not found');

    const updatedConditions = character.conditions.filter(
      (c) => c.type !== conditionType
    );

    return this.updateCharacter(characterId, {
      conditions: updatedConditions,
    });
  }

  /**
   * Calculate derived stats for a character
   */
  calculateDerivedStats(character: Character): DerivedStats {
    return rulesEngine.calculateDerivedStats(character);
  }

  /**
   * Validate character data
   */
  validateCharacter(character: Character): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Validate ability scores
    const abilities: (keyof AbilityScores)[] = [
      'strength',
      'dexterity',
      'constitution',
      'intelligence',
      'wisdom',
      'charisma',
    ];

    for (const ability of abilities) {
      const score = character.abilityScores[ability];
      if (score < 1 || score > 30) {
        errors.push({
          field: `abilityScores.${ability}`,
          message: `${ability} must be between 1 and 30`,
          code: 'INVALID_ABILITY_SCORE',
        });
      }
    }

    // Validate HP
    if (character.currentHitPoints > character.maxHitPoints) {
      errors.push({
        field: 'currentHitPoints',
        message: 'Current HP cannot exceed max HP',
        code: 'HP_EXCEEDS_MAX',
      });
    }

    if (character.currentHitPoints < 0) {
      errors.push({
        field: 'currentHitPoints',
        message: 'Current HP cannot be negative',
        code: 'HP_NEGATIVE',
      });
    }

    // Validate level
    const totalLevel = character.classes.reduce((sum, c) => sum + c.level, 0);
    if (totalLevel !== character.level) {
      errors.push({
        field: 'level',
        message: 'Character level does not match sum of class levels',
        code: 'LEVEL_MISMATCH',
      });
    }

    if (totalLevel > 20) {
      warnings.push('Character level exceeds 20');
    }

    // Validate exhaustion
    if (character.exhaustionLevel < 0 || character.exhaustionLevel > 6) {
      errors.push({
        field: 'exhaustionLevel',
        message: 'Exhaustion level must be between 0 and 6',
        code: 'INVALID_EXHAUSTION',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate character creation data
   */
  private validateCharacterCreation(data: CharacterCreationData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    try {
      characterCreationSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            code: 'VALIDATION_ERROR',
          });
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Build proficiencies from character creation data
   */
  private buildProficiencies(data: CharacterCreationData): Proficiencies {
    const proficiencies: Proficiencies = {
      savingThrows: [],
      skills: [],
      tools: [],
      weapons: [],
      armor: [],
      languages: [...data.race.languages],
    };

    // Add class proficiencies
    for (const cls of data.classes) {
      proficiencies.savingThrows.push(...cls.savingThrows);
      proficiencies.armor.push(...cls.armorProficiencies);
      proficiencies.weapons.push(...cls.weaponProficiencies);

      if (cls.selectedSkills) {
        proficiencies.skills.push(...cls.selectedSkills);
      }
    }

    // Add background proficiencies
    if (data.background) {
      proficiencies.skills.push(...data.background.skillProficiencies);
      proficiencies.tools.push(...data.background.toolProficiencies);
      if (data.background.selectedLanguages) {
        proficiencies.languages.push(...data.background.selectedLanguages);
      }
    }

    // Remove duplicates
    proficiencies.savingThrows = [...new Set(proficiencies.savingThrows)];
    proficiencies.skills = [...new Set(proficiencies.skills)];
    proficiencies.tools = [...new Set(proficiencies.tools)];
    proficiencies.weapons = [...new Set(proficiencies.weapons)];
    proficiencies.armor = [...new Set(proficiencies.armor)];
    proficiencies.languages = [...new Set(proficiencies.languages)];

    return proficiencies;
  }

  /**
   * Build features from race and class
   */
  private buildFeatures(data: CharacterCreationData): CharacterFeature[] {
    const features: CharacterFeature[] = [];

    // Add racial traits
    for (const trait of data.race.traits) {
      features.push({
        name: trait.name,
        source: `Race: ${data.race.name}`,
        description: trait.description,
      });
    }

    // Add subrace traits if applicable
    if (data.race.selectedSubrace) {
      for (const trait of data.race.selectedSubrace.traits) {
        features.push({
          name: trait.name,
          source: `Subrace: ${data.race.selectedSubrace.name}`,
          description: trait.description,
        });
      }
    }

    // Add class features
    for (const cls of data.classes) {
      for (const feature of cls.features) {
        if (feature.level <= cls.level) {
          features.push({
            name: feature.name,
            source: `Class: ${cls.name} ${feature.level}`,
            description: feature.description,
          });
        }
      }
    }

    // Add background feature
    if (data.background?.feature) {
      features.push({
        name: data.background.feature.name,
        source: `Background: ${data.background.name}`,
        description: data.background.feature.description,
      });
    }

    return features;
  }

  /**
   * Build hit dice from classes
   */
  private buildHitDice(classes: CharacterClass[]): HitDice[] {
    const hitDiceMap: Record<number, number> = {};

    for (const cls of classes) {
      if (!hitDiceMap[cls.hitDie]) {
        hitDiceMap[cls.hitDie] = 0;
      }
      hitDiceMap[cls.hitDie] += cls.level;
    }

    return Object.entries(hitDiceMap).map(([dieType, total]) => ({
      dieType: parseInt(dieType),
      total,
      used: 0,
    }));
  }

  /**
   * Map database character to Character type
   */
  private mapDbToCharacter(dbChar: DbCharacter): Character {
    return {
      id: dbChar.id,
      userId: dbChar.userId,
      campaignId: dbChar.campaignId || undefined,
      name: dbChar.name,
      race: dbChar.race as Race,
      classes: dbChar.classes as CharacterClass[],
      level: dbChar.level,
      experiencePoints: dbChar.experiencePoints,
      background: dbChar.background as Background | undefined,
      alignment: dbChar.alignment as Alignment | undefined,
      abilityScores: dbChar.abilityScores as AbilityScores,
      maxHitPoints: dbChar.maxHitPoints,
      currentHitPoints: dbChar.currentHitPoints,
      temporaryHitPoints: dbChar.temporaryHitPoints,
      armorClass: dbChar.armorClass,
      speed: dbChar.speed,
      hitDice: dbChar.hitDice as HitDice[],
      deathSaves: dbChar.deathSaves as DeathSaves,
      proficiencies: dbChar.proficiencies as Proficiencies,
      features: dbChar.features as CharacterFeature[],
      inventory: dbChar.equipment as InventoryItem[],
      equippedItems: {} as EquippedItems, // Would need to derive from inventory
      currency: dbChar.currency as Currency,
      spellcasting: dbChar.spellcasting as Spellcasting | undefined,
      personality: dbChar.personality as CharacterPersonality,
      backstory: dbChar.backstory || undefined,
      appearance: dbChar.appearance as CharacterAppearance | undefined,
      conditions: dbChar.conditions as ActiveCondition[],
      exhaustionLevel: dbChar.exhaustionLevel,
      inspiration: dbChar.inspiration,
      createdAt: dbChar.createdAt,
      updatedAt: dbChar.updatedAt,
    };
  }
}

// Singleton instance
export const characterService = new CharacterService();
