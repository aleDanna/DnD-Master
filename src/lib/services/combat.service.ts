import { v4 as uuidv4 } from 'uuid';
import { diceService } from './dice.service';
import { rulesEngine } from './rules.engine';
import type { Character } from '@/types/character.types';
import type { Monster, DamageType, ConditionType, ActiveCondition } from '@/types/dnd.types';
import type {
  CombatState,
  CombatStatus,
  InitiativeEntry,
  CombatantState,
  CombatAction,
  AttackAction,
  CastAction,
  ActionResult,
  AttackResult,
  DamageResult,
  TurnRecord,
  GridPosition,
  Battlefield,
  EnvironmentalEffect,
} from '@/types/session.types';

// ============================================
// Types
// ============================================

export interface Combatant {
  id: string;
  name: string;
  type: 'player' | 'npc' | 'monster';
  entityId: string;
  initiativeModifier: number;
  maxHP: number;
  currentHP: number;
  armorClass: number;
  isVisible?: boolean;
  position?: GridPosition;
}

export interface CombatConfig {
  useGrid?: boolean;
  gridSize?: { width: number; height: number };
  autoRollInitiative?: boolean;
}

// ============================================
// Combat Service
// ============================================

export class CombatService {
  /**
   * Initialize a new combat encounter
   */
  initiateCombat(
    sessionId: string,
    combatants: Combatant[],
    config: CombatConfig = {}
  ): CombatState {
    const combatId = uuidv4();

    // Create combatant states
    const combatantStates: Record<string, CombatantState> = {};
    for (const combatant of combatants) {
      combatantStates[combatant.id] = {
        id: combatant.id,
        entityId: combatant.entityId,
        name: combatant.name,
        type: combatant.type,
        currentHP: combatant.currentHP,
        maxHP: combatant.maxHP,
        tempHP: 0,
        conditions: [],
        reactionsUsed: 0,
        position: combatant.position,
      };
    }

    // Create initial initiative order (will be sorted after rolling)
    const initiativeOrder: InitiativeEntry[] = combatants.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      entityId: c.entityId,
      initiative: 0,
      dexterityModifier: c.initiativeModifier,
      isVisible: c.isVisible ?? true,
    }));

    const combatState: CombatState = {
      id: combatId,
      sessionId,
      status: 'initiative',
      round: 0,
      currentTurnIndex: 0,
      initiativeOrder,
      combatants: combatantStates,
      environmentalEffects: [],
      turnHistory: [],
    };

    // Set up battlefield if using grid
    if (config.useGrid && config.gridSize) {
      combatState.battlefield = this.createBattlefield(config.gridSize);
    }

    // Auto-roll initiative if configured
    if (config.autoRollInitiative) {
      return this.rollAllInitiative(combatState);
    }

    return combatState;
  }

  /**
   * Roll initiative for all combatants
   */
  rollAllInitiative(combat: CombatState): CombatState {
    const updatedOrder = combat.initiativeOrder.map((entry) => {
      const roll = diceService.rollInitiative(entry.dexterityModifier);
      return {
        ...entry,
        initiative: roll.total,
      };
    });

    // Sort by initiative (highest first), using dex modifier as tiebreaker
    updatedOrder.sort((a, b) => {
      if (b.initiative !== a.initiative) {
        return b.initiative - a.initiative;
      }
      return b.dexterityModifier - a.dexterityModifier;
    });

    return {
      ...combat,
      initiativeOrder: updatedOrder,
      status: 'active',
      round: 1,
      currentTurnIndex: 0,
    };
  }

  /**
   * Roll initiative for a single combatant
   */
  rollInitiative(
    combat: CombatState,
    combatantId: string
  ): { combat: CombatState; roll: number } {
    const entry = combat.initiativeOrder.find((e) => e.id === combatantId);
    if (!entry) {
      throw new Error('Combatant not found');
    }

    const roll = diceService.rollInitiative(entry.dexterityModifier);
    const updatedOrder = combat.initiativeOrder.map((e) =>
      e.id === combatantId ? { ...e, initiative: roll.total } : e
    );

    // Re-sort
    updatedOrder.sort((a, b) => {
      if (b.initiative !== a.initiative) {
        return b.initiative - a.initiative;
      }
      return b.dexterityModifier - a.dexterityModifier;
    });

    return {
      combat: { ...combat, initiativeOrder: updatedOrder },
      roll: roll.total,
    };
  }

  /**
   * Get current combatant
   */
  getCurrentCombatant(combat: CombatState): CombatantState | null {
    if (combat.status !== 'active') return null;
    const entry = combat.initiativeOrder[combat.currentTurnIndex];
    if (!entry) return null;
    return combat.combatants[entry.id] || null;
  }

  /**
   * Advance to next turn
   */
  nextTurn(combat: CombatState): CombatState {
    if (combat.status !== 'active') {
      throw new Error('Combat is not active');
    }

    let nextIndex = combat.currentTurnIndex + 1;
    let nextRound = combat.round;

    // Check if we've completed a round
    if (nextIndex >= combat.initiativeOrder.length) {
      nextIndex = 0;
      nextRound++;
    }

    // Skip dead combatants
    let attempts = 0;
    while (attempts < combat.initiativeOrder.length) {
      const nextEntry = combat.initiativeOrder[nextIndex];
      const nextCombatant = combat.combatants[nextEntry.id];

      if (nextCombatant && nextCombatant.currentHP > 0) {
        break;
      }

      nextIndex++;
      if (nextIndex >= combat.initiativeOrder.length) {
        nextIndex = 0;
        nextRound++;
      }
      attempts++;
    }

    // Reset reactions for the new combatant
    const currentEntry = combat.initiativeOrder[nextIndex];
    const updatedCombatants = { ...combat.combatants };
    if (currentEntry) {
      updatedCombatants[currentEntry.id] = {
        ...updatedCombatants[currentEntry.id],
        reactionsUsed: 0,
      };
    }

    // Process start-of-turn effects
    const processedCombatants = this.processStartOfTurn(
      updatedCombatants,
      currentEntry?.id
    );

    return {
      ...combat,
      currentTurnIndex: nextIndex,
      round: nextRound,
      combatants: processedCombatants,
    };
  }

  /**
   * Execute an attack action
   */
  executeAttack(
    combat: CombatState,
    action: AttackAction,
    attackerStats: { attackBonus: number; damage: string; damageType: DamageType }
  ): { combat: CombatState; result: AttackResult } {
    const attacker = combat.combatants[action.actorId];
    const target = combat.combatants[action.targetId];

    if (!attacker || !target) {
      throw new Error('Attacker or target not found');
    }

    // Determine advantage/disadvantage
    const hasAdvantage = action.advantage || this.hasAdvantage(combat, attacker, target);
    const hasDisadvantage =
      action.disadvantage || this.hasDisadvantage(combat, attacker, target);

    // Roll attack
    const attackRoll = diceService.rollAttack(
      attackerStats.attackBonus,
      this.getTargetAC(target),
      {
        advantage: hasAdvantage && !hasDisadvantage,
        disadvantage: hasDisadvantage && !hasAdvantage,
      }
    );

    let damage: DamageResult | undefined;
    let updatedCombatants = { ...combat.combatants };

    if (attackRoll.hit) {
      // Roll damage
      damage = diceService.rollDamage(
        attackerStats.damage,
        attackerStats.damageType,
        attackRoll.critical
      );

      // Apply damage to target
      const newHP = Math.max(0, target.currentHP - damage.total);
      updatedCombatants[target.id] = {
        ...target,
        currentHP: newHP,
      };

      // Check concentration if target was concentrating
      if (target.concentratingOn && damage.total > 0) {
        const conSaveDC = rulesEngine.getConcentrationSaveDC(damage.total);
        // Would need to roll concentration save here
      }
    }

    const result: AttackResult = {
      type: 'attack',
      success: attackRoll.hit,
      attackRoll: diceService.toRecord(
        attackRoll,
        action.actorId,
        attacker.name,
        'Attack roll'
      ),
      hit: attackRoll.hit,
      critical: attackRoll.critical,
      criticalMiss: attackRoll.criticalMiss,
      damage,
      target: target.id,
      attacker: attacker.id,
      weapon: action.weaponId,
    };

    // Record turn action
    const turnRecord = this.recordAction(combat, action, result);

    return {
      combat: {
        ...combat,
        combatants: updatedCombatants,
        turnHistory: [...combat.turnHistory, turnRecord],
      },
      result,
    };
  }

  /**
   * Apply damage to a combatant
   */
  applyDamage(
    combat: CombatState,
    targetId: string,
    damage: number,
    damageType?: DamageType
  ): CombatState {
    const target = combat.combatants[targetId];
    if (!target) {
      throw new Error('Target not found');
    }

    let actualDamage = damage;

    // Handle temp HP first
    let newTempHP = target.tempHP;
    if (newTempHP > 0) {
      if (newTempHP >= actualDamage) {
        newTempHP -= actualDamage;
        actualDamage = 0;
      } else {
        actualDamage -= newTempHP;
        newTempHP = 0;
      }
    }

    const newHP = Math.max(0, target.currentHP - actualDamage);

    return {
      ...combat,
      combatants: {
        ...combat.combatants,
        [targetId]: {
          ...target,
          currentHP: newHP,
          tempHP: newTempHP,
        },
      },
    };
  }

  /**
   * Heal a combatant
   */
  healCombatant(
    combat: CombatState,
    targetId: string,
    healing: number
  ): CombatState {
    const target = combat.combatants[targetId];
    if (!target) {
      throw new Error('Target not found');
    }

    const newHP = Math.min(target.maxHP, target.currentHP + healing);

    return {
      ...combat,
      combatants: {
        ...combat.combatants,
        [targetId]: {
          ...target,
          currentHP: newHP,
        },
      },
    };
  }

  /**
   * Apply a condition to a combatant
   */
  applyCondition(
    combat: CombatState,
    targetId: string,
    condition: ActiveCondition
  ): CombatState {
    const target = combat.combatants[targetId];
    if (!target) {
      throw new Error('Target not found');
    }

    // Check if condition already exists
    const existingIndex = target.conditions.findIndex(
      (c) => c.type === condition.type
    );

    let updatedConditions = [...target.conditions];
    if (existingIndex >= 0) {
      updatedConditions[existingIndex] = condition;
    } else {
      updatedConditions.push(condition);
    }

    return {
      ...combat,
      combatants: {
        ...combat.combatants,
        [targetId]: {
          ...target,
          conditions: updatedConditions,
        },
      },
    };
  }

  /**
   * Remove a condition from a combatant
   */
  removeCondition(
    combat: CombatState,
    targetId: string,
    conditionType: ConditionType
  ): CombatState {
    const target = combat.combatants[targetId];
    if (!target) {
      throw new Error('Target not found');
    }

    return {
      ...combat,
      combatants: {
        ...combat.combatants,
        [targetId]: {
          ...target,
          conditions: target.conditions.filter((c) => c.type !== conditionType),
        },
      },
    };
  }

  /**
   * Move combatant on grid
   */
  moveCombatant(
    combat: CombatState,
    combatantId: string,
    newPosition: GridPosition
  ): CombatState {
    const combatant = combat.combatants[combatantId];
    if (!combatant) {
      throw new Error('Combatant not found');
    }

    return {
      ...combat,
      combatants: {
        ...combat.combatants,
        [combatantId]: {
          ...combatant,
          position: newPosition,
        },
      },
    };
  }

  /**
   * End combat
   */
  endCombat(combat: CombatState): CombatState {
    return {
      ...combat,
      status: 'ended',
    };
  }

  /**
   * Check if any enemies remain
   */
  checkCombatEnd(combat: CombatState): {
    ended: boolean;
    winners?: 'players' | 'enemies' | 'none';
  } {
    const players = Object.values(combat.combatants).filter(
      (c) => c.type === 'player' && c.currentHP > 0
    );
    const enemies = Object.values(combat.combatants).filter(
      (c) => (c.type === 'monster' || c.type === 'npc') && c.currentHP > 0
    );

    if (players.length === 0 && enemies.length === 0) {
      return { ended: true, winners: 'none' };
    }
    if (enemies.length === 0) {
      return { ended: true, winners: 'players' };
    }
    if (players.length === 0) {
      return { ended: true, winners: 'enemies' };
    }

    return { ended: false };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private createBattlefield(size: { width: number; height: number }): Battlefield {
    const terrain: Battlefield['terrain'] = [];
    for (let y = 0; y < size.height; y++) {
      const row = [];
      for (let x = 0; x < size.width; x++) {
        row.push({ type: 'normal' as const });
      }
      terrain.push(row);
    }

    return {
      width: size.width,
      height: size.height,
      terrain,
      objects: [],
    };
  }

  private hasAdvantage(
    combat: CombatState,
    attacker: CombatantState,
    target: CombatantState
  ): boolean {
    // Check attacker conditions
    if (attacker.conditions.some((c) => c.type === 'invisible')) {
      return true;
    }

    // Check target conditions
    const targetConditions = target.conditions.map((c) => c.type);
    if (
      targetConditions.includes('blinded') ||
      targetConditions.includes('paralyzed') ||
      targetConditions.includes('petrified') ||
      targetConditions.includes('restrained') ||
      targetConditions.includes('stunned') ||
      targetConditions.includes('unconscious')
    ) {
      return true;
    }

    // Prone target with melee attack
    if (targetConditions.includes('prone')) {
      // Would need to check if melee attack
      return true;
    }

    return false;
  }

  private hasDisadvantage(
    combat: CombatState,
    attacker: CombatantState,
    target: CombatantState
  ): boolean {
    const attackerConditions = attacker.conditions.map((c) => c.type);

    // Attacker conditions
    if (
      attackerConditions.includes('blinded') ||
      attackerConditions.includes('frightened') ||
      attackerConditions.includes('poisoned') ||
      attackerConditions.includes('restrained')
    ) {
      return true;
    }

    // Prone attacker
    if (attackerConditions.includes('prone')) {
      return true;
    }

    // Invisible target
    if (target.conditions.some((c) => c.type === 'invisible')) {
      return true;
    }

    return false;
  }

  private getTargetAC(target: CombatantState): number {
    // Would need to look up actual AC from character/monster
    // For now, returning a default
    return 15;
  }

  private processStartOfTurn(
    combatants: Record<string, CombatantState>,
    currentCombatantId?: string
  ): Record<string, CombatantState> {
    if (!currentCombatantId) return combatants;

    const combatant = combatants[currentCombatantId];
    if (!combatant) return combatants;

    // Process condition durations
    const updatedConditions = combatant.conditions
      .map((condition) => {
        if (condition.duration?.type === 'rounds' && condition.duration.remaining) {
          return {
            ...condition,
            duration: {
              ...condition.duration,
              remaining: condition.duration.remaining - 1,
            },
          };
        }
        return condition;
      })
      .filter((condition) => {
        // Remove expired conditions
        if (condition.duration?.type === 'rounds') {
          return (condition.duration.remaining ?? 0) > 0;
        }
        return true;
      });

    return {
      ...combatants,
      [currentCombatantId]: {
        ...combatant,
        conditions: updatedConditions,
      },
    };
  }

  private recordAction(
    combat: CombatState,
    action: CombatAction,
    result: ActionResult
  ): TurnRecord {
    const currentEntry = combat.initiativeOrder[combat.currentTurnIndex];

    return {
      round: combat.round,
      combatantId: currentEntry?.id || action.actorId,
      actions: [
        {
          type: action.type,
          description: action.description || action.type,
          targets: 'targetId' in action ? [action.targetId] : undefined,
          result: result.success ? 'success' : 'failure',
        },
      ],
      timestamp: new Date(),
    };
  }
}

// Singleton instance
export const combatService = new CombatService();
