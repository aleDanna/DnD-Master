/**
 * Campaign Repository
 * Handles all database operations for campaigns and campaign players
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../models/database.types.js';
import type {
  Campaign,
  CampaignPlayer,
  CreateCampaignInput,
  UpdateCampaignInput,
} from '../../models/campaign.js';

type DbClient = SupabaseClient<Database>;

export class CampaignRepository {
  constructor(private client: DbClient) {}

  /**
   * Create a new campaign
   */
  async create(input: CreateCampaignInput, ownerId: string): Promise<Campaign> {
    const { data, error } = await this.client
      .from('campaigns')
      .insert({
        name: input.name,
        description: input.description,
        owner_id: ownerId,
        dice_mode: input.dice_mode || 'rng',
        map_mode: input.map_mode || 'narrative_only',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }

    // Also add owner as a player
    await this.addPlayer(data.id, ownerId);

    return this.mapToCampaign(data);
  }

  /**
   * Get a campaign by ID
   */
  async getById(id: string): Promise<Campaign | null> {
    const { data, error } = await this.client
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get campaign: ${error.message}`);
    }

    return this.mapToCampaign(data);
  }

  /**
   * Get campaigns for a user (as owner or player)
   */
  async listByUser(userId: string, page = 1, limit = 20): Promise<{ campaigns: Campaign[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get campaign IDs where user is a player
    const { data: playerData } = await this.client
      .from('campaign_players')
      .select('campaign_id')
      .eq('user_id', userId);

    const campaignIds = playerData?.map(p => p.campaign_id) || [];

    if (campaignIds.length === 0) {
      return { campaigns: [], total: 0 };
    }

    // Get campaigns
    const { data, error, count } = await this.client
      .from('campaigns')
      .select('*', { count: 'exact' })
      .in('id', campaignIds)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list campaigns: ${error.message}`);
    }

    return {
      campaigns: (data || []).map(this.mapToCampaign),
      total: count || 0,
    };
  }

  /**
   * Update a campaign
   */
  async update(id: string, input: UpdateCampaignInput): Promise<Campaign> {
    const { data, error } = await this.client
      .from('campaigns')
      .update({
        name: input.name,
        description: input.description,
        dice_mode: input.dice_mode,
        map_mode: input.map_mode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update campaign: ${error.message}`);
    }

    return this.mapToCampaign(data);
  }

  /**
   * Delete a campaign
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('campaigns').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete campaign: ${error.message}`);
    }
  }

  /**
   * Add a player to a campaign
   */
  async addPlayer(campaignId: string, userId: string, role: 'player' | 'dm' = 'player'): Promise<CampaignPlayer> {
    const { data, error } = await this.client
      .from('campaign_players')
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add player: ${error.message}`);
    }

    return {
      id: data.id,
      campaign_id: data.campaign_id,
      user_id: data.user_id,
      role: data.role as 'player' | 'dm',
      joined_at: data.joined_at,
    };
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
   * Get players in a campaign
   */
  async getPlayers(campaignId: string): Promise<CampaignPlayer[]> {
    const { data, error } = await this.client
      .from('campaign_players')
      .select('*')
      .eq('campaign_id', campaignId);

    if (error) {
      throw new Error(`Failed to get players: ${error.message}`);
    }

    return (data || []).map(p => ({
      id: p.id,
      campaign_id: p.campaign_id,
      user_id: p.user_id,
      role: p.role as 'player' | 'dm',
      joined_at: p.joined_at,
    }));
  }

  /**
   * Check if a user is a member of a campaign
   */
  async isMember(campaignId: string, userId: string): Promise<boolean> {
    const { data } = await this.client
      .from('campaign_players')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .single();

    return data !== null;
  }

  /**
   * Check if a user is the owner of a campaign
   */
  async isOwner(campaignId: string, userId: string): Promise<boolean> {
    const campaign = await this.getById(campaignId);
    return campaign?.owner_id === userId;
  }

  /**
   * Map database row to Campaign type
   */
  private mapToCampaign(data: Database['public']['Tables']['campaigns']['Row']): Campaign {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      owner_id: data.owner_id,
      dice_mode: data.dice_mode as 'rng' | 'player_entered',
      map_mode: data.map_mode as 'grid_2d' | 'narrative_only',
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}

/**
 * Factory function to create a campaign repository
 */
export function createCampaignRepository(client: DbClient): CampaignRepository {
  return new CampaignRepository(client);
}
