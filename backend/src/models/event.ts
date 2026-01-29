/**
 * Event type definitions
 * Represents a timestamped entry in the session log
 */

export type EventType =
  | 'session_start'
  | 'session_end'
  | 'session_save'
  | 'session_resume'
  | 'player_action'
  | 'ai_response'
  | 'dice_roll'
  | 'state_change'
  | 'combat_start'
  | 'combat_end'
  | 'turn_start'
  | 'turn_end';

export interface RuleCitation {
  rule_id: string;
  title: string;
  source: string; // "Basic Rules, Ch. 9" or "PHB p.194"
  excerpt?: string;
}

// Event content types by event type
export interface PlayerActionContent {
  text: string;
  character_id?: string;
}

export interface AIResponseContent {
  narrative: string;
  mechanics?: string;
  state_changes?: StateChangeContent[];
}

export interface DiceRollContent {
  dice: string; // "1d20+5", "2d6", etc.
  reason: string; // "Attack roll", "Saving throw", etc.
  individual_rolls: number[];
  modifier: number;
  total: number;
  mode: 'rng' | 'player_entered';
  roller_name: string;
}

export interface StateChangeContent {
  type: 'damage' | 'heal' | 'condition_add' | 'condition_remove' | 'move' | 'inventory' | 'custom';
  target?: string; // character/monster ID
  value?: number | string;
  description: string;
}

export interface CombatStartContent {
  participants: Array<{
    id: string;
    name: string;
    type: 'player' | 'monster' | 'npc';
    initiative: number;
  }>;
}

export interface CombatEndContent {
  outcome: 'victory' | 'defeat' | 'retreat' | 'truce';
  summary?: string;
}

export interface TurnContent {
  combatant_id: string;
  combatant_name: string;
  round: number;
}

// Union type for all content types
export type EventContent =
  | PlayerActionContent
  | AIResponseContent
  | DiceRollContent
  | StateChangeContent
  | CombatStartContent
  | CombatEndContent
  | TurnContent
  | Record<string, unknown>; // For session_start/end and custom events

export interface GameEvent {
  id: string;
  session_id: string;
  type: EventType;
  actor_id: string | null;
  actor_name: string | null;
  content: EventContent;
  rule_citations: RuleCitation[];
  sequence: number;
  created_at: string;
}

export interface CreateEventInput {
  session_id: string;
  type: EventType;
  actor_id?: string;
  actor_name?: string;
  content: EventContent;
  rule_citations?: RuleCitation[];
}
