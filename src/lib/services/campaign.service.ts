import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import type {
  Campaign,
  CampaignCreationData,
  CampaignUpdateData,
  CampaignSettings,
  CampaignPlayer,
  CampaignStatus,
  HouseRule,
  WorldState,
  NPC,
  Location,
  Quest,
  DEFAULT_CAMPAIGN_SETTINGS,
} from '@/types/campaign.types';

// ============================================
// Validation Schemas
// ============================================

const campaignCreationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  setting: z.string().max(10000).optional(),
  settings: z.object({}).passthrough().optional(),
});

const campaignUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  setting: z.string().max(10000).optional(),
  settings: z.object({}).passthrough().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
});

// ============================================
// Campaign Service
// ============================================

export class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(
    ownerId: string,
    data: CampaignCreationData
  ): Promise<Campaign> {
    const validation = campaignCreationSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(`Invalid campaign data: ${validation.error.errors[0]?.message}`);
    }

    const settings: CampaignSettings = {
      ...DEFAULT_CAMPAIGN_SETTINGS,
      ...(data.settings || {}),
    };

    const dbCampaign = await prisma.campaign.create({
      data: {
        ownerId,
        name: data.name,
        description: data.description || null,
        setting: data.setting || null,
        startingLevel: settings.startingLevel,
        settings: settings as object,
        houseRules: [],
        worldState: {},
        status: 'ACTIVE',
      },
      include: {
        players: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
            character: true,
          },
        },
      },
    });

    // Add owner as a player (as DM)
    await prisma.campaignPlayer.create({
      data: {
        campaignId: dbCampaign.id,
        userId: ownerId,
        role: 'CO_DM', // Owner is effectively the DM
      },
    });

    return this.getCampaignById(dbCampaign.id) as Promise<Campaign>;
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string): Promise<Campaign | null> {
    const dbCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        players: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
            character: true,
          },
        },
      },
    });

    if (!dbCampaign) return null;

    return this.mapDbToCampaign(dbCampaign);
  }

  /**
   * Get campaigns for a user (owned or participating)
   */
  async getCampaignsForUser(userId: string): Promise<Campaign[]> {
    const dbCampaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { players: { some: { userId } } },
        ],
      },
      include: {
        players: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
            character: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return dbCampaigns.map((c) => this.mapDbToCampaign(c));
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: string,
    data: CampaignUpdateData
  ): Promise<Campaign> {
    const validation = campaignUpdateSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(`Invalid update data: ${validation.error.errors[0]?.message}`);
    }

    const existing = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!existing) {
      throw new Error('Campaign not found');
    }

    const updatedSettings = data.settings
      ? { ...(existing.settings as object), ...data.settings }
      : existing.settings;

    const dbCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.setting !== undefined && { setting: data.setting }),
        ...(data.settings && { settings: updatedSettings }),
        ...(data.status && { status: data.status.toUpperCase() as CampaignStatus }),
        ...(data.houseRules && { houseRules: data.houseRules }),
      },
      include: {
        players: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
            character: true,
          },
        },
      },
    });

    return this.mapDbToCampaign(dbCampaign);
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    await prisma.campaign.delete({
      where: { id: campaignId },
    });
  }

  /**
   * Add player to campaign
   */
  async addPlayer(
    campaignId: string,
    userId: string,
    role: 'player' | 'co-dm' | 'spectator' = 'player'
  ): Promise<CampaignPlayer> {
    const roleMap = {
      'player': 'PLAYER',
      'co-dm': 'CO_DM',
      'spectator': 'SPECTATOR',
    } as const;

    const dbPlayer = await prisma.campaignPlayer.create({
      data: {
        campaignId,
        userId,
        role: roleMap[role],
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        character: true,
      },
    });

    return {
      id: dbPlayer.id,
      campaignId: dbPlayer.campaignId,
      userId: dbPlayer.userId,
      characterId: dbPlayer.characterId || undefined,
      role: role,
      joinedAt: dbPlayer.joinedAt,
      user: dbPlayer.user,
      character: dbPlayer.character as CampaignPlayer['character'],
    };
  }

  /**
   * Remove player from campaign
   */
  async removePlayer(campaignId: string, userId: string): Promise<void> {
    await prisma.campaignPlayer.deleteMany({
      where: {
        campaignId,
        userId,
      },
    });
  }

  /**
   * Assign character to campaign player
   */
  async assignCharacter(
    campaignId: string,
    userId: string,
    characterId: string
  ): Promise<CampaignPlayer> {
    // Verify character belongs to user
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character || character.userId !== userId) {
      throw new Error('Character not found or does not belong to user');
    }

    // Update campaign player and character
    await prisma.$transaction([
      prisma.campaignPlayer.updateMany({
        where: { campaignId, userId },
        data: { characterId },
      }),
      prisma.character.update({
        where: { id: characterId },
        data: { campaignId },
      }),
    ]);

    const dbPlayer = await prisma.campaignPlayer.findFirst({
      where: { campaignId, userId },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        character: true,
      },
    });

    if (!dbPlayer) {
      throw new Error('Player not found');
    }

    return {
      id: dbPlayer.id,
      campaignId: dbPlayer.campaignId,
      userId: dbPlayer.userId,
      characterId: dbPlayer.characterId || undefined,
      role: dbPlayer.role.toLowerCase() as 'player' | 'co-dm' | 'spectator',
      joinedAt: dbPlayer.joinedAt,
      user: dbPlayer.user,
      character: dbPlayer.character as CampaignPlayer['character'],
    };
  }

  /**
   * Update world state
   */
  async updateWorldState(
    campaignId: string,
    updates: Partial<WorldState>
  ): Promise<Campaign> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const currentState = (campaign.worldState || {}) as WorldState;
    const newState: WorldState = {
      ...currentState,
      ...updates,
      globalFlags: {
        ...(currentState.globalFlags || {}),
        ...(updates.globalFlags || {}),
      },
      notes: updates.notes || currentState.notes || [],
    };

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { worldState: newState as object },
    });

    return this.getCampaignById(campaignId) as Promise<Campaign>;
  }

  // ============================================
  // NPC Management
  // ============================================

  /**
   * Create NPC
   */
  async createNPC(campaignId: string, data: Partial<NPC>): Promise<NPC> {
    const dbNPC = await prisma.nPC.create({
      data: {
        campaignId,
        name: data.name || 'Unknown NPC',
        description: data.description || null,
        personality: data.personality || null,
        appearance: data.appearance || null,
        stats: data.stats || null,
        locationId: data.locationId || null,
        knowledge: data.knowledge || [],
        relationships: data.relationships || {},
        goals: data.goals || [],
        isAlive: data.isAlive ?? true,
      },
    });

    return this.mapDbToNPC(dbNPC);
  }

  /**
   * Get NPCs for campaign
   */
  async getNPCsByCampaign(campaignId: string): Promise<NPC[]> {
    const dbNPCs = await prisma.nPC.findMany({
      where: { campaignId },
      orderBy: { name: 'asc' },
    });

    return dbNPCs.map((n) => this.mapDbToNPC(n));
  }

  /**
   * Update NPC
   */
  async updateNPC(npcId: string, data: Partial<NPC>): Promise<NPC> {
    const dbNPC = await prisma.nPC.update({
      where: { id: npcId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.personality !== undefined && { personality: data.personality }),
        ...(data.appearance !== undefined && { appearance: data.appearance }),
        ...(data.stats !== undefined && { stats: data.stats }),
        ...(data.locationId !== undefined && { locationId: data.locationId }),
        ...(data.knowledge && { knowledge: data.knowledge }),
        ...(data.relationships && { relationships: data.relationships }),
        ...(data.goals && { goals: data.goals }),
        ...(data.isAlive !== undefined && { isAlive: data.isAlive }),
      },
    });

    return this.mapDbToNPC(dbNPC);
  }

  /**
   * Delete NPC
   */
  async deleteNPC(npcId: string): Promise<void> {
    await prisma.nPC.delete({
      where: { id: npcId },
    });
  }

  // ============================================
  // Location Management
  // ============================================

  /**
   * Create location
   */
  async createLocation(campaignId: string, data: Partial<Location>): Promise<Location> {
    const dbLocation = await prisma.location.create({
      data: {
        campaignId,
        name: data.name || 'Unknown Location',
        description: data.description || null,
        locationType: data.locationType || null,
        parentLocationId: data.parentLocationId || null,
        properties: data.properties || {},
      },
    });

    return this.mapDbToLocation(dbLocation);
  }

  /**
   * Get locations for campaign
   */
  async getLocationsByCampaign(campaignId: string): Promise<Location[]> {
    const dbLocations = await prisma.location.findMany({
      where: { campaignId },
      include: {
        childLocations: true,
        npcs: true,
      },
      orderBy: { name: 'asc' },
    });

    return dbLocations.map((l) => this.mapDbToLocation(l));
  }

  // ============================================
  // Quest Management
  // ============================================

  /**
   * Create quest
   */
  async createQuest(campaignId: string, data: Partial<Quest>): Promise<Quest> {
    const dbQuest = await prisma.quest.create({
      data: {
        campaignId,
        title: data.title || 'Untitled Quest',
        description: data.description || null,
        status: 'AVAILABLE',
        objectives: data.objectives || [],
        rewards: data.rewards || {},
      },
    });

    return this.mapDbToQuest(dbQuest);
  }

  /**
   * Get quests for campaign
   */
  async getQuestsByCampaign(campaignId: string): Promise<Quest[]> {
    const dbQuests = await prisma.quest.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });

    return dbQuests.map((q) => this.mapDbToQuest(q));
  }

  /**
   * Update quest status
   */
  async updateQuestStatus(
    questId: string,
    status: Quest['status']
  ): Promise<Quest> {
    const statusMap = {
      available: 'AVAILABLE',
      active: 'ACTIVE',
      completed: 'COMPLETED',
      failed: 'FAILED',
      hidden: 'HIDDEN',
    } as const;

    const dbQuest = await prisma.quest.update({
      where: { id: questId },
      data: { status: statusMap[status] },
    });

    return this.mapDbToQuest(dbQuest);
  }

  // ============================================
  // Mappers
  // ============================================

  private mapDbToCampaign(dbCampaign: {
    id: string;
    ownerId: string;
    name: string;
    description: string | null;
    setting: string | null;
    startingLevel: number;
    worldState: unknown;
    settings: unknown;
    houseRules: unknown;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    players: Array<{
      id: string;
      campaignId: string;
      userId: string;
      characterId: string | null;
      role: string;
      joinedAt: Date;
      user: { id: string; displayName: string; avatarUrl: string | null };
      character: unknown;
    }>;
  }): Campaign {
    return {
      id: dbCampaign.id,
      ownerId: dbCampaign.ownerId,
      name: dbCampaign.name,
      description: dbCampaign.description || undefined,
      setting: dbCampaign.setting || undefined,
      startingLevel: dbCampaign.startingLevel,
      players: dbCampaign.players.map((p) => ({
        id: p.id,
        campaignId: p.campaignId,
        userId: p.userId,
        characterId: p.characterId || undefined,
        role: p.role.toLowerCase().replace('_', '-') as 'player' | 'co-dm' | 'spectator',
        joinedAt: p.joinedAt,
        user: p.user,
        character: p.character as CampaignPlayer['character'],
      })),
      worldState: (dbCampaign.worldState || {}) as WorldState,
      settings: (dbCampaign.settings || DEFAULT_CAMPAIGN_SETTINGS) as CampaignSettings,
      houseRules: (dbCampaign.houseRules || []) as HouseRule[],
      status: dbCampaign.status.toLowerCase() as CampaignStatus,
      createdAt: dbCampaign.createdAt,
      updatedAt: dbCampaign.updatedAt,
    };
  }

  private mapDbToNPC(dbNPC: {
    id: string;
    campaignId: string;
    name: string;
    description: string | null;
    personality: string | null;
    appearance: string | null;
    stats: unknown;
    locationId: string | null;
    knowledge: unknown;
    relationships: unknown;
    goals: unknown;
    isAlive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): NPC {
    return {
      id: dbNPC.id,
      campaignId: dbNPC.campaignId,
      name: dbNPC.name,
      description: dbNPC.description || undefined,
      personality: dbNPC.personality || undefined,
      appearance: dbNPC.appearance || undefined,
      stats: dbNPC.stats as NPC['stats'],
      locationId: dbNPC.locationId || undefined,
      knowledge: (dbNPC.knowledge || []) as string[],
      relationships: (dbNPC.relationships || []) as NPC['relationships'],
      goals: (dbNPC.goals || []) as string[],
      isAlive: dbNPC.isAlive,
      isKnownToParty: true, // Would need additional field
      disposition: 'neutral', // Would need additional field
      createdAt: dbNPC.createdAt,
      updatedAt: dbNPC.updatedAt,
    };
  }

  private mapDbToLocation(dbLocation: {
    id: string;
    campaignId: string;
    parentLocationId: string | null;
    name: string;
    description: string | null;
    locationType: string | null;
    properties: unknown;
    createdAt: Date;
    updatedAt: Date;
    childLocations?: unknown[];
    npcs?: unknown[];
  }): Location {
    return {
      id: dbLocation.id,
      campaignId: dbLocation.campaignId,
      parentLocationId: dbLocation.parentLocationId || undefined,
      name: dbLocation.name,
      description: dbLocation.description || undefined,
      locationType: (dbLocation.locationType || 'other') as Location['locationType'],
      properties: (dbLocation.properties || {}) as Location['properties'],
      childLocations: dbLocation.childLocations as Location['childLocations'],
      npcs: dbLocation.npcs as Location['npcs'],
      createdAt: dbLocation.createdAt,
      updatedAt: dbLocation.updatedAt,
    };
  }

  private mapDbToQuest(dbQuest: {
    id: string;
    campaignId: string;
    title: string;
    description: string | null;
    status: string;
    objectives: unknown;
    rewards: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): Quest {
    return {
      id: dbQuest.id,
      campaignId: dbQuest.campaignId,
      title: dbQuest.title,
      description: dbQuest.description || undefined,
      status: dbQuest.status.toLowerCase() as Quest['status'],
      objectives: (dbQuest.objectives || []) as Quest['objectives'],
      rewards: (dbQuest.rewards || {}) as Quest['rewards'],
      createdAt: dbQuest.createdAt,
      updatedAt: dbQuest.updatedAt,
    };
  }
}

// Singleton instance
export const campaignService = new CampaignService();
