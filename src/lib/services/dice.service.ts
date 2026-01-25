import { v4 as uuidv4 } from 'uuid';
import type { DamageType, AbilityScores } from '@/types/dnd.types';
import type { DiceRollRecord } from '@/types/session.types';

// ============================================
// Types
// ============================================

export interface DiceRollOptions {
  advantage?: boolean;
  disadvantage?: boolean;
  criticalRange?: number; // Default 20, can be 19-20 for some features
  rollerId?: string;
  rollerName?: string;
  reason?: string;
}

export interface DiceResult {
  id: string;
  expression: string;
  rolls: number[];
  modifier: number;
  total: number;
  advantage?: boolean;
  disadvantage?: boolean;
  discardedRoll?: number;
  natural?: number; // For d20 rolls
  timestamp: Date;
}

export interface AttackResult extends DiceResult {
  hit: boolean;
  critical: boolean;
  criticalMiss: boolean;
  targetAC?: number;
}

export interface DamageResult {
  id: string;
  total: number;
  type: DamageType;
  rolls: DiceResult[];
  critical: boolean;
}

export interface SavingThrowResult extends DiceResult {
  success: boolean;
  dc: number;
}

export interface SkillCheckResult extends DiceResult {
  success?: boolean;
  dc?: number;
}

export interface AbilityScoreRolls {
  rolls: Array<{
    dice: number[];
    dropped: number;
    total: number;
  }>;
  totals: number[];
}

// ============================================
// Dice Expression Parser
// ============================================

interface ParsedDiceExpression {
  diceGroups: Array<{
    count: number;
    sides: number;
    sign: 1 | -1;
  }>;
  modifier: number;
}

function parseDiceExpression(expression: string): ParsedDiceExpression {
  const cleanExpr = expression.replace(/\s/g, '').toLowerCase();

  // Match dice groups like 2d6, 1d20, d8 (implies 1d8)
  const diceRegex = /([+-]?)(\d*)d(\d+)/g;
  // Match standalone modifiers
  const modifierRegex = /([+-])(\d+)(?!d)/g;

  const diceGroups: ParsedDiceExpression['diceGroups'] = [];
  let modifier = 0;

  // Parse dice groups
  let match;
  while ((match = diceRegex.exec(cleanExpr)) !== null) {
    const sign = match[1] === '-' ? -1 : 1;
    const count = match[2] ? parseInt(match[2], 10) : 1;
    const sides = parseInt(match[3], 10);

    if (count > 0 && sides > 0 && count <= 100 && sides <= 1000) {
      diceGroups.push({ count, sides, sign });
    }
  }

  // Parse standalone modifiers (not part of dice notation)
  // We need to be careful not to match the numbers in dice notation
  const withoutDice = cleanExpr.replace(/\d*d\d+/g, '');
  while ((match = modifierRegex.exec(withoutDice)) !== null) {
    const sign = match[1] === '-' ? -1 : 1;
    const value = parseInt(match[2], 10);
    modifier += sign * value;
  }

  // Handle leading modifier (e.g., "5+2d6")
  const leadingModMatch = cleanExpr.match(/^(\d+)(?=[+-])/);
  if (leadingModMatch) {
    modifier += parseInt(leadingModMatch[1], 10);
  }

  return { diceGroups, modifier };
}

// ============================================
// Dice Service
// ============================================

export class DiceService {
  private random(): number {
    return Math.random();
  }

  /**
   * Roll a single die with the specified number of sides
   */
  rollDie(sides: number): number {
    return Math.floor(this.random() * sides) + 1;
  }

