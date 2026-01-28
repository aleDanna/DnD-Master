/**
 * Campaign type definitions
 * Represents a D&D campaign with settings
 */

export type DiceMode = 'rng' | 'player_entered';
export type MapMode = 'grid_2d' | 'narrative_only';

export interface Campaign {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  dice_mode: DiceMode;
  map_mode: MapMode;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  dice_mode?: DiceMode;
  map_mode?: MapMode;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  dice_mode?: DiceMode;
  map_mode?: MapMode;
}

export interface CampaignWithOwner extends Campaign {
  owner: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

// Campaign player (for multiplayer)
export type PlayerRole = 'owner' | 'player';
export type InviteStatus = 'pending' | 'accepted' | 'declined';

export interface CampaignPlayer {
  id: string;
  campaign_id: string;
  user_id: string;
  role: PlayerRole;
  invite_status: InviteStatus;
  invited_at: string;
  joined_at: string | null;
}

export interface CampaignPlayerWithProfile extends CampaignPlayer {
  profile: {
    display_name: string;
    avatar_url: string | null;
  };
}
