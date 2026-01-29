/**
 * Session Repository
 * Handles all database operations for game sessions
 */

import { db, query } from '../../config/database.js';
import type {
  Session,
  CreateSessionInput,
  UpdateSessionInput,
  SessionWithCampaign,
} from '../../models/session.js';

export class SessionRepository {
  /**
   * Create a new session
   */
  async create(input: CreateSessionInput): Promise<Session> {
    const data = await db.insert<any>('sessions', {
      campaign_id: input.campaign_id,
      name: input.name,
      status: 'active',
      version: 1,
      narrative_summary: null,
      current_location: null,
      active_npcs: JSON.stringify([]),
      combat_state: null,
      map_state: null,
      started_at: new Date(),
      ended_at: null,
      last_activity: new Date(),
    });

    if (!data) {
      throw new Error('Failed to create session');
    }

    return this.mapToSession(data);
  }

  /**
   * Get a session by ID
   */
  async getById(id: string): Promise<Session | null> {
    const data = await db.findOne<any>('sessions', { id });
    if (!data) return null;
    return this.mapToSession(data);
  }

  /**
   * Get a session with campaign details
   */
  async getWithCampaign(id: string): Promise<SessionWithCampaign | null> {
    const result = await query<any>(
      `SELECT s.*, c.id as campaign_id_ref, c.name as campaign_name, c.dice_mode, c.map_mode
       FROM sessions s
       JOIN campaigns c ON s.campaign_id = c.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const data = result.rows[0];
    const session = this.mapToSession(data);

    return {
      ...session,
      campaign: {
        id: data.campaign_id,
        name: data.campaign_name,
        dice_mode: data.dice_mode,
        map_mode: data.map_mode,
      },
    };
  }

  /**
   * List sessions for a campaign
   */
  async listByCampaign(campaignId: string): Promise<Session[]> {
    const data = await db.findMany<any>(
      'sessions',
      { campaign_id: campaignId },
      { orderBy: 'started_at DESC' }
    );
    return data.map(this.mapToSession);
  }

  /**
   * Get active session for a campaign (there should only be one)
   */
  async getActiveSession(campaignId: string): Promise<Session | null> {
    const result = await query<any>(
      `SELECT * FROM sessions WHERE campaign_id = $1 AND status = 'active' LIMIT 1`,
      [campaignId]
    );
    if (result.rows.length === 0) return null;
    return this.mapToSession(result.rows[0]);
  }

  /**
   * Update a session
   * Uses optimistic locking with version number
   */
  async update(id: string, input: UpdateSessionInput, expectedVersion: number): Promise<Session> {
    const updateFields: string[] = ['version = $1', 'last_activity = $2'];
    const values: any[] = [expectedVersion + 1, new Date()];
    let paramIndex = 3;

    if (input.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }
    if (input.narrative_summary !== undefined) {
      updateFields.push(`narrative_summary = $${paramIndex++}`);
      values.push(input.narrative_summary);
    }
    if (input.current_location !== undefined) {
      updateFields.push(`current_location = $${paramIndex++}`);
      values.push(input.current_location);
    }
    if (input.active_npcs !== undefined) {
      updateFields.push(`active_npcs = $${paramIndex++}`);
      values.push(JSON.stringify(input.active_npcs));
    }
    if (input.combat_state !== undefined) {
      updateFields.push(`combat_state = $${paramIndex++}`);
      values.push(input.combat_state ? JSON.stringify(input.combat_state) : null);
    }
    if (input.map_state !== undefined) {
      updateFields.push(`map_state = $${paramIndex++}`);
      values.push(input.map_state ? JSON.stringify(input.map_state) : null);
    }

    values.push(id, expectedVersion);

    const result = await query<any>(
      `UPDATE sessions SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex++} AND version = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Session was modified by another request. Please refresh and try again.');
    }

    return this.mapToSession(result.rows[0]);
  }

  /**
   * End a session
   */
  async endSession(id: string): Promise<Session> {
    const session = await this.getById(id);
    if (!session) {
      throw new Error('Session not found');
    }

    const result = await query<any>(
      `UPDATE sessions SET status = 'ended', ended_at = $1, last_activity = $1, version = version + 1
       WHERE id = $2 RETURNING *`,
      [new Date(), id]
    );

    return this.mapToSession(result.rows[0]);
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
    const result = await query<any>(
      `SELECT * FROM sessions WHERE campaign_id = $1 AND status = 'paused' ORDER BY last_activity DESC`,
      [campaignId]
    );
    return result.rows.map(this.mapToSession);
  }

  /**
   * Update last activity timestamp
   */
  async touchSession(id: string): Promise<void> {
    await query('UPDATE sessions SET last_activity = $1 WHERE id = $2', [new Date(), id]);
  }

  /**
   * Map database row to Session type
   */
  private mapToSession(data: any): Session {
    return {
      id: data.id,
      campaign_id: data.campaign_id,
      name: data.name,
      status: data.status as 'active' | 'paused' | 'ended',
      version: data.version,
      narrative_summary: data.narrative_summary,
      current_location: data.current_location,
      active_npcs: (typeof data.active_npcs === 'string' ? JSON.parse(data.active_npcs) : data.active_npcs) || [],
      combat_state: typeof data.combat_state === 'string' ? JSON.parse(data.combat_state) : data.combat_state,
      map_state: typeof data.map_state === 'string' ? JSON.parse(data.map_state) : data.map_state,
      started_at: data.started_at instanceof Date ? data.started_at.toISOString() : data.started_at,
      ended_at: data.ended_at instanceof Date ? data.ended_at.toISOString() : data.ended_at,
      last_activity: data.last_activity instanceof Date ? data.last_activity.toISOString() : data.last_activity,
    };
  }
}

/**
 * Factory function to create a session repository
 */
export function createSessionRepository(): SessionRepository {
  return new SessionRepository();
}