  /**
   * Roll multiple dice
   */
  rollDice(count: number, sides: number): number[] {
    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(this.rollDie(sides));
    }
    return rolls;
  }

  /**
   * Parse and roll a dice expression (e.g., "2d6+3", "1d20-2", "3d8+1d6+5")
   */
  roll(expression: string, options: DiceRollOptions = {}): DiceResult {
    const parsed = parseDiceExpression(expression);
    const allRolls: number[] = [];
    let total = parsed.modifier;

    for (const group of parsed.diceGroups) {
      const rolls = this.rollDice(group.count, group.sides);
      allRolls.push(...rolls);
      const sum = rolls.reduce((a, b) => a + b, 0);
      total += group.sign * sum;
    }

    // Handle advantage/disadvantage for d20 rolls
    let discardedRoll: number | undefined;
    let natural: number | undefined;

    // Check if this is a single d20 roll
    const isSingleD20 =
      parsed.diceGroups.length === 1 &&
      parsed.diceGroups[0].count === 1 &&
      parsed.diceGroups[0].sides === 20;

    if (isSingleD20 && (options.advantage || options.disadvantage)) {
      const secondRoll = this.rollDie(20);
      const firstRoll = allRolls[0];

      if (options.advantage) {
        if (secondRoll > firstRoll) {
          discardedRoll = firstRoll;
          allRolls[0] = secondRoll;
          total = secondRoll + parsed.modifier;
        } else {
          discardedRoll = secondRoll;
        }
      } else if (options.disadvantage) {
        if (secondRoll < firstRoll) {
          discardedRoll = firstRoll;
          allRolls[0] = secondRoll;
          total = secondRoll + parsed.modifier;
        } else {
          discardedRoll = secondRoll;
        }
      }
      natural = allRolls[0];
    } else if (isSingleD20) {
      natural = allRolls[0];
    }

    return {
      id: uuidv4(),
      expression,
      rolls: allRolls,
      modifier: parsed.modifier,
      total,
      advantage: options.advantage,
      disadvantage: options.disadvantage,
      discardedRoll,
      natural,
      timestamp: new Date(),
    };
  }

  /**
   * Roll with advantage (roll 2d20, take higher)
   */
  rollWithAdvantage(expression: string): DiceResult {
    return this.roll(expression, { advantage: true });
  }

  /**
   * Roll with disadvantage (roll 2d20, take lower)
   */
  rollWithDisadvantage(expression: string): DiceResult {
    return this.roll(expression, { disadvantage: true });
  }

  /**
   * Roll ability scores using 4d6 drop lowest method
   */
  rollAbilityScores(): AbilityScoreRolls {
    const results: AbilityScoreRolls = {
      rolls: [],
      totals: [],
    };

    for (let i = 0; i < 6; i++) {
      const dice = this.rollDice(4, 6);
      const sorted = [...dice].sort((a, b) => a - b);
      const dropped = sorted[0];
      const kept = sorted.slice(1);
      const total = kept.reduce((a, b) => a + b, 0);

      results.rolls.push({
        dice,
        dropped,
        total,
      });
      results.totals.push(total);
    }

    return results;
  }

  /**
   * Roll initiative (1d20 + modifier)
   */
  rollInitiative(modifier: number, options: DiceRollOptions = {}): DiceResult {
    const expression = modifier >= 0 ? `1d20+${modifier}` : `1d20${modifier}`;
    return this.roll(expression, { ...options, reason: 'Initiative' });
  }

  /**
   * Roll an attack
   */
  rollAttack(
    attackBonus: number,
    targetAC: number,
    options: DiceRollOptions = {}
  ): AttackResult {
    const criticalRange = options.criticalRange || 20;
    const expression =
      attackBonus >= 0 ? `1d20+${attackBonus}` : `1d20${attackBonus}`;

    const result = this.roll(expression, options);

    const natural = result.natural || 0;
    const critical = natural >= criticalRange;
    const criticalMiss = natural === 1;

    // Critical hit always hits, critical miss always misses
    let hit: boolean;
    if (critical) {
      hit = true;
    } else if (criticalMiss) {
      hit = false;
    } else {
      hit = result.total >= targetAC;
    }

    return {
      ...result,
      hit,
      critical,
      criticalMiss,
      targetAC,
    };
  }

  /**
   * Roll damage
   */
  rollDamage(
    expression: string,
    damageType: DamageType,
    critical: boolean = false
  ): DamageResult {
    const results: DiceResult[] = [];

    // For critical hits, roll damage dice twice
    const mainRoll = this.roll(expression);
    results.push(mainRoll);

    let total = mainRoll.total;

    if (critical) {
      // Roll extra dice for critical (only the dice, not the modifier)
      const parsed = parseDiceExpression(expression);
      let criticalExtra = 0;

      for (const group of parsed.diceGroups) {
        const rolls = this.rollDice(group.count, group.sides);
        criticalExtra += group.sign * rolls.reduce((a, b) => a + b, 0);
      }

      const critRoll: DiceResult = {
        id: uuidv4(),
        expression: `Critical extra`,
        rolls: [],
        modifier: 0,
        total: criticalExtra,
        timestamp: new Date(),
      };
      results.push(critRoll);
      total += criticalExtra;
    }

    return {
      id: uuidv4(),
      total,
      type: damageType,
      rolls: results,
      critical,
    };
  }

  /**
   * Roll a saving throw
   */
  rollSavingThrow(
    modifier: number,
    dc: number,
    options: DiceRollOptions = {}
  ): SavingThrowResult {
    const expression = modifier >= 0 ? `1d20+${modifier}` : `1d20${modifier}`;
    const result = this.roll(expression, options);

    // Natural 20 always succeeds (optional rule, commonly used)
    // Natural 1 doesn't auto-fail for saving throws in RAW, but we'll keep it simple
    const success = result.total >= dc;

    return {
      ...result,
      success,
      dc,
    };
  }

  /**
   * Roll an ability check or skill check
   */
  rollSkillCheck(
    modifier: number,
    dc?: number,
    options: DiceRollOptions = {}
  ): SkillCheckResult {
    const expression = modifier >= 0 ? `1d20+${modifier}` : `1d20${modifier}`;
    const result = this.roll(expression, options);

    let success: boolean | undefined;
    if (dc !== undefined) {
      success = result.total >= dc;
    }

    return {
      ...result,
      success,
      dc,
    };
  }

  /**
   * Roll percentile dice (d100)
   */
  rollPercentile(): DiceResult {
    return this.roll('1d100');
  }

  /**
   * Convert a DiceResult to a DiceRollRecord for persistence
   */
  toRecord(
    result: DiceResult,
    rollerId: string,
    rollerName: string,
    reason?: string
  ): DiceRollRecord {
    return {
      id: result.id,
      expression: result.expression,
      rolls: result.rolls,
      modifier: result.modifier,
      total: result.total,
      advantage: result.advantage,
      disadvantage: result.disadvantage,
      discardedRoll: result.discardedRoll,
      natural: result.natural,
      rollerId,
      rollerName,
      reason,
      timestamp: result.timestamp,
    };
  }
}

// Singleton instance
export const diceService = new DiceService();
