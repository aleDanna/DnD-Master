import { RulesEngine, PROFICIENCY_BONUS_BY_LEVEL, EXPERIENCE_THRESHOLDS } from '@/lib/services/rules.engine';
import type { Character } from '@/types/character.types';
import type { AbilityScores, Weapon } from '@/types/dnd.types';

describe('RulesEngine', () => {
  let rulesEngine: RulesEngine;

  beforeEach(() => {
    rulesEngine = new RulesEngine();
  });

  // Helper to create a mock character
  const createMockCharacter = (overrides: Partial<Character> = {}): Character => ({
    id: 'char-1',
    userId: 'user-1',
    name: 'Test Character',
    race: {
      id: 'human',
      name: 'Human',
      abilityScoreIncreases: { strength: 1 },
      size: 'medium',
      speed: 30,
      traits: [],
      languages: ['Common'],
    },
    classes: [
      {
        id: 'fighter',
        name: 'Fighter',
        level: 5,
        hitDie: 10,
        primaryAbility: ['strength'],
        savingThrows: ['strength', 'constitution'],
        armorProficiencies: ['light', 'medium', 'heavy', 'shield'],
        weaponProficiencies: ['simple', 'martial'],
        skillChoices: { options: [], count: 0 },
        features: [],
      },
    ],
    level: 5,
    experiencePoints: 6500,
    abilityScores: {
      strength: 16,
      dexterity: 14,
      constitution: 14,
      intelligence: 10,
      wisdom: 12,
      charisma: 8,
    },
    maxHitPoints: 44,
    currentHitPoints: 44,
    temporaryHitPoints: 0,
    armorClass: 18,
    speed: 30,
    hitDice: [{ dieType: 10, total: 5, used: 0 }],
    deathSaves: { successes: 0, failures: 0 },
    proficiencies: {
      savingThrows: ['strength', 'constitution'],
      skills: ['athletics', 'intimidation'],
      tools: [],
      weapons: ['simple', 'martial'],
      armor: ['light', 'medium', 'heavy', 'shield'],
      languages: ['Common'],
    },
    features: [],
    inventory: [],
    equippedItems: {},
    currency: { cp: 0, sp: 0, ep: 0, gp: 100, pp: 0 },
    personality: { traits: [], ideals: [], bonds: [], flaws: [] },
    conditions: [],
    exhaustionLevel: 0,
    inspiration: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  describe('calculateModifier', () => {
    it('should calculate correct modifier for score of 10', () => {
      expect(rulesEngine.calculateModifier(10)).toBe(0);
    });

    it('should calculate correct modifier for score of 11', () => {
      expect(rulesEngine.calculateModifier(11)).toBe(0);
    });

    it('should calculate correct modifier for score of 1', () => {
      expect(rulesEngine.calculateModifier(1)).toBe(-5);
    });

    it('should calculate correct modifier for score of 20', () => {
      expect(rulesEngine.calculateModifier(20)).toBe(5);
    });

    it('should calculate correct modifier for score of 8', () => {
      expect(rulesEngine.calculateModifier(8)).toBe(-1);
    });

    it('should calculate correct modifier for score of 15', () => {
      expect(rulesEngine.calculateModifier(15)).toBe(2);
    });

    it('should handle all standard ability scores', () => {
      const expected: Record<number, number> = {
        1: -5, 2: -4, 3: -4, 4: -3, 5: -3,
        6: -2, 7: -2, 8: -1, 9: -1, 10: 0,
        11: 0, 12: 1, 13: 1, 14: 2, 15: 2,
        16: 3, 17: 3, 18: 4, 19: 4, 20: 5,
      };

      Object.entries(expected).forEach(([score, mod]) => {
        expect(rulesEngine.calculateModifier(Number(score))).toBe(mod);
      });
    });
  });

  describe('calculateAllModifiers', () => {
    it('should calculate all modifiers correctly', () => {
      const scores: AbilityScores = {
        strength: 16,
        dexterity: 14,
        constitution: 14,
        intelligence: 10,
        wisdom: 12,
        charisma: 8,
      };

      const result = rulesEngine.calculateAllModifiers(scores);

      expect(result.strength).toBe(3);
      expect(result.dexterity).toBe(2);
      expect(result.constitution).toBe(2);
      expect(result.intelligence).toBe(0);
      expect(result.wisdom).toBe(1);
      expect(result.charisma).toBe(-1);
    });
  });

  describe('getProficiencyBonus', () => {
    it('should return +2 for levels 1-4', () => {
      expect(rulesEngine.getProficiencyBonus(1)).toBe(2);
      expect(rulesEngine.getProficiencyBonus(4)).toBe(2);
    });

    it('should return +3 for levels 5-8', () => {
      expect(rulesEngine.getProficiencyBonus(5)).toBe(3);
      expect(rulesEngine.getProficiencyBonus(8)).toBe(3);
    });

    it('should return +4 for levels 9-12', () => {
      expect(rulesEngine.getProficiencyBonus(9)).toBe(4);
      expect(rulesEngine.getProficiencyBonus(12)).toBe(4);
    });

    it('should return +5 for levels 13-16', () => {
      expect(rulesEngine.getProficiencyBonus(13)).toBe(5);
      expect(rulesEngine.getProficiencyBonus(16)).toBe(5);
    });

    it('should return +6 for levels 17-20', () => {
      expect(rulesEngine.getProficiencyBonus(17)).toBe(6);
      expect(rulesEngine.getProficiencyBonus(20)).toBe(6);
    });

    it('should clamp level to valid range', () => {
      expect(rulesEngine.getProficiencyBonus(0)).toBe(2);
      expect(rulesEngine.getProficiencyBonus(25)).toBe(6);
    });
  });

  describe('calculateTotalLevel', () => {
    it('should sum all class levels', () => {
      const character = createMockCharacter({
        classes: [
          { id: 'fighter', name: 'Fighter', level: 3, hitDie: 10, primaryAbility: ['strength'], savingThrows: ['strength', 'constitution'], armorProficiencies: [], weaponProficiencies: [], skillChoices: { options: [], count: 0 }, features: [] },
          { id: 'rogue', name: 'Rogue', level: 2, hitDie: 8, primaryAbility: ['dexterity'], savingThrows: ['dexterity', 'intelligence'], armorProficiencies: [], weaponProficiencies: [], skillChoices: { options: [], count: 0 }, features: [] },
        ],
      });

      expect(rulesEngine.calculateTotalLevel(character)).toBe(5);
    });
  });

  describe('calculateArmorClass', () => {
    it('should return 10 + DEX mod for unarmored', () => {
      const character = createMockCharacter({
        equippedItems: {},
        abilityScores: { strength: 10, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      });

      expect(rulesEngine.calculateArmorClass(character)).toBe(12); // 10 + 2
    });

    it('should calculate AC with light armor', () => {
      const character = createMockCharacter({
        equippedItems: {
          armor: {
            id: 'leather',
            name: 'Leather Armor',
            quantity: 1,
            weight: 10,
            armor: {
              id: 'leather',
              name: 'Leather Armor',
              type: 'light',
              baseAC: 11,
              addDexModifier: true,
              stealthDisadvantage: false,
              weight: 10,
              cost: { amount: 10, unit: 'gp' },
            },
          },
        },
        abilityScores: { strength: 10, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      });

      expect(rulesEngine.calculateArmorClass(character)).toBe(13); // 11 + 2
    });

    it('should cap DEX bonus for medium armor', () => {
      const character = createMockCharacter({
        equippedItems: {
          armor: {
            id: 'chainshirt',
            name: 'Chain Shirt',
            quantity: 1,
            weight: 20,
            armor: {
              id: 'chainshirt',
              name: 'Chain Shirt',
              type: 'medium',
              baseAC: 13,
              addDexModifier: true,
              maxDexBonus: 2,
              stealthDisadvantage: false,
              weight: 20,
              cost: { amount: 50, unit: 'gp' },
            },
          },
        },
        abilityScores: { strength: 10, dexterity: 18, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      });

      expect(rulesEngine.calculateArmorClass(character)).toBe(15); // 13 + 2 (capped)
    });

    it('should not add DEX for heavy armor', () => {
      const character = createMockCharacter({
        equippedItems: {
          armor: {
            id: 'platemail',
            name: 'Plate',
            quantity: 1,
            weight: 65,
            armor: {
              id: 'platemail',
              name: 'Plate',
              type: 'heavy',
              baseAC: 18,
              addDexModifier: false,
              stealthDisadvantage: true,
              weight: 65,
              cost: { amount: 1500, unit: 'gp' },
            },
          },
        },
        abilityScores: { strength: 15, dexterity: 18, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      });

      expect(rulesEngine.calculateArmorClass(character)).toBe(18);
    });

    it('should add shield bonus', () => {
      const character = createMockCharacter({
        equippedItems: {
          armor: {
            id: 'leather',
            name: 'Leather Armor',
            quantity: 1,
            weight: 10,
            armor: {
              id: 'leather',
              name: 'Leather Armor',
              type: 'light',
              baseAC: 11,
              addDexModifier: true,
              stealthDisadvantage: false,
              weight: 10,
              cost: { amount: 10, unit: 'gp' },
            },
          },
          shield: {
            id: 'shield',
            name: 'Shield',
            quantity: 1,
            weight: 6,
            armor: {
              id: 'shield',
              name: 'Shield',
              type: 'shield',
              baseAC: 2,
              addDexModifier: false,
              stealthDisadvantage: false,
              weight: 6,
              cost: { amount: 10, unit: 'gp' },
            },
          },
        },
        abilityScores: { strength: 10, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      });

      expect(rulesEngine.calculateArmorClass(character)).toBe(15); // 11 + 2 + 2
    });
  });

  describe('calculateInitiative', () => {
    it('should return DEX modifier', () => {
      const character = createMockCharacter({
        abilityScores: { strength: 10, dexterity: 16, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      });

      expect(rulesEngine.calculateInitiative(character)).toBe(3);
    });
  });

  describe('calculatePassivePerception', () => {
    it('should be 10 + WIS mod without proficiency', () => {
      const character = createMockCharacter({
        abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 14, charisma: 10 },
        proficiencies: { savingThrows: [], skills: [], tools: [], weapons: [], armor: [], languages: [] },
      });

      expect(rulesEngine.calculatePassivePerception(character)).toBe(12); // 10 + 2
    });

    it('should add proficiency bonus when proficient', () => {
      const character = createMockCharacter({
        abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 14, charisma: 10 },
        proficiencies: { savingThrows: [], skills: ['perception'], tools: [], weapons: [], armor: [], languages: [] },
        level: 5,
      });

      expect(rulesEngine.calculatePassivePerception(character)).toBe(15); // 10 + 2 + 3
    });
  });

  describe('calculateSpellSaveDC', () => {
    it('should return undefined for non-spellcasters', () => {
      const character = createMockCharacter();
      expect(rulesEngine.calculateSpellSaveDC(character)).toBeUndefined();
    });

    it('should calculate DC for spellcasters', () => {
      const character = createMockCharacter({
        spellcasting: {
          spellcastingAbility: 'intelligence',
          spellSlots: {},
          spellsKnown: [],
          preparedSpells: [],
          cantripsKnown: [],
        },
        abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 16, wisdom: 10, charisma: 10 },
      });

      expect(rulesEngine.calculateSpellSaveDC(character)).toBe(14); // 8 + 3 + 3
    });
  });

  describe('calculateAttackBonus', () => {
    const longsword: Weapon = {
      id: 'longsword',
      name: 'Longsword',
      category: 'martial',
      weaponType: 'melee',
      damage: '1d8',
      damageType: 'slashing',
      properties: [],
      weight: 3,
      cost: { amount: 15, unit: 'gp' },
    };

    const rapier: Weapon = {
      id: 'rapier',
      name: 'Rapier',
      category: 'martial',
      weaponType: 'melee',
      damage: '1d8',
      damageType: 'piercing',
      properties: ['finesse'],
      weight: 2,
      cost: { amount: 25, unit: 'gp' },
    };

    const longbow: Weapon = {
      id: 'longbow',
      name: 'Longbow',
      category: 'martial',
      weaponType: 'ranged',
      damage: '1d8',
      damageType: 'piercing',
      properties: ['ammunition', 'heavy', 'two-handed'],
      weight: 2,
      cost: { amount: 50, unit: 'gp' },
      range: { normal: 150, long: 600 },
    };

    it('should use STR for melee weapons', () => {
      const character = createMockCharacter();
      // STR 16 (+3), proficiency +3 for level 5
      expect(rulesEngine.calculateAttackBonus(character, longsword)).toBe(6);
    });

    it('should use DEX for ranged weapons', () => {
      const character = createMockCharacter();
      // DEX 14 (+2), proficiency +3 for level 5
      expect(rulesEngine.calculateAttackBonus(character, longbow)).toBe(5);
    });

    it('should use higher of STR/DEX for finesse weapons', () => {
      const character = createMockCharacter();
      // STR 16 (+3) > DEX 14 (+2), proficiency +3
      expect(rulesEngine.calculateAttackBonus(character, rapier)).toBe(6);

      // Now with higher DEX
      const dexCharacter = createMockCharacter({
        abilityScores: { strength: 10, dexterity: 18, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      });
      expect(rulesEngine.calculateAttackBonus(dexCharacter, rapier)).toBe(7); // 4 + 3
    });

    it('should not add proficiency for non-proficient weapons', () => {
      const character = createMockCharacter({
        proficiencies: { savingThrows: [], skills: [], tools: [], weapons: ['simple'], armor: [], languages: [] },
      });
      // STR 16 (+3), no proficiency
      expect(rulesEngine.calculateAttackBonus(character, longsword)).toBe(3);
    });
  });

  describe('getConditionEffects', () => {
    it('should return effects for paralyzed condition', () => {
      const effects = rulesEngine.getConditionEffects('paralyzed');
      expect(effects.cantMove).toBe(true);
      expect(effects.cantTakeActions).toBe(true);
      expect(effects.autoFailStrengthSaves).toBe(true);
      expect(effects.autoFailDexteritySaves).toBe(true);
      expect(effects.incapacitated).toBe(true);
    });

    it('should return effects for poisoned condition', () => {
      const effects = rulesEngine.getConditionEffects('poisoned');
      expect(effects.attacksHaveDisadvantage).toBe(true);
      expect(effects.cantMove).toBe(false);
    });

    it('should return effects for grappled condition', () => {
      const effects = rulesEngine.getConditionEffects('grappled');
      expect(effects.speedZero).toBe(true);
      expect(effects.cantTakeActions).toBe(false);
    });
  });

  describe('calculateLevelFromXP', () => {
    it('should return level 1 for 0 XP', () => {
      expect(rulesEngine.calculateLevelFromXP(0)).toBe(1);
    });

    it('should return level 2 for 300 XP', () => {
      expect(rulesEngine.calculateLevelFromXP(300)).toBe(2);
    });

    it('should return level 5 for 6500 XP', () => {
      expect(rulesEngine.calculateLevelFromXP(6500)).toBe(5);
    });

    it('should return level 20 for max XP', () => {
      expect(rulesEngine.calculateLevelFromXP(355000)).toBe(20);
    });

    it('should return correct level for XP between thresholds', () => {
      expect(rulesEngine.calculateLevelFromXP(500)).toBe(2);
      expect(rulesEngine.calculateLevelFromXP(899)).toBe(2);
    });
  });

  describe('getXPForNextLevel', () => {
    it('should return XP needed for level 2', () => {
      expect(rulesEngine.getXPForNextLevel(1)).toBe(300);
    });

    it('should return XP needed for level 6', () => {
      expect(rulesEngine.getXPForNextLevel(5)).toBe(14000);
    });

    it('should return 0 for level 20', () => {
      expect(rulesEngine.getXPForNextLevel(20)).toBe(0);
    });
  });

  describe('calculateCarryingCapacity', () => {
    it('should be STR * 15', () => {
      const character = createMockCharacter({
        abilityScores: { strength: 16, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      });
      expect(rulesEngine.calculateCarryingCapacity(character)).toBe(240);
    });
  });

  describe('getConcentrationSaveDC', () => {
    it('should return 10 for low damage', () => {
      expect(rulesEngine.getConcentrationSaveDC(5)).toBe(10);
      expect(rulesEngine.getConcentrationSaveDC(19)).toBe(10);
    });

    it('should return half damage for high damage', () => {
      expect(rulesEngine.getConcentrationSaveDC(20)).toBe(10);
      expect(rulesEngine.getConcentrationSaveDC(22)).toBe(11);
      expect(rulesEngine.getConcentrationSaveDC(40)).toBe(20);
    });
  });

  describe('calculateHitPointsOnLevelUp', () => {
    it('should use average if no roll provided', () => {
      // d10 average is 5.5, ceil + 1 = 6
      expect(rulesEngine.calculateHitPointsOnLevelUp(10, 2)).toBe(8); // 6 + 2
    });

    it('should use roll value if provided', () => {
      expect(rulesEngine.calculateHitPointsOnLevelUp(10, 2, 8)).toBe(10); // 8 + 2
    });

    it('should return minimum of 1', () => {
      expect(rulesEngine.calculateHitPointsOnLevelUp(6, -5, 1)).toBe(1); // max(1, 1 - 5)
    });
  });

  describe('calculateStartingHitPoints', () => {
    it('should be max hit die + CON mod', () => {
      expect(rulesEngine.calculateStartingHitPoints(10, 2)).toBe(12);
      expect(rulesEngine.calculateStartingHitPoints(6, 3)).toBe(9);
    });
  });
});
