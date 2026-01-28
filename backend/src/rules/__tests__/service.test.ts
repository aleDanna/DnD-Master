import { rulesService } from '../service';

// Mock the loader to avoid file system access in tests
jest.mock('../loader', () => ({
  loadAllRules: jest.fn().mockResolvedValue({
    sections: new Map([
      [
        'basic_rules-ch9-combat',
        {
          id: 'basic_rules-ch9-combat',
          title: 'Combat',
          source: 'basic_rules',
          chapter: 'Combat',
          chapterNumber: 9,
          content: 'Combat rules for initiative, attacks, and damage.',
          subsections: [],
          keywords: ['combat', 'initiative', 'attack', 'damage'],
        },
      ],
    ]),
    spells: new Map([
      [
        'fireball',
        {
          name: 'Fireball',
          level: 3,
          school: 'evocation',
          castingTime: '1 action',
          range: '150 feet',
          components: 'V, S, M',
          duration: 'Instantaneous',
          description: 'A bright streak flashes from your finger.',
          classes: ['sorcerer', 'wizard'],
          source: 'basic_rules',
        },
      ],
    ]),
    monsters: new Map([
      [
        'goblin',
        {
          name: 'Goblin',
          size: 'Small',
          type: 'humanoid',
          alignment: 'neutral evil',
          armorClass: 15,
          hitPoints: '7 (2d6)',
          speed: '30 ft.',
          abilityScores: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
          senses: 'darkvision 60 ft.',
          languages: 'Common, Goblin',
          challengeRating: '1/4',
          source: 'basic_rules',
        },
      ],
    ]),
    races: new Map(),
    classes: new Map(),
    keywordIndex: new Map([
      ['combat', ['basic_rules-ch9-combat']],
      ['initiative', ['basic_rules-ch9-combat']],
    ]),
  }),
  rulesFilesExist: jest.fn().mockResolvedValue({
    basicRules: true,
    playerHandbook: true,
  }),
}));

describe('RulesService', () => {
  beforeAll(async () => {
    await rulesService.initialize();
  });

  describe('getSpell', () => {
    it('should retrieve a spell by name', () => {
      const spell = rulesService.getSpell('Fireball');

      expect(spell).toBeDefined();
      expect(spell?.name).toBe('Fireball');
      expect(spell?.level).toBe(3);
    });

    it('should return undefined for unknown spells', () => {
      const spell = rulesService.getSpell('NonexistentSpell');
      expect(spell).toBeUndefined();
    });
  });

  describe('getMonster', () => {
    it('should retrieve a monster by name', () => {
      const monster = rulesService.getMonster('Goblin');

      expect(monster).toBeDefined();
      expect(monster?.name).toBe('Goblin');
      expect(monster?.armorClass).toBe(15);
    });
  });

  describe('search', () => {
    it('should find sections by keyword', () => {
      const results = rulesService.search('combat initiative');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.type === 'section' && r.title === 'Combat')).toBe(true);
    });

    it('should find spells by name', () => {
      const results = rulesService.search('fireball');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.type === 'spell')).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = rulesService.search('xyznonexistent');
      expect(results).toEqual([]);
    });

    it('should respect limit parameter', () => {
      const results = rulesService.search('combat', 1);
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getRulesContext', () => {
    it('should return context and citations', () => {
      const { context, citations } = rulesService.getRulesContext('combat attack');

      expect(context.length).toBeGreaterThan(0);
      expect(citations.length).toBeGreaterThan(0);
      expect(citations[0].ruleId).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return counts for all types', () => {
      const stats = rulesService.getStats();

      expect(stats.sections).toBeGreaterThanOrEqual(1);
      expect(stats.spells).toBeGreaterThanOrEqual(1);
      expect(stats.monsters).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getAllSpellNames', () => {
    it('should return array of spell names', () => {
      const names = rulesService.getAllSpellNames();

      expect(Array.isArray(names)).toBe(true);
      expect(names).toContain('Fireball');
    });
  });

  describe('getAllMonsterNames', () => {
    it('should return array of monster names', () => {
      const names = rulesService.getAllMonsterNames();

      expect(Array.isArray(names)).toBe(true);
      expect(names).toContain('Goblin');
    });
  });
});
