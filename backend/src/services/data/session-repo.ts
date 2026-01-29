/**
 * Session Repository
 * Handles all database operations for game sessions
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../models/database.types.js';
import type {
  Session,
  CreateSessionInput,
  UpdateSessionInput,
  SessionWithCampaign,
} from '../../models/session.js';

type DbClient = SupabaseClient<Database>;

export class SessionRepository {
  constructor(private client: DbClient) {}

  /**
   * Create a new session
   */
  async create(input: CreateSessionInput): Promise<Session> {
    const { data, error } = await this.client
      .from('sessions')
      .insert({
        campaign_id: input.campaign_id,
        name: input.name,
        status: 'active',
        version: 1,
        narrative_summary: null,
        current_location: null,
        active_npcs: [],
        combat_state: null,
        map_state: null,
        started_at: new Date().toISOString(),
        ended_at: null,
        last_activity: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return this.mapToSession(data);
  }

  /**
   * Get a session by ID
   */
  async getById(id: string): Promise<Session | null> {
    const { data, error } = await this.client
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get session: ${error.message}`);
    }

    return this.mapToSession(data);
  }

  /**
   * Get a session with campaign details
   */
  async getWithCampaign(id: string): Promise<SessionWithCampaign | null> {
    const { data, error } = await this.client
      .from('sessions')
      .select(`
        *,
        campaign:campaigns(id, name, dice_mode, map_mode)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get session: ${error.message}`);
    }

    const session = this.mapToSession(data);
    const campaign = data.campaign as {
      id: string;
      name: string;
      dice_mode: string;
      map_mode: string;
    };

    return {
      ...session,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        dice_mode: campaign.dice_mode,
        map_mode: campaign.map_mode,
      },
    };
  }

  /**
   * List sessions for a campaign
   */
  async listByCampaign(campaignId: string): Promise<Session[]> {
    const { data, error } = await this.client
      .from('sessions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('started_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list sessions: ${error.message}`);
    }

    return (data || []).map(this.mapToSession);
  }

  /**
   * Get active session for a campaign (there should only be one)
   */
  async getActiveSession(campaignId: string): Promise<Session | null> {
    const { data, error } = await this.client
      .from('sessions')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get active session: ${error.message}`);
    }

    return this.mapToSession(data);
  }

  /**
   * Update a session
   * Uses optimistic locking with version number
   */
  async update(id: string, input: UpdateSessionInput, expectedVersion: number): Promise<Session> {
    const { data, error } = await this.client
      .from('sessions')
      .update({
        name: input.name,
        status: input.status,
        narrative_summary: input.narrative_summary,
        current_location: input.current_location,
        active_npcs: input.active_npcs ? JSON.parse(JSON.stringify(input.active_npcs)) : undefined,
        combat_state: input.combat_state !== undefined
          ? (input.combat_state ? JSON.parse(JSON.stringify(input.combat_state)) : null)
          : undefined,
        map_state: input.map_state !== undefined
          ? (input.map_state ? JSON.parse(JSON.stringify(input.map_state)) : null)
          : undefined,
        version: expectedVersion + 1,
        last_activity: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('version', expectedVersion)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Session was modified by another request. Please refresh and try again.');
      }
      throw new Error(`Failed to update session: ${error.message}`);
    }

    return this.mapToSession(data);
  }

  /**
   * End a session
   */
  async endSession(id: string): Promise<Session> {
    const session = await this.getById(id);
    if (!session) {
      throw new Error('Session not found');
    }

    return this.update(
      id,
      { status: 'ended' },
      session.version
    ).then(s => ({
      ...s,
      ended_at: new Date().toISOString(),
    }));
  }

  /**
   * Pause a session
   */
  async pauseSession(id: string): Promise<Session> {
    const session = await this.getById(id);
    if (!session) {
      throw new Error('Session not found');
    }

    return this.update(id, { status: 'paused' }, session.version);
  }

  /**
   * Resume a session
   */
  async resumeSession(id: string): Promise<Session> {
    const session = await this.getById(id);
    if (!session) {
      throw new Error('Session not found');
    }

    return this.update(id, { status: 'active' }, session.version);
  }

  /**
   * Save a session (pause and store summary)
   */
  async saveSession(id: string, summary: string): Promise<Session> {
    const session = await this.getById(id);
    if (!session) {
      throw new Error('Session not found');
    }

    return this.update(
      id,
      {
        status: 'paused',
        narrative_summary: summary,
      },
      session.version
    );
  }

  /**
   * Get paused sessions that can be resumed
   */
  async getPausedSessions(campaignId: string): Promise<Session[]> {
    const { data, error } = await this.client
      .from('sessions')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'paused')
      .order('last_activity', { ascending: false });

    if (error) {
      throw new Error(`Failed to get paused sessions: ${error.message}`);
    }

    return (data || []).map(this.mapToSession);
  }

  /**
   * Update last activity timestamp
   */
  async touchSession(id: string): Promise<void> {
    const { error } = await this.client
      .from('sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  /**
   * Map database row to Session type
   */
  private mapToSession(data: Database['public']['Tables']['sessions']['Row']): Session {
    return {
      id: data.id,
      campaign_id: data.campaign_id,
      name: data.name,
      status: data.status as 'active' | 'paused' | 'ended',
      version: data.version,
      narrative_summary: data.narrative_summary,
      current_location: data.current_location,
      active_npcs: (data.active_npcs as Session['active_npcs']) || [],
      combat_state: data.combat_state as Session['combat_state'],
      map_state: data.map_state as Session['map_state'],
      started_at: data.started_at,
      ended_at: data.ended_at,
      last_activity: data.last_activity,
    };
  }
}

/**
 * Factory function to create a session repository
 */
export function createSessionRepository(client: DbClient): SessionRepository {
  return new SessionRepository(client);
}
