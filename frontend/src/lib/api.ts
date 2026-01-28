/**
 * API client for backend communication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * Make an authenticated API request
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { token, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...init,
    headers,
  });

  const data = await response.json();

  return data;
}

/**
 * Campaign API
 */
export const campaignApi = {
  list: (token: string, page = 1, limit = 20) =>
    request<{
      campaigns: Array<{
        id: string;
        name: string;
        description?: string;
        owner_id: string;
        dice_mode: 'rng' | 'player_entered';
        map_mode: 'grid_2d' | 'narrative_only';
        created_at: string;
        updated_at: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/api/campaigns?page=${page}&limit=${limit}`, { token }),

  get: (token: string, id: string) =>
    request<{
      id: string;
      name: string;
      description?: string;
      owner_id: string;
      dice_mode: 'rng' | 'player_entered';
      map_mode: 'grid_2d' | 'narrative_only';
      created_at: string;
      updated_at: string;
      players: Array<{
        id: string;
        user_id: string;
        role: 'player' | 'dm';
        joined_at: string;
      }>;
      isOwner: boolean;
    }>(`/api/campaigns/${id}`, { token }),

  create: (
    token: string,
    data: {
      name: string;
      description?: string;
      dice_mode?: 'rng' | 'player_entered';
      map_mode?: 'grid_2d' | 'narrative_only';
    }
  ) =>
    request<{
      id: string;
      name: string;
      description?: string;
      dice_mode: 'rng' | 'player_entered';
      map_mode: 'grid_2d' | 'narrative_only';
      created_at: string;
    }>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (
    token: string,
    id: string,
    data: {
      name?: string;
      description?: string;
      dice_mode?: 'rng' | 'player_entered';
      map_mode?: 'grid_2d' | 'narrative_only';
    }
  ) =>
    request(`/api/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, id: string) =>
    request(`/api/campaigns/${id}`, {
      method: 'DELETE',
      token,
    }),
};

/**
 * Session API
 */
export const sessionApi = {
  get: (token: string, id: string) =>
    request<{
      id: string;
      campaign_id: string;
      name: string | null;
      status: 'active' | 'paused' | 'ended';
      version: number;
      narrative_summary: string | null;
      current_location: string | null;
      combat_state: unknown | null;
      map_state: unknown | null;
      started_at: string;
      ended_at: string | null;
      campaign: {
        id: string;
        name: string;
        dice_mode: string;
        map_mode: string;
      };
    }>(`/api/sessions/${id}`, { token }),

  create: (token: string, campaignId: string, name?: string) =>
    request<{
      id: string;
      campaign_id: string;
      name: string | null;
      status: 'active';
      started_at: string;
    }>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: campaignId, name }),
      token,
    }),

  listByCampaign: (token: string, campaignId: string) =>
    request<
      Array<{
        id: string;
        campaign_id: string;
        name: string | null;
        status: 'active' | 'paused' | 'ended';
        started_at: string;
        ended_at: string | null;
      }>
    >(`/api/sessions/campaign/${campaignId}`, { token }),

  getActive: (token: string, campaignId: string) =>
    request<{
      id: string;
      status: 'active';
    }>(`/api/sessions/campaign/${campaignId}/active`, { token }),

  pause: (token: string, id: string) =>
    request(`/api/sessions/${id}/pause`, { method: 'POST', token }),

  resume: (token: string, id: string) =>
    request(`/api/sessions/${id}/resume`, { method: 'POST', token }),

  end: (token: string, id: string) =>
    request(`/api/sessions/${id}/end`, { method: 'POST', token }),
};

/**
 * Game API
 */
