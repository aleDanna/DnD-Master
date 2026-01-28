/**
 * Dice Service
 * Handles all dice rolling operations with logging and validation
 */

import { EventRepository } from '../data/event-repo.js';

export interface DiceRollResult {
  dice: string;
  individualRolls: number[];
  modifier: number;
  total: number;
  criticalHit?: boolean;
  criticalFail?: boolean;
}

export interface ParsedDice {
  count: number;
  sides: number;
  modifier: number;
}

export class DiceService {
  constructor(private eventRepo?: EventRepository) {}

  /**
   * Parse dice notation string (e.g., "2d6+5", "1d20-2", "3d8")
   */
  parseDiceNotation(notation: string): ParsedDice {
    const pattern = /^(\d+)d(\d+)([+-]\d+)?$/i;
    const match = notation.trim().match(pattern);

    if (!match) {
      throw new Error(`Invalid dice notation: ${notation}. Expected format: NdN+N (e.g., 1d20+5)`);
    }

    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    // Validate reasonable bounds
    if (count < 1 || count > 100) {
      throw new Error('Dice count must be between 1 and 100');
    }
    if (sides < 2 || sides > 100) {
      throw new Error('Dice sides must be between 2 and 100');
    }
    if (Math.abs(modifier) > 100) {
      throw new Error('Modifier must be between -100 and 100');
    }

    return { count, sides, modifier };
  }

  /**
   * Roll dice using RNG
   */
  roll(notation: string): DiceRollResult {
    const parsed = this.parseDiceNotation(notation);
    const individualRolls: number[] = [];

    for (let i = 0; i < parsed.count; i++) {
      individualRolls.push(this.rollSingleDie(parsed.sides));
    }

    const subtotal = individualRolls.reduce((sum, roll) => sum + roll, 0);
    const total = subtotal + parsed.modifier;

    const result: DiceRollResult = {
      dice: notation,
      individualRolls,
      modifier: parsed.modifier,
      total,
    };

    // Check for critical on d20 rolls
    if (parsed.count === 1 && parsed.sides === 20) {
      result.criticalHit = individualRolls[0] === 20;
      result.criticalFail = individualRolls[0] === 1;
    }

    return result;
  }

  /**
   * Roll a single die (1 to sides)
   */
  private rollSingleDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
  }

  /**
   * Create a dice result from player-entered value
   */
  createPlayerEnteredResult(notation: string, value: number): DiceRollResult {
    const parsed = this.parseDiceNotation(notation);

    // Calculate what the base roll must have been
    const baseRoll = value - parsed.modifier;

    // Validate the value is within possible range
    const minPossible = parsed.count;
    const maxPossible = parsed.count * parsed.sides;

    if (baseRoll < minPossible || baseRoll > maxPossible) {
      throw new Error(
        `Entered value ${value} is not possible for ${notation}. ` +
        `Possible range: ${minPossible + parsed.modifier} to ${maxPossible + parsed.modifier}`
      );
    }

    // Estimate individual rolls (we can't know exactly for multi-dice)
    const individualRolls: number[] = [];
    if (parsed.count === 1) {
      individualRolls.push(baseRoll);
    } else {
      // Distribute the roll across dice (approximation)
      let remaining = baseRoll;
      for (let i = 0; i < parsed.count - 1; i++) {
        const avgRoll = Math.round(remaining / (parsed.count - i));
        const clampedRoll = Math.max(1, Math.min(parsed.sides, avgRoll));
        individualRolls.push(clampedRoll);
        remaining -= clampedRoll;
      }
      individualRolls.push(Math.max(1, Math.min(parsed.sides, remaining)));
    }

    const result: DiceRollResult = {
      dice: notation,
      individualRolls,
      modifier: parsed.modifier,
      total: value,
    };

    // Check for critical on d20 rolls
    if (parsed.count === 1 && parsed.sides === 20) {
      result.criticalHit = individualRolls[0] === 20;
      result.criticalFail = individualRolls[0] === 1;
    }

    return result;
  }

  /**
   * Roll and log the result to the event log
   */
  async rollAndLog(
    sessionId: string,
    actorId: string,
    actorName: string,
    notation: string,
    reason: string,
    mode: 'rng' | 'player_entered' = 'rng',
    playerValue?: number
  ): Promise<DiceRollResult> {
    if (!this.eventRepo) {
      throw new Error('Event repository not configured for logging');
    }

    const result = mode === 'player_entered' && playerValue !== undefined
      ? this.createPlayerEnteredResult(notation, playerValue)
      : this.roll(notation);

    await this.eventRepo.createDiceRoll(
      sessionId,
      actorId,
      actorName,
      result.dice,
      reason,
      result.individualRolls,
      result.modifier,
      result.total,
      mode
    );

    return result;
  }

  /**
   * Roll initiative for multiple combatants
   */
  rollInitiative(dexModifiers: Map<string, number>): Map<string, number> {
    const initiatives = new Map<string, number>();

    for (const [id, dexMod] of dexModifiers) {
      const roll = this.roll(`1d20+${dexMod >= 0 ? dexMod : dexMod}`);
      initiatives.set(id, roll.total);
    }

    return initiatives;
  }

  /**
   * Roll attack with advantage/disadvantage
   */
  rollAttack(
    attackBonus: number,
    advantage: 'normal' | 'advantage' | 'disadvantage' = 'normal'
  ): DiceRollResult {
    if (advantage === 'normal') {
      return this.roll(`1d20+${attackBonus}`);
    }

    const roll1 = this.rollSingleDie(20);
    const roll2 = this.rollSingleDie(20);

    const finalRoll = advantage === 'advantage'
      ? Math.max(roll1, roll2)
      : Math.min(roll1, roll2);

    const total = finalRoll + attackBonus;

    return {
      dice: `1d20+${attackBonus}`,
      individualRolls: [roll1, roll2],
      modifier: attackBonus,
      total,
      criticalHit: finalRoll === 20,
      criticalFail: finalRoll === 1,
    };
  }

  /**
   * Roll saving throw
   */
  rollSavingThrow(
    savingBonus: number,
    dc: number,
    advantage: 'normal' | 'advantage' | 'disadvantage' = 'normal'
  ): { result: DiceRollResult; success: boolean } {
    const result = this.rollAttack(savingBonus, advantage);
    return {
      result,
      success: result.total >= dc,
    };
  }

  /**
   * Roll damage
   */
  rollDamage(notation: string, critical = false): DiceRollResult {
    if (critical) {
      const parsed = this.parseDiceNotation(notation);
      const doubledNotation = `${parsed.count * 2}d${parsed.sides}${
        parsed.modifier >= 0 ? '+' : ''
      }${parsed.modifier}`;
      return this.roll(doubledNotation);
    }

    return this.roll(notation);
  }

  /**
   * Format roll result as string
   */
  formatRollResult(result: DiceRollResult, reason?: string): string {
    const rollsStr = result.individualRolls.join(', ');
    const modStr = result.modifier >= 0 ? `+${result.modifier}` : result.modifier.toString();

    let text = `${result.dice}: [${rollsStr}]${result.modifier !== 0 ? modStr : ''} = ${result.total}`;

    if (result.criticalHit) text += ' (CRITICAL HIT!)';
    if (result.criticalFail) text += ' (Critical Fail)';
    if (reason) text = `${reason}: ${text}`;

    return text;
  }
}

// Export singleton instance
export const diceService = new DiceService();

/**
 * Factory function to create a dice service with event logging
 */
export function createDiceService(eventRepo: EventRepository): DiceService {
  return new DiceService(eventRepo);
}
