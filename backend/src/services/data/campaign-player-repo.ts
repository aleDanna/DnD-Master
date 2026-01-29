/**
 * Campaign Player Repository
 * Handles all database operations for campaign memberships and invitations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../models/database.types.js';
import { randomBytes } from 'crypto';

type DbClient = SupabaseClient<Database>;

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
  constructor(private client: DbClient) {}

  /**
   * Get all players in a campaign
   */
  async listByCampaign(campaignId: string): Promise<CampaignPlayer[]> {
    const { data, error } = await this.client
      .from('campaign_players')
      .select(`
        *,
        user:profiles(id, email, name)
      `)
      .eq('campaign_id', campaignId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to list campaign players: ${error.message}`);
    }

    return (data || []).map(this.mapToPlayer);
  }

  /**
   * Get a player's membership in a campaign
   */
  async getByUserAndCampaign(userId: string, campaignId: string): Promise<CampaignPlayer | null> {
    const { data, error } = await this.client
      .from('campaign_players')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get campaign player: ${error.message}`);
    }

    return this.mapToPlayer(data);
  }

  /**
   * Add a player to a campaign
   */
  async addPlayer(
    campaignId: string,
    userId: string,
    role: 'player' | 'dm' = 'player'
  ): Promise<CampaignPlayer> {
    const { data, error } = await this.client
      .from('campaign_players')
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        role,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Player is already a member of this campaign');
      }
      throw new Error(`Failed to add player: ${error.message}`);
    }

    return this.mapToPlayer(data);
  }

  /**
   * Remove a player from a campaign
   */
  async removePlayer(campaignId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('campaign_players')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to remove player: ${error.message}`);
    }
  }

  /**
   * Update a player's role
   */
  async updateRole(
    campaignId: string,
    userId: string,
    role: 'player' | 'dm'
  ): Promise<CampaignPlayer> {
    const { data, error } = await this.client
      .from('campaign_players')
      .update({ role })
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update player role: ${error.message}`);
    }

    return this.mapToPlayer(data);
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
    const { count, error } = await this.client
      .from('campaign_players')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    if (error) {
      throw new Error(`Failed to count players: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Create an invitation to join a campaign
   */
  async createInvite(input: CreateInviteInput): Promise<CampaignInvite> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiration

    const { data, error } = await this.client
      .from('campaign_invites')
      .insert({
        campaign_id: input.campaign_id,
        email: input.email.toLowerCase(),
        token,
        role: input.role || 'player',
        invited_by: input.invited_by,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        accepted_at: null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invite: ${error.message}`);
    }

    return this.mapToInvite(data);
  }

  /**
   * Get an invitation by token
   */
  async getInviteByToken(token: string): Promise<CampaignInvite | null> {
    const { data, error } = await this.client
      .from('campaign_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get invite: ${error.message}`);
    }

    return this.mapToInvite(data);
  }

  /**
   * Get pending invitations for a campaign
   */
  async getPendingInvites(campaignId: string): Promise<CampaignInvite[]> {
    const { data, error } = await this.client
      .from('campaign_invites')
      .select('*')
      .eq('campaign_id', campaignId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get pending invites: ${error.message}`);
    }

    return (data || []).map(this.mapToInvite);
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
    const { error: updateError } = await this.client
      .from('campaign_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id);

    if (updateError) {
      throw new Error(`Failed to accept invite: ${updateError.message}`);
    }

    // Add player to campaign
    return this.addPlayer(invite.campaign_id, userId, invite.role);
  }

  /**
   * Revoke an invitation
   */
  async revokeInvite(inviteId: string): Promise<void> {
    const { error } = await this.client
      .from('campaign_invites')
      .delete()
      .eq('id', inviteId);

    if (error) {
      throw new Error(`Failed to revoke invite: ${error.message}`);
    }
  }

  /**
   * Get all campaigns a user is a member of
   */
  async getCampaignsForUser(userId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('campaign_players')
      .select('campaign_id')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get user campaigns: ${error.message}`);
    }

    return (data || []).map(d => d.campaign_id);
  }

  private mapToPlayer(data: Database['public']['Tables']['campaign_players']['Row'] & {
    user?: { id: string; email?: string; name?: string };
  }): CampaignPlayer {
    return {
      id: data.id,
      campaign_id: data.campaign_id,
      user_id: data.user_id,
      role: data.role as 'player' | 'dm',
      joined_at: data.joined_at,
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      } : undefined,
    };
  }

  private mapToInvite(data: Database['public']['Tables']['campaign_invites']['Row']): CampaignInvite {
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
export function createCampaignPlayerRepository(client: DbClient): CampaignPlayerRepository {
  return new CampaignPlayerRepository(client);
}