export const gameApi = {
  submitAction: (token: string, sessionId: string, action: string, characterId?: string) =>
    request<{
      narrative: string;
      mechanics?: string;
      stateChanges?: Array<{
        type: string;
        target?: string;
        value?: unknown;
        description: string;
      }>;
      requiresRoll?: {
        dice: string;
        reason: string;
        dc?: number;
      };
      ruleCitations?: Array<{
        title: string;
        source: string;
        excerpt?: string;
      }>;
    }>(`/api/game/${sessionId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, character_id: characterId }),
      token,
    }),

  rollDice: (token: string, sessionId: string, dice: string, reason?: string, value?: number) =>
    request<{
      dice: string;
      individualRolls: number[];
      modifier: number;
      total: number;
      criticalHit?: boolean;
      criticalFail?: boolean;
    }>(`/api/game/${sessionId}/roll`, {
      method: 'POST',
      body: JSON.stringify({ dice, reason, value }),
      token,
    }),

  getEvents: (
    token: string,
    sessionId: string,
    options?: { limit?: number; after?: number; before?: number; types?: string }
  ) => {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.after) params.set('after', options.after.toString());
    if (options?.before) params.set('before', options.before.toString());
    if (options?.types) params.set('types', options.types);

    return request<{
      events: Array<{
        id: string;
        session_id: string;
        type: string;
        actor_id: string | null;
        actor_name: string | null;
        content: unknown;
        rule_citations: unknown[];
        sequence: number;
        created_at: string;
      }>;
      pagination: {
        latestSequence: number;
        hasMore: boolean;
      };
    }>(`/api/game/${sessionId}/events?${params.toString()}`, { token });
  },

  getDiceLog: (token: string, sessionId: string) =>
    request<
      Array<{
        id: string;
        actor_name: string;
        content: {
          dice: string;
          reason: string;
          individual_rolls: number[];
          modifier: number;
          total: number;
          mode: string;
        };
        created_at: string;
      }>
    >(`/api/game/${sessionId}/dice-log`, { token }),
};

/**
 * Combat types
 */
interface Condition {
  name: string;
  duration?: number;
}

interface Combatant {
  id: string;
  type: 'player' | 'npc' | 'monster';
  name: string;
  initiative: number;
  current_hp: number;
  max_hp: number;
  armor_class: number;
  conditions: Condition[];
  is_active: boolean;
}

interface InitiativeEntry {
  id: string;
  type: 'player' | 'npc' | 'monster';
  name: string;
  initiative: number;
}

interface CombatState {
  active: boolean;
  round: number;
  turn_index: number;
  initiative_order: InitiativeEntry[];
  combatants: Combatant[];
}

export type { CombatState, Combatant, InitiativeEntry, Condition };

/**
 * Combat API
 */
export const combatApi = {
  getCombatState: (token: string, sessionId: string) =>
    request<{
      combat_state: CombatState | null;
      is_active: boolean;
    }>(`/api/game/${sessionId}/combat`, { token }),

  startCombat: (
    token: string,
    sessionId: string,
    participants: Array<{
      id: string;
      type: 'player' | 'npc' | 'monster';
      name: string;
      current_hp: number;
      max_hp: number;
      armor_class: number;
      initiative_modifier?: number;
    }>
  ) =>
    request<{
      combat_state: CombatState;
      narrative: string;
    }>(`/api/game/${sessionId}/combat/start`, {
      method: 'POST',
      body: JSON.stringify({ participants }),
      token,
    }),

  nextTurn: (token: string, sessionId: string) =>
    request<{
      combat_state: CombatState;
      narrative?: string;
      current_combatant: Combatant;
      should_end: boolean;
      outcome?: 'victory' | 'defeat' | 'ongoing';
    }>(`/api/game/${sessionId}/combat/next-turn`, {
      method: 'POST',
      token,
    }),

  endCombat: (
    token: string,
    sessionId: string,
    outcome: 'victory' | 'defeat' | 'retreat' | 'truce',
    summary?: string
  ) =>
    request<{
      outcome: string;
      narrative: string;
    }>(`/api/game/${sessionId}/combat/end`, {
      method: 'POST',
      body: JSON.stringify({ outcome, summary }),
      token,
    }),

  submitCombatAction: (
    token: string,
    sessionId: string,
    action: string,
    characterId?: string
  ) =>
    request<{
      narrative: string;
      mechanics?: string;
      stateChanges?: Array<{
        type: string;
        target?: string;
        value?: unknown;
        description: string;
      }>;
      requiresRoll?: {
        dice: string;
        reason: string;
        dc?: number;
      };
      ruleCitations?: Array<{
        title: string;
        source: string;
        excerpt?: string;
      }>;
      combat_state: CombatState | null;
    }>(`/api/game/${sessionId}/combat/action`, {
      method: 'POST',
      body: JSON.stringify({ action, character_id: characterId }),
      token,
    }),
};
