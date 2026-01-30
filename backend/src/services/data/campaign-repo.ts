/**
 * Campaign Repository
 * Handles all database operations for campaigns and campaign players
 */

import { query, DbClient } from '../../config/database.js';
import type { CampaignRow, CampaignPlayerRow } from '../../models/database.types.js';
import type {
  Campaign,
  CampaignPlayer,
  CreateCampaignInput,
  UpdateCampaignInput,
} from '../../models/campaign.js';

export class CampaignRepository {
  constructor(private client?: DbClient) {}

  private async executeQuery<T>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
    if (this.client) {
      return this.client.query<T>(text, params);
    }
    return query<T>(text, params);
  }

  /**
   * Create a new campaign
   */
  async create(input: CreateCampaignInput, ownerId: string): Promise<Campaign> {
    const result = await this.executeQuery<CampaignRow>(
      `INSERT INTO campaigns (owner_id, name, description, dice_mode, map_mode)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        ownerId,
        input.name,
        input.description || null,
        input.dice_mode || 'rng',
        input.map_mode || 'narrative_only',
      ]
    );

    if (result.rowCount === 0) {
      throw new Error('Failed to create campaign');
    }

    const campaign = result.rows[0];

    // Also add owner as a player
    await this.addPlayer(campaign.id, ownerId, 'owner');

    return this.mapToCampaign(campaign);
  }

  /**
   * Get a campaign by ID
   */
  async getById(id: string): Promise<Campaign | null> {
    const result = await this.executeQuery<CampaignRow>(
      'SELECT * FROM campaigns WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapToCampaign(result.rows[0]);
  }

  /**
   * Get campaigns for a user (as owner or player)
   */
  async listByUser(userId: string, page = 1, limit = 20): Promise<{ campaigns: Campaign[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get campaign IDs where user is a player
    const playerResult = await this.executeQuery<{ campaign_id: string }>(
      'SELECT campaign_id FROM campaign_players WHERE user_id = $1',
      [userId]
    );

    const campaignIds = playerResult.rows.map(p => p.campaign_id);

    if (campaignIds.length === 0) {
      return { campaigns: [], total: 0 };
    }

    // Get total count
    const countResult = await this.executeQuery<{ count: string }>(
      'SELECT COUNT(*) as count FROM campaigns WHERE id = ANY($1)',
      [campaignIds]
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Get campaigns with pagination
    const result = await this.executeQuery<CampaignRow>(
      `SELECT * FROM campaigns
       WHERE id = ANY($1)
       ORDER BY updated_at DESC
       LIMIT $2 OFFSET $3`,
      [campaignIds, limit, offset]
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
    const result = await this.executeQuery<CampaignRow>(
      `UPDATE campaigns
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           dice_mode = COALESCE($4, dice_mode),
           map_mode = COALESCE($5, map_mode),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, input.name, input.description, input.dice_mode, input.map_mode]
    );

    if (result.rowCount === 0) {
      throw new Error('Campaign not found');
    }

    return this.mapToCampaign(result.rows[0]);
  }

  /**
   * Delete a campaign
   */
  async delete(id: string): Promise<void> {
    const result = await this.executeQuery(
      'DELETE FROM campaigns WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      throw new Error('Campaign not found');
    }
  }

  /**
   * Add a player to a campaign
   */
  async addPlayer(campaignId: string, userId: string, role: 'owner' | 'player' = 'player'): Promise<CampaignPlayer> {
    const result = await this.executeQuery<CampaignPlayerRow>(
      `INSERT INTO campaign_players (campaign_id, user_id, role, invite_status, joined_at)
       VALUES ($1, $2, $3, 'accepted', NOW())
       RETURNING *`,
      [campaignId, userId, role]
    );

    if (result.rowCount === 0) {
      throw new Error('Failed to add player');
    }

    const data = result.rows[0];
    return {
      id: data.id,
      campaign_id: data.campaign_id,
      user_id: data.user_id,
      role: data.role as 'owner' | 'player',
      joined_at: data.joined_at,
    };
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
   * Get players in a campaign
   */
  async getPlayers(campaignId: string): Promise<CampaignPlayer[]> {
    const result = await this.executeQuery<CampaignPlayerRow>(
      'SELECT * FROM campaign_players WHERE campaign_id = $1',
      [campaignId]
    );

    return result.rows.map(p => ({
      id: p.id,
      campaign_id: p.campaign_id,
      user_id: p.user_id,
      role: p.role as 'owner' | 'player',
      joined_at: p.joined_at,
    }));
  }

  /**
   * Check if a user is a member of a campaign
   */
  async isMember(campaignId: string, userId: string): Promise<boolean> {
    const result = await this.executeQuery<{ id: string }>(
      'SELECT id FROM campaign_players WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    );

    return result.rowCount > 0;
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
  private mapToCampaign(data: CampaignRow): Campaign {
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
export function createCampaignRepository(client?: DbClient): CampaignRepository {
  return new CampaignRepository(client);
}
