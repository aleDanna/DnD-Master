import { DiceService } from '@/lib/services/dice.service';

describe('DiceService', () => {
  let diceService: DiceService;

  beforeEach(() => {
    diceService = new DiceService();
  });

  describe('rollDie', () => {
    it('should return a value between 1 and sides (inclusive)', () => {
      for (let i = 0; i < 100; i++) {
        const result = diceService.rollDie(20);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(20);
      }
    });

    it('should return 1 for a 1-sided die', () => {
      const result = diceService.rollDie(1);
      expect(result).toBe(1);
    });
  });

  describe('rollDice', () => {
    it('should return the correct number of dice', () => {
      const result = diceService.rollDice(5, 6);
      expect(result).toHaveLength(5);
    });

    it('should return values within valid range', () => {
      const result = diceService.rollDice(10, 8);
      result.forEach((roll) => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(8);
      });
    });
  });

  describe('roll', () => {
    it('should parse simple dice expression (1d20)', () => {
      const result = diceService.roll('1d20');
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
      expect(result.rolls[0]).toBeLessThanOrEqual(20);
      expect(result.modifier).toBe(0);
      expect(result.expression).toBe('1d20');
    });

    it('should parse dice with modifier (1d20+5)', () => {
      const result = diceService.roll('1d20+5');
      expect(result.modifier).toBe(5);
      expect(result.total).toBe(result.rolls[0] + 5);
    });

    it('should parse dice with negative modifier (1d20-3)', () => {
      const result = diceService.roll('1d20-3');
      expect(result.modifier).toBe(-3);
      expect(result.total).toBe(result.rolls[0] - 3);
    });

    it('should parse multiple dice (2d6)', () => {
      const result = diceService.roll('2d6');
      expect(result.rolls).toHaveLength(2);
      result.rolls.forEach((roll) => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      });
    });

    it('should parse complex expression (2d6+1d4+3)', () => {
      const result = diceService.roll('2d6+1d4+3');
      expect(result.rolls).toHaveLength(3); // 2 from 2d6, 1 from 1d4
      expect(result.modifier).toBe(3);
    });

    it('should handle implied count (d20 = 1d20)', () => {
      const result = diceService.roll('d20');
      expect(result.rolls).toHaveLength(1);
    });

    it('should generate unique IDs', () => {
      const result1 = diceService.roll('1d20');
      const result2 = diceService.roll('1d20');
      expect(result1.id).not.toBe(result2.id);
    });

    it('should include timestamp', () => {
      const before = new Date();
      const result = diceService.roll('1d20');
      const after = new Date();
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should set natural value for d20 rolls', () => {
      const result = diceService.roll('1d20');
      expect(result.natural).toBe(result.rolls[0]);
    });

    it('should not set natural for non-d20 rolls', () => {
      const result = diceService.roll('2d6');
      expect(result.natural).toBeUndefined();
    });
  });

  describe('advantage and disadvantage', () => {
    it('should roll with advantage (higher of two rolls)', () => {
      // Run multiple times to verify behavior statistically
      let advantageWasApplied = false;
      for (let i = 0; i < 50; i++) {
        const result = diceService.rollWithAdvantage('1d20');
        expect(result.advantage).toBe(true);
        expect(result.disadvantage).toBeUndefined();
        if (result.discardedRoll !== undefined) {
          expect(result.discardedRoll).toBeLessThanOrEqual(result.rolls[0]);
          advantageWasApplied = true;
        }
      }
      // At least some rolls should have shown the discarded value
      expect(advantageWasApplied).toBe(true);
    });

    it('should roll with disadvantage (lower of two rolls)', () => {
      let disadvantageWasApplied = false;
      for (let i = 0; i < 50; i++) {
        const result = diceService.rollWithDisadvantage('1d20');
        expect(result.disadvantage).toBe(true);
        expect(result.advantage).toBeUndefined();
        if (result.discardedRoll !== undefined) {
          expect(result.discardedRoll).toBeGreaterThanOrEqual(result.rolls[0]);
          disadvantageWasApplied = true;
        }
      }
      expect(disadvantageWasApplied).toBe(true);
    });

    it('should not apply advantage to non-d20 rolls', () => {
      const result = diceService.roll('2d6', { advantage: true });
      expect(result.discardedRoll).toBeUndefined();
    });
  });

  describe('rollAbilityScores', () => {
    it('should return 6 ability score rolls', () => {
      const result = diceService.rollAbilityScores();
      expect(result.totals).toHaveLength(6);
      expect(result.rolls).toHaveLength(6);
    });

    it('should roll 4d6 for each ability', () => {
      const result = diceService.rollAbilityScores();
      result.rolls.forEach((roll) => {
        expect(roll.dice).toHaveLength(4);
        roll.dice.forEach((die) => {
          expect(die).toBeGreaterThanOrEqual(1);
          expect(die).toBeLessThanOrEqual(6);
        });
      });
    });

    it('should drop the lowest die', () => {
      const result = diceService.rollAbilityScores();
      result.rolls.forEach((roll) => {
        const min = Math.min(...roll.dice);
        expect(roll.dropped).toBe(min);
        // Total should be sum of 3 highest dice
        const sortedDice = [...roll.dice].sort((a, b) => b - a);
        const expectedTotal = sortedDice[0] + sortedDice[1] + sortedDice[2];
        expect(roll.total).toBe(expectedTotal);
      });
    });

    it('should produce totals between 3 and 18', () => {
      const result = diceService.rollAbilityScores();
      result.totals.forEach((total) => {
        expect(total).toBeGreaterThanOrEqual(3);
        expect(total).toBeLessThanOrEqual(18);
      });
    });
  });

  describe('rollInitiative', () => {
    it('should roll 1d20 + modifier', () => {
      const result = diceService.rollInitiative(3);
      expect(result.modifier).toBe(3);
      expect(result.total).toBe(result.rolls[0] + 3);
    });

    it('should handle negative modifiers', () => {
      const result = diceService.rollInitiative(-2);
      expect(result.modifier).toBe(-2);
      expect(result.total).toBe(result.rolls[0] - 2);
    });

    it('should support advantage for initiative', () => {
      const result = diceService.rollInitiative(2, { advantage: true });
      expect(result.advantage).toBe(true);
    });
  });

  describe('rollAttack', () => {
    it('should determine hit correctly', () => {
      // Mock a known roll by testing the logic
      const result = diceService.rollAttack(5, 15);
      if (result.natural === 20) {
        expect(result.hit).toBe(true);
        expect(result.critical).toBe(true);
      } else if (result.natural === 1) {
        expect(result.hit).toBe(false);
        expect(result.criticalMiss).toBe(true);
      } else {
        expect(result.hit).toBe(result.total >= 15);
      }
    });

    it('should identify critical hits (natural 20)', () => {
      // Run many times to eventually get a 20
      let foundCritical = false;
      for (let i = 0; i < 100 && !foundCritical; i++) {
        const result = diceService.rollAttack(5, 30);
        if (result.natural === 20) {
          expect(result.critical).toBe(true);
          expect(result.hit).toBe(true); // Crits always hit
          foundCritical = true;
        }
      }
    });

    it('should identify critical misses (natural 1)', () => {
      let foundCritMiss = false;
      for (let i = 0; i < 100 && !foundCritMiss; i++) {
        const result = diceService.rollAttack(5, 2);
        if (result.natural === 1) {
          expect(result.criticalMiss).toBe(true);
          expect(result.hit).toBe(false); // Crit miss always misses
          foundCritMiss = true;
        }
      }
    });

    it('should include target AC', () => {
      const result = diceService.rollAttack(5, 18);
      expect(result.targetAC).toBe(18);
    });

    it('should support custom critical range', () => {
      let foundCritOn19 = false;
      for (let i = 0; i < 100 && !foundCritOn19; i++) {
        const result = diceService.rollAttack(5, 25, { criticalRange: 19 });
        if (result.natural === 19) {
          expect(result.critical).toBe(true);
          foundCritOn19 = true;
        }
      }
    });
  });

  describe('rollDamage', () => {
    it('should roll damage correctly', () => {
      const result = diceService.rollDamage('2d6+3', 'slashing');
      expect(result.type).toBe('slashing');
      expect(result.total).toBeGreaterThanOrEqual(5); // 2 + 3
      expect(result.total).toBeLessThanOrEqual(15); // 12 + 3
    });

    it('should double dice on critical', () => {
      const result = diceService.rollDamage('1d8+3', 'piercing', true);
      expect(result.critical).toBe(true);
      expect(result.rolls).toHaveLength(2); // Main roll + critical extra
      // Total should be higher on average due to extra dice
      expect(result.total).toBeGreaterThanOrEqual(5); // Minimum: 1 + 1 + 3
    });

    it('should not double dice on non-critical', () => {
      const result = diceService.rollDamage('1d8+3', 'slashing', false);
      expect(result.critical).toBe(false);
      expect(result.rolls).toHaveLength(1);
    });
  });

  describe('rollSavingThrow', () => {
    it('should determine success correctly', () => {
      const result = diceService.rollSavingThrow(4, 15);
      expect(result.dc).toBe(15);
      expect(result.success).toBe(result.total >= 15);
    });

    it('should support advantage', () => {
      const result = diceService.rollSavingThrow(2, 12, { advantage: true });
      expect(result.advantage).toBe(true);
    });
  });

  describe('rollSkillCheck', () => {
    it('should roll with modifier', () => {
      const result = diceService.rollSkillCheck(7);
      expect(result.modifier).toBe(7);
    });

    it('should determine success when DC provided', () => {
      const result = diceService.rollSkillCheck(5, 15);
      expect(result.dc).toBe(15);
      expect(result.success).toBe(result.total >= 15);
    });

    it('should not set success when no DC', () => {
      const result = diceService.rollSkillCheck(5);
      expect(result.success).toBeUndefined();
      expect(result.dc).toBeUndefined();
    });
  });

  describe('rollPercentile', () => {
    it('should roll 1d100', () => {
      for (let i = 0; i < 20; i++) {
        const result = diceService.rollPercentile();
        expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
        expect(result.rolls[0]).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('toRecord', () => {
    it('should convert DiceResult to DiceRollRecord', () => {
      const result = diceService.roll('1d20+5');
      const record = diceService.toRecord(result, 'user-123', 'Player One', 'Attack roll');

      expect(record.id).toBe(result.id);
      expect(record.expression).toBe(result.expression);
      expect(record.rolls).toEqual(result.rolls);
      expect(record.modifier).toBe(result.modifier);
      expect(record.total).toBe(result.total);
      expect(record.rollerId).toBe('user-123');
      expect(record.rollerName).toBe('Player One');
      expect(record.reason).toBe('Attack roll');
      expect(record.timestamp).toBe(result.timestamp);
    });
  });
});
