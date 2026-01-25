import { CharacterService } from '@/lib/services/character.service';
import type { CharacterCreationData } from '@/types/character.types';

// Mock Prisma
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    character: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('CharacterService', () => {
  let characterService: CharacterService;

  beforeEach(() => {
    characterService = new CharacterService();
    jest.clearAllMocks();
  });

  const mockCharacterData: CharacterCreationData = {
    name: 'Thorin Ironforge',
    race: {
      id: 'dwarf',
      name: 'Dwarf',
      abilityScoreIncreases: { constitution: 2 },
      size: 'medium',
      speed: 25,
      traits: [
        { name: 'Darkvision', description: 'See in darkness up to 60 feet' },
        { name: 'Dwarven Resilience', description: 'Advantage on poison saves' },
      ],
      languages: ['Common', 'Dwarvish'],
    },
    classes: [
      {
        id: 'fighter',
        name: 'Fighter',
        level: 1,
        hitDie: 10,
        primaryAbility: ['strength'],
        savingThrows: ['strength', 'constitution'],
        armorProficiencies: ['light', 'medium', 'heavy', 'shield'],
        weaponProficiencies: ['simple', 'martial'],
        skillChoices: { options: ['athletics', 'intimidation'], count: 2 },
        selectedSkills: ['athletics', 'intimidation'],
        features: [
          { name: 'Fighting Style', level: 1, description: 'Choose a fighting style' },
          { name: 'Second Wind', level: 1, description: 'Regain HP as bonus action' },
        ],
      },
    ],
    abilityScores: {
      strength: 16,
      dexterity: 12,
      constitution: 16,
      intelligence: 10,
      wisdom: 12,
      charisma: 8,
    },
    background: {
      id: 'soldier',
      name: 'Soldier',
      skillProficiencies: ['athletics', 'intimidation'],
      toolProficiencies: ['gaming set', 'vehicles (land)'],
      languages: 0,
      equipment: [],
      feature: {
        name: 'Military Rank',
        description: 'You have a military rank',
      },
      suggestedCharacteristics: {
        personalityTraits: [],
        ideals: [],
        bonds: [],
        flaws: [],
      },
    },
    personality: {
      traits: ['I am always polite and respectful'],
      ideals: ['Honor. The way you do things matters.'],
      bonds: ['My honor is my life.'],
      flaws: ['I am slow to trust.'],
    },
  };

  const mockDbCharacter = {
    id: 'char-123',
    userId: 'user-123',
    campaignId: null,
    name: 'Thorin Ironforge',
    race: mockCharacterData.race,
    classes: mockCharacterData.classes,
    level: 1,
    experiencePoints: 0,
    background: mockCharacterData.background,
    alignment: null,
    abilityScores: mockCharacterData.abilityScores,
    maxHitPoints: 13,
    currentHitPoints: 13,
    temporaryHitPoints: 0,
    armorClass: 11,
    speed: 25,
    hitDice: [{ dieType: 10, total: 1, used: 0 }],
    deathSaves: { successes: 0, failures: 0 },
    proficiencies: {
      savingThrows: ['strength', 'constitution'],
      skills: ['athletics', 'intimidation'],
      tools: ['gaming set', 'vehicles (land)'],
      weapons: ['simple', 'martial'],
      armor: ['light', 'medium', 'heavy', 'shield'],
      languages: ['Common', 'Dwarvish'],
    },
    features: [],
    equipment: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    spellcasting: null,
    personality: mockCharacterData.personality,
    backstory: null,
    appearance: null,
    conditions: [],
    exhaustionLevel: 0,
    inspiration: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createCharacter', () => {
    it('should create a character with correct initial stats', async () => {
      (mockPrisma.character.create as jest.Mock).mockResolvedValue(mockDbCharacter);

      const result = await characterService.createCharacter('user-123', mockCharacterData);

      expect(result.name).toBe('Thorin Ironforge');
      expect(result.level).toBe(1);
      expect(mockPrisma.character.create).toHaveBeenCalled();
    });

    it('should calculate starting HP correctly (d10 + 3 CON = 13)', async () => {
      (mockPrisma.character.create as jest.Mock).mockResolvedValue(mockDbCharacter);

      await characterService.createCharacter('user-123', mockCharacterData);

      const createCall = (mockPrisma.character.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.maxHitPoints).toBe(13); // 10 + 3 (CON mod)
    });

    it('should set initial AC based on DEX', async () => {
      (mockPrisma.character.create as jest.Mock).mockResolvedValue(mockDbCharacter);

      await characterService.createCharacter('user-123', mockCharacterData);

      const createCall = (mockPrisma.character.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.armorClass).toBe(11); // 10 + 1 (DEX mod)
    });

    it('should set speed from race', async () => {
      (mockPrisma.character.create as jest.Mock).mockResolvedValue(mockDbCharacter);

      await characterService.createCharacter('user-123', mockCharacterData);

      const createCall = (mockPrisma.character.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.speed).toBe(25); // Dwarf speed
    });

    it('should throw error for invalid character data', async () => {
      const invalidData = {
        ...mockCharacterData,
        name: '', // Invalid: empty name
      };

      await expect(
        characterService.createCharacter('user-123', invalidData)
      ).rejects.toThrow('Invalid character data');
    });
  });

  describe('getCharacterById', () => {
    it('should return character if found', async () => {
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(mockDbCharacter);

      const result = await characterService.getCharacterById('char-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('char-123');
      expect(result?.name).toBe('Thorin Ironforge');
    });

    it('should return null if not found', async () => {
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await characterService.getCharacterById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('applyDamage', () => {
    it('should reduce HP correctly', async () => {
      const character = { ...mockDbCharacter, currentHitPoints: 13 };
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(character);
      (mockPrisma.character.update as jest.Mock).mockResolvedValue({
        ...character,
        currentHitPoints: 8,
      });

      const result = await characterService.applyDamage('char-123', 5);

      expect(result.currentHitPoints).toBe(8);
    });

    it('should reduce temp HP first', async () => {
      const character = {
        ...mockDbCharacter,
        currentHitPoints: 13,
        temporaryHitPoints: 5,
      };
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(character);
      (mockPrisma.character.update as jest.Mock).mockResolvedValue({
        ...character,
        currentHitPoints: 13,
        temporaryHitPoints: 2,
      });

      const result = await characterService.applyDamage('char-123', 3);

      expect(result.temporaryHitPoints).toBe(2);
      expect(result.currentHitPoints).toBe(13);
    });

    it('should overflow damage from temp HP to regular HP', async () => {
      const character = {
        ...mockDbCharacter,
        currentHitPoints: 13,
        temporaryHitPoints: 3,
      };
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(character);
      (mockPrisma.character.update as jest.Mock).mockResolvedValue({
        ...character,
        currentHitPoints: 8,
        temporaryHitPoints: 0,
      });

      const result = await characterService.applyDamage('char-123', 8);

      expect(result.temporaryHitPoints).toBe(0);
      expect(result.currentHitPoints).toBe(8);
    });

    it('should not reduce HP below 0', async () => {
      const character = { ...mockDbCharacter, currentHitPoints: 5 };
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(character);
      (mockPrisma.character.update as jest.Mock).mockResolvedValue({
        ...character,
        currentHitPoints: 0,
      });

      const result = await characterService.applyDamage('char-123', 10);

      expect(result.currentHitPoints).toBe(0);
    });
  });

  describe('healCharacter', () => {
    it('should increase HP correctly', async () => {
      const character = { ...mockDbCharacter, currentHitPoints: 5 };
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(character);
      (mockPrisma.character.update as jest.Mock).mockResolvedValue({
        ...character,
        currentHitPoints: 10,
      });

      const result = await characterService.healCharacter('char-123', 5);

      expect(result.currentHitPoints).toBe(10);
    });

    it('should not exceed max HP', async () => {
      const character = { ...mockDbCharacter, currentHitPoints: 10, maxHitPoints: 13 };
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(character);
      (mockPrisma.character.update as jest.Mock).mockResolvedValue({
        ...character,
        currentHitPoints: 13,
      });

      const result = await characterService.healCharacter('char-123', 10);

      expect(result.currentHitPoints).toBe(13);
    });
  });

  describe('addTemporaryHP', () => {
    it('should add temp HP when none exist', async () => {
      const character = { ...mockDbCharacter, temporaryHitPoints: 0 };
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(character);
      (mockPrisma.character.update as jest.Mock).mockResolvedValue({
        ...character,
        temporaryHitPoints: 10,
      });

      const result = await characterService.addTemporaryHP('char-123', 10);

      expect(result.temporaryHitPoints).toBe(10);
    });

    it('should take higher value when temp HP already exists', async () => {
      const character = { ...mockDbCharacter, temporaryHitPoints: 5 };
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(character);
      (mockPrisma.character.update as jest.Mock).mockResolvedValue({
        ...character,
        temporaryHitPoints: 8,
      });

      const result = await characterService.addTemporaryHP('char-123', 8);

      expect(result.temporaryHitPoints).toBe(8);
    });

    it('should keep existing temp HP if higher', async () => {
      const character = { ...mockDbCharacter, temporaryHitPoints: 10 };
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(character);
      (mockPrisma.character.update as jest.Mock).mockResolvedValue({
        ...character,
        temporaryHitPoints: 10,
      });

      const result = await characterService.addTemporaryHP('char-123', 5);

      expect(result.temporaryHitPoints).toBe(10);
    });
  });

  describe('addCondition', () => {
    it('should add a new condition', async () => {
      const character = { ...mockDbCharacter, conditions: [] };
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(character);
      (mockPrisma.character.update as jest.Mock).mockResolvedValue({
        ...character,
        conditions: [{ type: 'poisoned' }],
      });

      const result = await characterService.addCondition('char-123', {
        type: 'poisoned',
      });

      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0].type).toBe('poisoned');
    });

    it('should replace existing condition of same type', async () => {
      const character = {
        ...mockDbCharacter,
        conditions: [{ type: 'frightened', source: 'Dragon' }],
      };
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(character);
      (mockPrisma.character.update as jest.Mock).mockResolvedValue({
        ...character,
        conditions: [{ type: 'frightened', source: 'Ghost' }],
      });

      const result = await characterService.addCondition('char-123', {
        type: 'frightened',
        source: 'Ghost',
      });

      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0].source).toBe('Ghost');
    });
  });

  describe('removeCondition', () => {
    it('should remove a condition', async () => {
      const character = {
        ...mockDbCharacter,
        conditions: [{ type: 'poisoned' }, { type: 'frightened' }],
      };
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(character);
      (mockPrisma.character.update as jest.Mock).mockResolvedValue({
        ...character,
        conditions: [{ type: 'frightened' }],
      });

      const result = await characterService.removeCondition('char-123', 'poisoned');

      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0].type).toBe('frightened');
    });
  });

  describe('validateCharacter', () => {
    it('should validate a correct character', () => {
      const character = {
        id: 'char-123',
        userId: 'user-123',
        name: 'Test',
        race: mockCharacterData.race,
        classes: mockCharacterData.classes,
        level: 1,
        experiencePoints: 0,
        abilityScores: mockCharacterData.abilityScores,
        maxHitPoints: 13,
        currentHitPoints: 13,
        temporaryHitPoints: 0,
        armorClass: 11,
        speed: 25,
        hitDice: [{ dieType: 10, total: 1, used: 0 }],
        deathSaves: { successes: 0, failures: 0 },
        proficiencies: {
          savingThrows: [],
          skills: [],
          tools: [],
          weapons: [],
          armor: [],
          languages: [],
        },
        features: [],
        inventory: [],
        equippedItems: {},
        currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
        personality: { traits: [], ideals: [], bonds: [], flaws: [] },
        conditions: [],
        exhaustionLevel: 0,
        inspiration: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = characterService.validateCharacter(character as any);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch invalid ability scores', () => {
      const character = {
        id: 'char-123',
        userId: 'user-123',
        name: 'Test',
        race: mockCharacterData.race,
        classes: mockCharacterData.classes,
        level: 1,
        experiencePoints: 0,
        abilityScores: {
          strength: 35, // Invalid: too high
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        maxHitPoints: 10,
        currentHitPoints: 10,
        temporaryHitPoints: 0,
        armorClass: 10,
        speed: 30,
        hitDice: [],
        deathSaves: { successes: 0, failures: 0 },
        proficiencies: {
          savingThrows: [],
          skills: [],
          tools: [],
          weapons: [],
          armor: [],
          languages: [],
        },
        features: [],
        inventory: [],
        equippedItems: {},
        currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
        personality: { traits: [], ideals: [], bonds: [], flaws: [] },
        conditions: [],
        exhaustionLevel: 0,
        inspiration: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = characterService.validateCharacter(character as any);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'abilityScores.strength')).toBe(true);
    });

    it('should catch HP exceeding max', () => {
      const character = {
        id: 'char-123',
        userId: 'user-123',
        name: 'Test',
        race: mockCharacterData.race,
        classes: mockCharacterData.classes,
        level: 1,
        experiencePoints: 0,
        abilityScores: mockCharacterData.abilityScores,
        maxHitPoints: 10,
        currentHitPoints: 15, // Invalid: exceeds max
        temporaryHitPoints: 0,
        armorClass: 10,
        speed: 30,
        hitDice: [],
        deathSaves: { successes: 0, failures: 0 },
        proficiencies: {
          savingThrows: [],
          skills: [],
          tools: [],
          weapons: [],
          armor: [],
          languages: [],
        },
        features: [],
        inventory: [],
        equippedItems: {},
        currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
        personality: { traits: [], ideals: [], bonds: [], flaws: [] },
        conditions: [],
        exhaustionLevel: 0,
        inspiration: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = characterService.validateCharacter(character as any);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'HP_EXCEEDS_MAX')).toBe(true);
    });
  });
});
