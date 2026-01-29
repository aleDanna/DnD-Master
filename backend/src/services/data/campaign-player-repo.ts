/**
 * Campaign Player Repository
 * Handles all database operations for campaign memberships and invitations
 */

import { db, query } from '../../config/database.js';
import { randomBytes } from 'crypto';

export interface CampaignPlayer {
  id: string;
  campaign_id: string;
  user_id: string;
  role: 'player' | 'dm';
  joined_at: string;
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

export class CampaignPlayerRepository {
  /**
   * Get all players in a campaign
   */
  async listByCampaign(campaignId: string): Promise<CampaignPlayer[]> {
    const result = await query<any>(
      `SELECT cp.*, p.id as user_id_ref, p.email as user_email, p.display_name as user_name
       FROM campaign_players cp
       LEFT JOIN profiles p ON cp.user_id = p.id
       WHERE cp.campaign_id = $1
       ORDER BY cp.joined_at ASC`,
      [campaignId]
    );

    return result.rows.map(row => this.mapToPlayer(row, {
      id: row.user_id,
      email: row.user_email,
      name: row.user_name,
    }));
  }

  /**
   * Get a player's membership in a campaign
   */
  async getByUserAndCampaign(userId: string, campaignId: string): Promise<CampaignPlayer | null> {
    const result = await query<any>(
      'SELECT * FROM campaign_players WHERE campaign_id = $1 AND user_id = $2 LIMIT 1',
      [campaignId, userId]
    );
    if (result.rows.length === 0) return null;
    return this.mapToPlayer(result.rows[0]);
  }

  /**
   * Add a player to a campaign
   */
  async addPlayer(
    campaignId: string,
    userId: string,
    role: 'player' | 'dm' = 'player'
  ): Promise<CampaignPlayer> {
    try {
      const data = await db.insert<any>('campaign_players', {
        campaign_id: campaignId,
        user_id: userId,
        role,
        joined_at: new Date(),
      });

      if (!data) {
        throw new Error('Failed to add player');
      }

      return this.mapToPlayer(data);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Player is already a member of this campaign');
      }
      throw error;
    }
  }

  /**
   * Remove a player from a campaign
   */
  async removePlayer(campaignId: string, userId: string): Promise<void> {
    await query(
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
    role: 'player' | 'dm'
  ): Promise<CampaignPlayer> {
    const result = await query<any>(
      'UPDATE campaign_players SET role = $1 WHERE campaign_id = $2 AND user_id = $3 RETURNING *',
      [role, campaignId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to update player role');
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
    return player?.role === 'dm';
  }

  /**
   * Get player count for a campaign
   */
  async getPlayerCount(campaignId: string): Promise<number> {
    const result = await query<{ count: string }>(
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

    const data = await db.insert<any>('campaign_invites', {
      campaign_id: input.campaign_id,
      email: input.email.toLowerCase(),
      token,
      role: input.role || 'player',
      invited_by: input.invited_by,
      created_at: new Date(),
      expires_at: expiresAt,
      accepted_at: null,
    });

    if (!data) {
      throw new Error('Failed to create invite');
    }

    return this.mapToInvite(data);
  }

  /**
   * Get an invitation by token
   */
  async getInviteByToken(token: string): Promise<CampaignInvite | null> {
    const data = await db.findOne<any>('campaign_invites', { token });
    if (!data) return null;
    return this.mapToInvite(data);
  }

  /**
   * Get pending invitations for a campaign
   */
  async getPendingInvites(campaignId: string): Promise<CampaignInvite[]> {
    const result = await query<any>(
      `SELECT * FROM campaign_invites
       WHERE campaign_id = $1 AND accepted_at IS NULL AND expires_at > $2
       ORDER BY created_at DESC`,
      [campaignId, new Date()]
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
    await query(
      'UPDATE campaign_invites SET accepted_at = $1 WHERE id = $2',
      [new Date(), invite.id]
    );

    // Add player to campaign
    return this.addPlayer(invite.campaign_id, userId, invite.role);
  }

  /**
   * Revoke an invitation
   */
  async revokeInvite(inviteId: string): Promise<void> {
    await db.delete('campaign_invites', { id: inviteId });
  }

  /**
   * Get all campaigns a user is a member of
   */
  async getCampaignsForUser(userId: string): Promise<string[]> {
    const data = await db.findMany<any>('campaign_players', { user_id: userId });
    return data.map(d => d.campaign_id);
  }

  private mapToPlayer(data: any, user?: { id: string; email?: string; name?: string }): CampaignPlayer {
    return {
      id: data.id,
      campaign_id: data.campaign_id,
      user_id: data.user_id,
      role: data.role as 'player' | 'dm',
      joined_at: data.joined_at instanceof Date ? data.joined_at.toISOString() : data.joined_at,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
      } : undefined,
    };
  }

  private mapToInvite(data: any): CampaignInvite {
    return {
      id: data.id,
      campaign_id: data.campaign_id,
      email: data.email,
      token: data.token,
      role: data.role as 'player' | 'dm',
      invited_by: data.invited_by,
      created_at: data.created_at instanceof Date ? data.created_at.toISOString() : data.created_at,
      expires_at: data.expires_at instanceof Date ? data.expires_at.toISOString() : data.expires_at,
      accepted_at: data.accepted_at ? (data.accepted_at instanceof Date ? data.accepted_at.toISOString() : data.accepted_at) : null,
    };
  }
}

/**
 * Factory function to create a campaign player repository
 */
export function createCampaignPlayerRepository(): CampaignPlayerRepository {
  return new CampaignPlayerRepository();
}
