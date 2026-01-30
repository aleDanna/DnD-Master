/**
 * Session Repository
 * Handles all database operations for game sessions
 */

import { query, DbClient } from '../../config/database.js';
import type { SessionRow, CampaignRow } from '../../models/database.types.js';
import type {
  Session,
  CreateSessionInput,
  UpdateSessionInput,
  SessionWithCampaign,
} from '../../models/session.js';

export class SessionRepository {
  constructor(private client?: DbClient) {}

  private async executeQuery<T>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
    if (this.client) {
      return this.client.query<T>(text, params);
    }
    return query<T>(text, params);
  }

  /**
   * Create a new session
   */
  async create(input: CreateSessionInput): Promise<Session> {
    const result = await this.executeQuery<SessionRow>(
      `INSERT INTO sessions (
        campaign_id, name, status, version, narrative_summary, current_location,
        active_npcs, combat_state, map_state, started_at, ended_at, last_activity
      ) VALUES ($1, $2, 'active', 1, NULL, NULL, $3, NULL, NULL, NOW(), NULL, NOW())
      RETURNING *`,
      [
        input.campaign_id,
        input.name || null,
        JSON.stringify([]),
      ]
    );

    if (result.rowCount === 0) {
      throw new Error('Failed to create session');
    }

    return this.mapToSession(result.rows[0]);
  }

  /**
   * Get a session by ID
   */
  async getById(id: string): Promise<Session | null> {
    const result = await this.executeQuery<SessionRow>(
      'SELECT * FROM sessions WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapToSession(result.rows[0]);
  }

  /**
   * Get a session with campaign details
   */
  async getWithCampaign(id: string): Promise<SessionWithCampaign | null> {
    const result = await this.executeQuery<SessionRow & { campaign_id: string; campaign_name: string; campaign_dice_mode: string; campaign_map_mode: string }>(
      `SELECT s.*, c.name as campaign_name, c.dice_mode as campaign_dice_mode, c.map_mode as campaign_map_mode
       FROM sessions s
       JOIN campaigns c ON s.campaign_id = c.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];
    const session = this.mapToSession(row);

    return {
      ...session,
      campaign: {
        id: row.campaign_id,
        name: row.campaign_name,
        dice_mode: row.campaign_dice_mode,
        map_mode: row.campaign_map_mode,
      },
    };
  }

  /**
   * List sessions for a campaign
   */
  async listByCampaign(campaignId: string): Promise<Session[]> {
    const result = await this.executeQuery<SessionRow>(
      'SELECT * FROM sessions WHERE campaign_id = $1 ORDER BY started_at DESC',
      [campaignId]
    );

    return result.rows.map(this.mapToSession);
  }

  /**
   * Get active session for a campaign (there should only be one)
   */
  async getActiveSession(campaignId: string): Promise<Session | null> {
    const result = await this.executeQuery<SessionRow>(
      `SELECT * FROM sessions WHERE campaign_id = $1 AND status = 'active' LIMIT 1`,
      [campaignId]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapToSession(result.rows[0]);
  }

  /**
   * Update a session
   * Uses optimistic locking with version number
   */
  async update(id: string, input: UpdateSessionInput, expectedVersion: number): Promise<Session> {
    // Build dynamic update query
    const updates: string[] = ['version = $1', 'last_activity = NOW()'];
    const values: any[] = [expectedVersion + 1];
    let paramIndex = 2;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(input.name);
      paramIndex++;
    }

    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(input.status);
      paramIndex++;
    }

    if (input.narrative_summary !== undefined) {
      updates.push(`narrative_summary = $${paramIndex}`);
      values.push(input.narrative_summary);
      paramIndex++;
    }

    if (input.current_location !== undefined) {
      updates.push(`current_location = $${paramIndex}`);
      values.push(input.current_location);
      paramIndex++;
    }

    if (input.active_npcs !== undefined) {
      updates.push(`active_npcs = $${paramIndex}`);
      values.push(JSON.stringify(input.active_npcs));
      paramIndex++;
    }

    if (input.combat_state !== undefined) {
      updates.push(`combat_state = $${paramIndex}`);
      values.push(input.combat_state ? JSON.stringify(input.combat_state) : null);
      paramIndex++;
    }

    if (input.map_state !== undefined) {
      updates.push(`map_state = $${paramIndex}`);
      values.push(input.map_state ? JSON.stringify(input.map_state) : null);
      paramIndex++;
    }

    values.push(id);
    values.push(expectedVersion);

    const result = await this.executeQuery<SessionRow>(
      `UPDATE sessions SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND version = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
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

    const result = await this.executeQuery<SessionRow>(
      `UPDATE sessions SET status = 'ended', ended_at = NOW(), last_activity = NOW(), version = version + 1
       WHERE id = $1 AND version = $2
       RETURNING *`,
      [id, session.version]
    );

    if (result.rowCount === 0) {
      throw new Error('Session was modified by another request');
    }

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
    const result = await this.executeQuery<SessionRow>(
      `SELECT * FROM sessions WHERE campaign_id = $1 AND status = 'paused' ORDER BY last_activity DESC`,
      [campaignId]
    );

    return result.rows.map(this.mapToSession);
  }

  /**
   * Update last activity timestamp
   */
  async touchSession(id: string): Promise<void> {
    await this.executeQuery(
      'UPDATE sessions SET last_activity = NOW() WHERE id = $1',
      [id]
    );
  }

  /**
   * Map database row to Session type
   */
  private mapToSession(data: SessionRow): Session {
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
      started_at: data.started_at,
      ended_at: data.ended_at,
      last_activity: data.last_activity,
    };
  }
}

/**
 * Factory function to create a session repository
 */
export function createSessionRepository(client?: DbClient): SessionRepository {
  return new SessionRepository(client);
}
