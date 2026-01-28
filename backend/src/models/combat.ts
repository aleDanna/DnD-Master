/**
 * Combat type definitions
 * Represents combat state and combatants
 */

export type CombatantType = 'player' | 'monster' | 'npc';

export interface Condition {
  name: string;
  duration?: number; // Rounds remaining, undefined = indefinite
  source?: string;
}

export interface ActiveEffect {
  name: string;
  description: string;
  duration: number; // Rounds remaining
  source: string;
}

export interface Combatant {
  id: string;
  type: CombatantType;
  name: string;
  initiative: number;
  current_hp: number;
  max_hp: number;
  armor_class: number;
  conditions: Condition[];
  effects: ActiveEffect[];
  is_active: boolean; // false if unconscious/dead/fled
}

export interface InitiativeEntry {
  id: string;
  type: CombatantType;
  name: string;
  initiative: number;
}

export interface CombatState {
  active: boolean;
  round: number;
  turn_index: number;
  initiative_order: InitiativeEntry[];
  combatants: Combatant[];
}

export interface StartCombatInput {
  participants: Array<{
    id: string;
    name: string;
    type: CombatantType;
    current_hp: number;
    max_hp: number;
    armor_class: number;
    initiative_modifier?: number; // For auto-rolling initiative
  }>;
}

export interface CombatAction {
  type: 'attack' | 'cast_spell' | 'dash' | 'dodge' | 'help' | 'hide' | 'ready' | 'search' | 'use_object' | 'custom';
  target_id?: string;
  spell_name?: string;
  description?: string;
}

/**
 * Creates initial combat state from participants
 */
export function createCombatState(initiatives: InitiativeEntry[], combatants: Combatant[]): CombatState {
  // Sort by initiative (highest first)
  const sortedInitiative = [...initiatives].sort((a, b) => b.initiative - a.initiative);

  return {
    active: true,
    round: 1,
    turn_index: 0,
    initiative_order: sortedInitiative,
    combatants,
  };
}

/**
 * Get current combatant from combat state
 */
export function getCurrentCombatant(state: CombatState): Combatant | undefined {
  const current = state.initiative_order[state.turn_index];
  if (!current) return undefined;
  return state.combatants.find((c) => c.id === current.id);
}

/**
 * Advance to next turn in combat
 */
export function advanceTurn(state: CombatState): CombatState {
  let nextIndex = state.turn_index + 1;
  let nextRound = state.round;

  // Wrap around to next round if needed
  if (nextIndex >= state.initiative_order.length) {
    nextIndex = 0;
    nextRound += 1;
  }

  // Skip inactive combatants
  let attempts = 0;
  while (attempts < state.initiative_order.length) {
    const combatant = state.combatants.find(
      (c) => c.id === state.initiative_order[nextIndex].id
    );
    if (combatant?.is_active) break;

    nextIndex += 1;
    if (nextIndex >= state.initiative_order.length) {
      nextIndex = 0;
      nextRound += 1;
    }
    attempts += 1;
  }

  return {
    ...state,
    round: nextRound,
    turn_index: nextIndex,
  };
}

/**
 * Check if combat should end (all enemies or all players defeated)
 */
export function shouldCombatEnd(state: CombatState): { end: boolean; outcome?: 'victory' | 'defeat' } {
  const activePlayers = state.combatants.filter((c) => c.type === 'player' && c.is_active);
  const activeEnemies = state.combatants.filter((c) => c.type === 'monster' && c.is_active);

  if (activeEnemies.length === 0 && activePlayers.length > 0) {
    return { end: true, outcome: 'victory' };
  }
  if (activePlayers.length === 0) {
    return { end: true, outcome: 'defeat' };
  }
  return { end: false };
}
