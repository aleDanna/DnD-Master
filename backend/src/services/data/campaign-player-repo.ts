/**
 * Campaign Player Repository
 * Handles all database operations for campaign memberships and invitations
 */

import { query, DbClient } from '../../config/database.js';
import type { CampaignPlayerRow } from '../../models/database.types.js';
import { randomBytes } from 'crypto';

export interface CampaignPlayer {
  id: string;
  campaign_id: string;
  user_id: string;
  role: 'player' | 'dm' | 'owner';
  joined_at: string | null;
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

export interface CampaignInvite {
  id: string;
  campaign_id: string;
  email: string;
  token: string;
  role: 'player' | 'dm';
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

export interface CreateInviteInput {
  campaign_id: string;
  email: string;
  role?: 'player' | 'dm';
  invited_by: string;
}

interface CampaignInviteRow {
  id: string;
  campaign_id: string;
  email: string;
  token: string;
  role: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

export class CampaignPlayerRepository {
  constructor(private client?: DbClient) {}

  private async executeQuery<T>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
    if (this.client) {
      return this.client.query<T>(text, params);
    }
    return query<T>(text, params);
  }

  /**
   * Get all players in a campaign
   */
  async listByCampaign(campaignId: string): Promise<CampaignPlayer[]> {
    const result = await this.executeQuery<CampaignPlayerRow & { user_email?: string; user_name?: string }>(
      `SELECT cp.*, p.email as user_email, p.display_name as user_name
       FROM campaign_players cp
       LEFT JOIN profiles p ON cp.user_id = p.id
       WHERE cp.campaign_id = $1
       ORDER BY cp.joined_at ASC`,
      [campaignId]
    );

    return result.rows.map(row => this.mapToPlayer(row));
  }

