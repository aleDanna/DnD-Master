/**
 * Database type definitions for PostgreSQL
 * These types match the database schema defined in migrations
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Enum types
export type DiceMode = 'rng' | 'player_entered';
export type MapMode = 'grid_2d' | 'narrative_only';
export type PlayerRole = 'owner' | 'player';
export type InviteStatus = 'pending' | 'accepted' | 'declined';
export type SessionStatus = 'active' | 'paused' | 'ended';
export type EventType =
  | 'session_start'
  | 'session_end'
  | 'player_action'
  | 'ai_response'
  | 'dice_roll'
  | 'state_change'
  | 'combat_start'
  | 'combat_end'
  | 'turn_start'
  | 'turn_end'
  | 'session_save'
  | 'session_resume';

// Table row types
export interface ProfileRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignRow {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  dice_mode: DiceMode;
  map_mode: MapMode;
  created_at: string;
  updated_at: string;
}

export interface CampaignPlayerRow {
  id: string;
  campaign_id: string;
  user_id: string;
  role: PlayerRole;
  invite_status: InviteStatus;
  invited_at: string;
  joined_at: string | null;
}

export interface CharacterRow {
  id: string;
  campaign_id: string;
  user_id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  max_hp: number;
  current_hp: number;
  armor_class: number;
  speed: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  skills: Json;
  proficiencies: Json;
  equipment: Json;
  spells: Json;
  features: Json;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: string;
  campaign_id: string;
  name: string | null;
  status: SessionStatus;
  version: number;
  narrative_summary: string | null;
  current_location: string | null;
  active_npcs: Json;
  combat_state: Json | null;
  map_state: Json | null;
  started_at: string;
  ended_at: string | null;
  last_activity: string;
}

export interface EventRow {
  id: string;
  session_id: string;
  type: EventType;
  actor_id: string | null;
  actor_name: string | null;
  content: Json;
  rule_citations: Json;
  sequence: number;
  created_at: string;
}

// Legacy Database interface for backward compatibility
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, 'id' | 'email' | 'password_hash' | 'display_name'>;
        Update: Partial<ProfileRow>;
      };
      campaigns: {
        Row: CampaignRow;
        Insert: Partial<CampaignRow> & Pick<CampaignRow, 'owner_id' | 'name'>;
        Update: Partial<CampaignRow>;
      };
      campaign_players: {
        Row: CampaignPlayerRow;
        Insert: Partial<CampaignPlayerRow> & Pick<CampaignPlayerRow, 'campaign_id' | 'user_id'>;
        Update: Partial<CampaignPlayerRow>;
      };
      characters: {
        Row: CharacterRow;
        Insert: Partial<CharacterRow> & Pick<CharacterRow, 'campaign_id' | 'user_id' | 'name' | 'race' | 'class' | 'max_hp' | 'current_hp' | 'armor_class' | 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'>;
        Update: Partial<CharacterRow>;
      };
      sessions: {
        Row: SessionRow;
        Insert: Partial<SessionRow> & Pick<SessionRow, 'campaign_id'>;
        Update: Partial<SessionRow>;
      };
      events: {
        Row: EventRow;
        Insert: Partial<EventRow> & Pick<EventRow, 'session_id' | 'type' | 'content'>;
        Update: never; // Events are immutable
      };
    };
    Enums: {
      dice_mode: DiceMode;
      map_mode: MapMode;
      player_role: PlayerRole;
      invite_status: InviteStatus;
      session_status: SessionStatus;
      event_type: EventType;
    };
  };
}
