/**
 * Campaign Repository
 * Handles all database operations for campaigns and campaign players
 */

import { db, query } from '../../config/database.js';
import type {
  Campaign,
  CampaignPlayer,
  CreateCampaignInput,
  UpdateCampaignInput,
} from '../../models/campaign.js';

export class CampaignRepository {
  /**
   * Create a new campaign
   */
  async create(input: CreateCampaignInput, ownerId: string): Promise<Campaign> {
    const data = await db.insert<any>('campaigns', {
      name: input.name,
      description: input.description || null,
      owner_id: ownerId,
      dice_mode: input.dice_mode || 'rng',
      map_mode: input.map_mode || 'narrative_only',
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (!data) {
      throw new Error('Failed to create campaign');
    }

    // Also add owner as a player
    await this.addPlayer(data.id, ownerId);

    return this.mapToCampaign(data);
  }

  /**
   * Get a campaign by ID
   */
  async getById(id: string): Promise<Campaign | null> {
    const data = await db.findOne<any>('campaigns', { id });
    if (!data) return null;
    return this.mapToCampaign(data);
  }

  /**
   * Get campaigns for a user (as owner or player)
   */
  async listByUser(userId: string, page = 1, limit = 20): Promise<{ campaigns: Campaign[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get campaign IDs where user is a player
    const playerData = await db.findMany<any>('campaign_players', { user_id: userId });
    const campaignIds = playerData.map(p => p.campaign_id);

    if (campaignIds.length === 0) {
      return { campaigns: [], total: 0 };
    }

    // Get campaigns with count
    const placeholders = campaignIds.map((_, i) => `$${i + 1}`).join(', ');
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM campaigns WHERE id IN (${placeholders})`,
      campaignIds
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    const result = await query<any>(
      `SELECT * FROM campaigns WHERE id IN (${placeholders}) ORDER BY updated_at DESC LIMIT $${campaignIds.length + 1} OFFSET $${campaignIds.length + 2}`,
      [...campaignIds, limit, offset]
    );

    return {
      campaigns: result.rows.map(this.mapToCampaign),
      total,
    };
  }

  /**
   * Update a campaign
   */
  async update(id: string, input: UpdateCampaignInput): Promise<Campaign> {
    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.dice_mode !== undefined) updateData.dice_mode = input.dice_mode;
    if (input.map_mode !== undefined) updateData.map_mode = input.map_mode;

    const data = await db.update<any>('campaigns', updateData, { id });

    if (!data) {
      throw new Error('Failed to update campaign');
    }

    return this.mapToCampaign(data);
  }

  /**
   * Delete a campaign
   */
  async delete(id: string): Promise<void> {
    await db.delete('campaigns', { id });
  }

  /**
   * Add a player to a campaign
   */
  async addPlayer(campaignId: string, userId: string, role: 'player' | 'dm' = 'player'): Promise<CampaignPlayer> {
    const data = await db.insert<any>('campaign_players', {
      campaign_id: campaignId,
      user_id: userId,
      role,
      joined_at: new Date(),
    });

    if (!data) {
      throw new Error('Failed to add player');
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
    await query(
      'DELETE FROM campaign_players WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    );
  }

  /**
   * Get players in a campaign
   */
  async getPlayers(campaignId: string): Promise<CampaignPlayer[]> {
    const data = await db.findMany<any>('campaign_players', { campaign_id: campaignId });

    return data.map(p => ({
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
    const result = await query<any>(
      'SELECT id FROM campaign_players WHERE campaign_id = $1 AND user_id = $2 LIMIT 1',
      [campaignId, userId]
    );
    return result.rows.length > 0;
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
  private mapToCampaign(data: any): Campaign {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      owner_id: data.owner_id,
      dice_mode: data.dice_mode as 'rng' | 'player_entered',
      map_mode: data.map_mode as 'grid_2d' | 'narrative_only',
      created_at: data.created_at instanceof Date ? data.created_at.toISOString() : data.created_at,
      updated_at: data.updated_at instanceof Date ? data.updated_at.toISOString() : data.updated_at,
    };
  }
}

/**
 * Factory function to create a campaign repository
 */
export function createCampaignRepository(): CampaignRepository {
  return new CampaignRepository();
}