  /**
   * Get a player's membership in a campaign
   */
  async getByUserAndCampaign(userId: string, campaignId: string): Promise<CampaignPlayer | null> {
    const result = await this.executeQuery<CampaignPlayerRow>(
      'SELECT * FROM campaign_players WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapToPlayer(result.rows[0]);
  }

  /**
   * Add a player to a campaign
   */
  async addPlayer(
    campaignId: string,
    userId: string,
    role: 'player' | 'dm' | 'owner' = 'player'
  ): Promise<CampaignPlayer> {
    const result = await this.executeQuery<CampaignPlayerRow>(
      `INSERT INTO campaign_players (campaign_id, user_id, role, invite_status, joined_at)
       VALUES ($1, $2, $3, 'accepted', NOW())
       RETURNING *`,
      [campaignId, userId, role]
    );

    if (result.rowCount === 0) {
      throw new Error('Failed to add player');
    }

    return this.mapToPlayer(result.rows[0]);
  }

  /**
   * Remove a player from a campaign
   */
  async removePlayer(campaignId: string, userId: string): Promise<void> {
    await this.executeQuery(
      'DELETE FROM campaign_players WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    );
  }

  /**
   * Update a player's role
   */
  async updateRole(
    campaignId: string,
    userId: string,
    role: 'player' | 'dm' | 'owner'
  ): Promise<CampaignPlayer> {
    const result = await this.executeQuery<CampaignPlayerRow>(
      `UPDATE campaign_players SET role = $1 WHERE campaign_id = $2 AND user_id = $3 RETURNING *`,
      [role, campaignId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Player not found');
    }

    return this.mapToPlayer(result.rows[0]);
  }

  /**
   * Check if a user is a member of a campaign
   */
  async isMember(campaignId: string, userId: string): Promise<boolean> {
    const player = await this.getByUserAndCampaign(userId, campaignId);
    return player !== null;
  }

  /**
   * Check if a user is the DM of a campaign
   */
  async isDM(campaignId: string, userId: string): Promise<boolean> {
    const player = await this.getByUserAndCampaign(userId, campaignId);
    return player?.role === 'dm' || player?.role === 'owner';
  }

  /**
   * Get player count for a campaign
   */
  async getPlayerCount(campaignId: string): Promise<number> {
    const result = await this.executeQuery<{ count: string }>(
      'SELECT COUNT(*) as count FROM campaign_players WHERE campaign_id = $1',
      [campaignId]
    );

    return parseInt(result.rows[0]?.count || '0', 10);
  }

  /**
   * Create an invitation to join a campaign
   */
  async createInvite(input: CreateInviteInput): Promise<CampaignInvite> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiration

    const result = await this.executeQuery<CampaignInviteRow>(
      `INSERT INTO campaign_invites (campaign_id, email, token, role, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.campaign_id,
        input.email.toLowerCase(),
        token,
        input.role || 'player',
        input.invited_by,
        expiresAt.toISOString(),
      ]
    );

    if (result.rowCount === 0) {
      throw new Error('Failed to create invite');
    }

    return this.mapToInvite(result.rows[0]);
  }

  /**
   * Get an invitation by token
   */
  async getInviteByToken(token: string): Promise<CampaignInvite | null> {
    const result = await this.executeQuery<CampaignInviteRow>(
      'SELECT * FROM campaign_invites WHERE token = $1',
      [token]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapToInvite(result.rows[0]);
  }

  /**
   * Get pending invitations for a campaign
   */
  async getPendingInvites(campaignId: string): Promise<CampaignInvite[]> {
    const result = await this.executeQuery<CampaignInviteRow>(
      `SELECT * FROM campaign_invites
       WHERE campaign_id = $1 AND accepted_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [campaignId]
    );

    return result.rows.map(this.mapToInvite);
  }

  /**
   * Accept an invitation
   */
  async acceptInvite(token: string, userId: string): Promise<CampaignPlayer> {
    const invite = await this.getInviteByToken(token);

    if (!invite) {
      throw new Error('Invitation not found');
    }

    if (invite.accepted_at) {
      throw new Error('Invitation has already been used');
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }

    // Mark invite as accepted
    await this.executeQuery(
      'UPDATE campaign_invites SET accepted_at = NOW() WHERE id = $1',
      [invite.id]
    );

    // Add player to campaign
    return this.addPlayer(invite.campaign_id, userId, invite.role as 'player' | 'dm');
  }

  /**
   * Revoke an invitation
   */
  async revokeInvite(inviteId: string): Promise<void> {
    await this.executeQuery(
      'DELETE FROM campaign_invites WHERE id = $1',
      [inviteId]
    );
  }

  /**
   * Get all campaigns a user is a member of
   */
  async getCampaignsForUser(userId: string): Promise<string[]> {
    const result = await this.executeQuery<{ campaign_id: string }>(
      'SELECT campaign_id FROM campaign_players WHERE user_id = $1',
      [userId]
    );

    return result.rows.map(d => d.campaign_id);
  }

  private mapToPlayer(data: CampaignPlayerRow & {
    user_email?: string;
    user_name?: string;
  }): CampaignPlayer {
    return {
      id: data.id,
      campaign_id: data.campaign_id,
      user_id: data.user_id,
      role: data.role as 'player' | 'dm' | 'owner',
      joined_at: data.joined_at,
      user: data.user_email ? {
        id: data.user_id,
        email: data.user_email,
        name: data.user_name,
      } : undefined,
    };
  }

  private mapToInvite(data: CampaignInviteRow): CampaignInvite {
    return {
      id: data.id,
      campaign_id: data.campaign_id,
      email: data.email,
      token: data.token,
      role: data.role as 'player' | 'dm',
      invited_by: data.invited_by,
      created_at: data.created_at,
      expires_at: data.expires_at,
      accepted_at: data.accepted_at,
    };
  }
}

/**
 * Factory function to create a campaign player repository
 */
export function createCampaignPlayerRepository(client?: DbClient): CampaignPlayerRepository {
  return new CampaignPlayerRepository(client);
}
