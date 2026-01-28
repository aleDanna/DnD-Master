/**
 * Combat Service
 * Manages combat encounters including initiative, turns, and combat state
 */

import type {
  CombatState,
  Combatant,
  CombatantType,
  InitiativeEntry,
  Condition,
  ActiveEffect,
  StartCombatInput,
} from '../../models/combat.js';
import { DiceService } from './dice-service.js';
import { EventRepository } from '../data/event-repo.js';
import { SessionRepository } from '../data/session-repo.js';

export interface CombatServiceConfig {
  diceService: DiceService;
  eventRepo: EventRepository;
  sessionRepo: SessionRepository;
}

export class CombatService {
  private diceService: DiceService;
  private eventRepo: EventRepository;
  private sessionRepo: SessionRepository;

  constructor(config: CombatServiceConfig) {
    this.diceService = config.diceService;
    this.eventRepo = config.eventRepo;
    this.sessionRepo = config.sessionRepo;
  }

  /**
   * Start a new combat encounter
   */
  async startCombat(
    sessionId: string,
    participants: StartCombatInput['participants']
  ): Promise<CombatState> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.combat_state?.active) {
      throw new Error('Combat already in progress');
    }

    // Roll initiative for all participants
    const initiativeRolls: InitiativeEntry[] = [];
    const combatants: Combatant[] = [];

    for (const participant of participants) {
      // Roll initiative (1d20 + modifier)
      const modifier = participant.initiative_modifier || 0;
      const rollResult = this.diceService.roll('1d20', modifier);
      const initiative = rollResult.total;

      initiativeRolls.push({
        id: participant.id,
        type: participant.type,
        name: participant.name,
        initiative,
      });

      combatants.push({
        id: participant.id,
        type: participant.type,
        name: participant.name,
        initiative,
        current_hp: participant.current_hp,
        max_hp: participant.max_hp,
        armor_class: participant.armor_class,
        conditions: [],
        effects: [],
        is_active: true,
      });
    }

    // Sort by initiative (highest first), with random tiebreaker
    initiativeRolls.sort((a, b) => {
      if (b.initiative !== a.initiative) {
        return b.initiative - a.initiative;
      }
      // Random tiebreaker
      return Math.random() - 0.5;
    });

    // Sort combatants to match initiative order
    combatants.sort((a, b) => {
      const aIndex = initiativeRolls.findIndex((i) => i.id === a.id);
      const bIndex = initiativeRolls.findIndex((i) => i.id === b.id);
      return aIndex - bIndex;
    });

    const combatState: CombatState = {
      active: true,
      round: 1,
      turn_index: 0,
      initiative_order: initiativeRolls,
      combatants,
    };

    // Log combat start event
    await this.eventRepo.create({
      session_id: sessionId,
      type: 'combat_start',
      content: {
        participants: initiativeRolls.map((entry) => ({
          id: entry.id,
          name: entry.name,
          type: entry.type,
          initiative: entry.initiative,
        })),
      },
    });

    // Log first turn start
    const firstCombatant = combatState.initiative_order[0];
    await this.eventRepo.create({
      session_id: sessionId,
      type: 'turn_start',
      content: {
        combatant_id: firstCombatant.id,
        combatant_name: firstCombatant.name,
        round: 1,
      },
    });

    // Update session with combat state
    await this.sessionRepo.update(
      sessionId,
      { combat_state: combatState },
      session.version
    );

    return combatState;
  }

  /**
   * Add a combatant to an existing combat
   */
  async addCombatant(
    sessionId: string,
    participant: StartCombatInput['participants'][0]
  ): Promise<CombatState> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session || !session.combat_state?.active) {
      throw new Error('No active combat');
    }

    const combatState = { ...session.combat_state };

    // Roll initiative
    const modifier = participant.initiative_modifier || 0;
    const rollResult = this.diceService.roll('1d20', modifier);
    const initiative = rollResult.total;

    const newEntry: InitiativeEntry = {
      id: participant.id,
      type: participant.type,
      name: participant.name,
      initiative,
    };

    const newCombatant: Combatant = {
      id: participant.id,
      type: participant.type,
      name: participant.name,
      initiative,
      current_hp: participant.current_hp,
      max_hp: participant.max_hp,
      armor_class: participant.armor_class,
      conditions: [],
      effects: [],
      is_active: true,
    };

    // Insert in initiative order
    let insertIndex = combatState.initiative_order.findIndex(
      (e) => e.initiative < initiative
    );
    if (insertIndex === -1) {
      insertIndex = combatState.initiative_order.length;
    }

    combatState.initiative_order.splice(insertIndex, 0, newEntry);
    combatState.combatants.push(newCombatant);

    // Adjust turn_index if needed
    if (insertIndex <= combatState.turn_index) {
      combatState.turn_index += 1;
    }

    await this.sessionRepo.update(
      sessionId,
      { combat_state: combatState },
      session.version
    );

    return combatState;
  }

  /**
   * Advance to the next turn in combat
   */
  async nextTurn(sessionId: string): Promise<CombatState> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session || !session.combat_state?.active) {
      throw new Error('No active combat');
    }

    const combatState = { ...session.combat_state };
    const currentCombatant = combatState.combatants.find(
      (c) => c.id === combatState.initiative_order[combatState.turn_index].id
    );

    // Log turn end for current combatant
    if (currentCombatant) {
      await this.eventRepo.create({
        session_id: sessionId,
        type: 'turn_end',
        content: {
          combatant_id: currentCombatant.id,
          combatant_name: currentCombatant.name,
          round: combatState.round,
        },
      });
    }

    // Process end-of-turn effects
    this.processEndOfTurnEffects(combatState);

    // Find next active combatant
    let nextIndex = combatState.turn_index;
    let attempts = 0;
    let newRound = false;

    do {
      nextIndex = (nextIndex + 1) % combatState.initiative_order.length;
      if (nextIndex === 0) {
        combatState.round += 1;
        newRound = true;
        this.processStartOfRoundEffects(combatState);
      }
      attempts += 1;

      const combatant = combatState.combatants.find(
        (c) => c.id === combatState.initiative_order[nextIndex].id
      );
      if (combatant?.is_active) break;
    } while (attempts < combatState.initiative_order.length);

    combatState.turn_index = nextIndex;

    const nextCombatant = combatState.combatants.find(
      (c) => c.id === combatState.initiative_order[nextIndex].id
    );

    // Log turn start for next combatant
    if (nextCombatant) {
      await this.eventRepo.create({
        session_id: sessionId,
        type: 'turn_start',
        content: {
          combatant_id: nextCombatant.id,
          combatant_name: nextCombatant.name,
          round: combatState.round,
          new_round: newRound,
        },
      });
    }

    await this.sessionRepo.update(
      sessionId,
      { combat_state: combatState },
      session.version
    );

    return combatState;
  }

  /**
   * Apply damage to a combatant
   */
  async applyDamage(
    sessionId: string,
    targetId: string,
    damage: number,
    damageType?: string
  ): Promise<Combatant> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session || !session.combat_state?.active) {
      throw new Error('No active combat');
    }

    const combatState = { ...session.combat_state };
    const combatant = combatState.combatants.find((c) => c.id === targetId);

    if (!combatant) {
      throw new Error('Combatant not found');
    }

    const previousHp = combatant.current_hp;
    combatant.current_hp = Math.max(0, combatant.current_hp - damage);

    // Check if combatant is down
    if (combatant.current_hp === 0) {
      combatant.is_active = false;
      // Add unconscious condition for players
      if (combatant.type === 'player') {
        combatant.conditions.push({ name: 'unconscious' });
      }
    }

    await this.sessionRepo.update(
      sessionId,
      { combat_state: combatState },
      session.version
    );

    return combatant;
  }

  /**
   * Heal a combatant
   */
  async applyHealing(
    sessionId: string,
    targetId: string,
    healing: number
  ): Promise<Combatant> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session || !session.combat_state?.active) {
      throw new Error('No active combat');
    }

    const combatState = { ...session.combat_state };
    const combatant = combatState.combatants.find((c) => c.id === targetId);

    if (!combatant) {
      throw new Error('Combatant not found');
    }

    const wasDown = combatant.current_hp === 0;
    combatant.current_hp = Math.min(combatant.max_hp, combatant.current_hp + healing);

    // Reactivate if healed from 0
    if (wasDown && combatant.current_hp > 0) {
      combatant.is_active = true;
      combatant.conditions = combatant.conditions.filter(
        (c) => c.name !== 'unconscious'
      );
    }

    await this.sessionRepo.update(
      sessionId,
      { combat_state: combatState },
      session.version
    );

    return combatant;
  }

  /**
   * Add a condition to a combatant
   */
  async addCondition(
    sessionId: string,
    targetId: string,
    condition: Condition
  ): Promise<Combatant> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session || !session.combat_state?.active) {
      throw new Error('No active combat');
    }

    const combatState = { ...session.combat_state };
    const combatant = combatState.combatants.find((c) => c.id === targetId);

    if (!combatant) {
      throw new Error('Combatant not found');
    }

    // Don't add duplicate conditions
    if (!combatant.conditions.some((c) => c.name === condition.name)) {
      combatant.conditions.push(condition);
    }

    await this.sessionRepo.update(
      sessionId,
      { combat_state: combatState },
      session.version
    );

    return combatant;
  }

  /**
   * Remove a condition from a combatant
   */
  async removeCondition(
    sessionId: string,
    targetId: string,
    conditionName: string
  ): Promise<Combatant> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session || !session.combat_state?.active) {
      throw new Error('No active combat');
    }

    const combatState = { ...session.combat_state };
    const combatant = combatState.combatants.find((c) => c.id === targetId);

    if (!combatant) {
      throw new Error('Combatant not found');
    }

    combatant.conditions = combatant.conditions.filter(
      (c) => c.name !== conditionName
    );

    await this.sessionRepo.update(
      sessionId,
      { combat_state: combatState },
      session.version
    );

    return combatant;
  }

  /**
   * Add an active effect to a combatant
   */
  async addEffect(
    sessionId: string,
    targetId: string,
    effect: ActiveEffect
  ): Promise<Combatant> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session || !session.combat_state?.active) {
      throw new Error('No active combat');
    }

    const combatState = { ...session.combat_state };
    const combatant = combatState.combatants.find((c) => c.id === targetId);

    if (!combatant) {
      throw new Error('Combatant not found');
    }

    combatant.effects.push(effect);

    await this.sessionRepo.update(
      sessionId,
      { combat_state: combatState },
      session.version
    );

    return combatant;
  }

  /**
   * Get the current combatant
   */
  getCurrentCombatant(combatState: CombatState): Combatant | undefined {
    const currentEntry = combatState.initiative_order[combatState.turn_index];
    if (!currentEntry) return undefined;
    return combatState.combatants.find((c) => c.id === currentEntry.id);
  }

  /**
   * Check if it's a player's turn
   */
  isPlayerTurn(combatState: CombatState): boolean {
    const current = this.getCurrentCombatant(combatState);
    return current?.type === 'player';
  }

  /**
   * Check if combat should end
   */
  shouldCombatEnd(combatState: CombatState): {
    end: boolean;
    outcome?: 'victory' | 'defeat' | 'ongoing';
  } {
    const activePlayers = combatState.combatants.filter(
      (c) => c.type === 'player' && c.is_active
    );
    const activeEnemies = combatState.combatants.filter(
      (c) => c.type === 'monster' && c.is_active
    );

    if (activeEnemies.length === 0 && activePlayers.length > 0) {
      return { end: true, outcome: 'victory' };
    }
    if (activePlayers.length === 0) {
      return { end: true, outcome: 'defeat' };
    }
    return { end: false, outcome: 'ongoing' };
  }

  /**
   * End combat
   */
  async endCombat(
    sessionId: string,
    outcome: 'victory' | 'defeat' | 'retreat' | 'truce',
    summary?: string
  ): Promise<void> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Log combat end event
    await this.eventRepo.create({
      session_id: sessionId,
      type: 'combat_end',
      content: {
        outcome,
        summary,
        final_round: session.combat_state?.round,
      },
    });

    // Clear combat state
    await this.sessionRepo.update(
      sessionId,
      { combat_state: null },
      session.version
    );
  }

  /**
   * Get combat state for a session
   */
  async getCombatState(sessionId: string): Promise<CombatState | null> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    return session.combat_state;
  }

  /**
   * Process end-of-turn effects (duration countdown)
   */
  private processEndOfTurnEffects(combatState: CombatState): void {
    const currentEntry = combatState.initiative_order[combatState.turn_index];
    const combatant = combatState.combatants.find(
      (c) => c.id === currentEntry.id
    );

    if (!combatant) return;

    // Reduce effect durations
    combatant.effects = combatant.effects
      .map((effect) => ({
        ...effect,
        duration: effect.duration - 1,
      }))
      .filter((effect) => effect.duration > 0);

    // Reduce condition durations
    combatant.conditions = combatant.conditions
      .map((condition) => ({
        ...condition,
        duration:
          condition.duration !== undefined
            ? condition.duration - 1
            : undefined,
      }))
      .filter(
        (condition) =>
          condition.duration === undefined || condition.duration > 0
      );
  }

  /**
   * Process start-of-round effects
   */
  private processStartOfRoundEffects(combatState: CombatState): void {
    // This could be expanded to handle lair actions, legendary actions, etc.
  }
}

/**
 * Factory function to create a combat service
 */
export function createCombatService(config: CombatServiceConfig): CombatService {
  return new CombatService(config);
}
