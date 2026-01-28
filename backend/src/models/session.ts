/**
 * Session type definitions
 * Represents a play session within a campaign
 */

import type { CombatState } from './combat.js';

export type SessionStatus = 'active' | 'paused' | 'ended';

export interface MapToken {
  id: string;
  type: 'player' | 'npc' | 'monster' | 'object';
  x: number;
  y: number;
  label: string;
  color?: string;
}

export interface TerrainTile {
  x: number;
  y: number;
  type: 'wall' | 'difficult' | 'water' | 'pit';
}

export interface MapState {
  grid_width: number;
  grid_height: number;
  tokens: MapToken[];
  terrain: TerrainTile[];
}

export interface NPC {
  id: string;
  name: string;
  description?: string;
  disposition?: 'friendly' | 'neutral' | 'hostile';
}

export interface Session {
  id: string;
  campaign_id: string;
  name: string | null;
  status: SessionStatus;
  version: number;

  // Narrative state
  narrative_summary: string | null;
  current_location: string | null;
  active_npcs: NPC[];

  // Combat state (null if not in combat)
  combat_state: CombatState | null;

  // Map state (null if narrative_only mode)
  map_state: MapState | null;

  // Timestamps
  started_at: string;
  ended_at: string | null;
  last_activity: string;
}

export interface CreateSessionInput {
  campaign_id: string;
  name?: string;
}

export interface UpdateSessionInput {
  name?: string;
  status?: SessionStatus;
  narrative_summary?: string;
  current_location?: string;
  active_npcs?: NPC[];
  combat_state?: CombatState | null;
  map_state?: MapState | null;
}

export interface SessionWithCampaign extends Session {
  campaign: {
    id: string;
    name: string;
    dice_mode: string;
    map_mode: string;
  };
}
