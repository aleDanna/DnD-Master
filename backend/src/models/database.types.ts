/**
 * Database type definitions for Supabase client
 * These types match the database schema defined in migrations
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          is_admin?: boolean;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          dice_mode: 'rng' | 'player_entered';
          map_mode: 'grid_2d' | 'narrative_only';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          dice_mode?: 'rng' | 'player_entered';
          map_mode?: 'grid_2d' | 'narrative_only';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          dice_mode?: 'rng' | 'player_entered';
          map_mode?: 'grid_2d' | 'narrative_only';
          updated_at?: string;
        };
      };
      campaign_players: {
        Row: {
          id: string;
          campaign_id: string;
          user_id: string;
          role: 'owner' | 'player';
          invite_status: 'pending' | 'accepted' | 'declined';
          invited_at: string;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          user_id: string;
          role?: 'owner' | 'player';
          invite_status?: 'pending' | 'accepted' | 'declined';
          invited_at?: string;
          joined_at?: string | null;
        };
        Update: {
          role?: 'owner' | 'player';
          invite_status?: 'pending' | 'accepted' | 'declined';
          joined_at?: string | null;
        };
      };
      characters: {
        Row: {
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
        };
        Insert: {
          id?: string;
          campaign_id: string;
          user_id: string;
          name: string;
          race: string;
          class: string;
          level?: number;
          max_hp: number;
          current_hp: number;
          armor_class: number;
          speed?: number;
          strength: number;
          dexterity: number;
          constitution: number;
          intelligence: number;
          wisdom: number;
          charisma: number;
          skills?: Json;
          proficiencies?: Json;
          equipment?: Json;
          spells?: Json;
          features?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          race?: string;
          class?: string;
          level?: number;
          max_hp?: number;
          current_hp?: number;
          armor_class?: number;
          speed?: number;
          strength?: number;
          dexterity?: number;
          constitution?: number;
          intelligence?: number;
          wisdom?: number;
          charisma?: number;
          skills?: Json;
          proficiencies?: Json;
          equipment?: Json;
          spells?: Json;
          features?: Json;
          notes?: string | null;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          campaign_id: string;
          name: string | null;
          status: 'active' | 'paused' | 'ended';
          version: number;
          narrative_summary: string | null;
          current_location: string | null;
          active_npcs: Json;
          combat_state: Json | null;
          map_state: Json | null;
          started_at: string;
          ended_at: string | null;
          last_activity: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          name?: string | null;
          status?: 'active' | 'paused' | 'ended';
          version?: number;
          narrative_summary?: string | null;
          current_location?: string | null;
          active_npcs?: Json;
          combat_state?: Json | null;
          map_state?: Json | null;
          started_at?: string;
          ended_at?: string | null;
          last_activity?: string;
        };
        Update: {
          name?: string | null;
          status?: 'active' | 'paused' | 'ended';
          version?: number;
          narrative_summary?: string | null;
          current_location?: string | null;
          active_npcs?: Json;
          combat_state?: Json | null;
          map_state?: Json | null;
          ended_at?: string | null;
          last_activity?: string;
        };
      };
      events: {
        Row: {
          id: string;
          session_id: string;
          type: 'session_start' | 'session_end' | 'player_action' | 'ai_response' | 'dice_roll' | 'state_change' | 'combat_start' | 'combat_end' | 'turn_start' | 'turn_end';
          actor_id: string | null;
          actor_name: string | null;
          content: Json;
          rule_citations: Json;
          sequence: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          type: 'session_start' | 'session_end' | 'player_action' | 'ai_response' | 'dice_roll' | 'state_change' | 'combat_start' | 'combat_end' | 'turn_start' | 'turn_end';
          actor_id?: string | null;
          actor_name?: string | null;
          content: Json;
          rule_citations?: Json;
          sequence?: number;
          created_at?: string;
        };
        Update: {
          // Events are immutable
        };
      };
      // Rules Explorer tables
      source_documents: {
        Row: {
          id: string;
          name: string;
          file_type: 'pdf' | 'txt';
          file_hash: string;
          total_pages: number | null;
          ingested_at: string;
          ingested_by: string | null;
          status: 'processing' | 'completed' | 'failed';
          error_log: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          file_type: 'pdf' | 'txt';
          file_hash: string;
          total_pages?: number | null;
          ingested_at?: string;
          ingested_by?: string | null;
          status?: 'processing' | 'completed' | 'failed';
          error_log?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          status?: 'processing' | 'completed' | 'failed';
          error_log?: string | null;
          updated_at?: string;
        };
      };
      rule_chapters: {
        Row: {
          id: string;
          document_id: string;
          title: string;
          order_index: number;
          page_start: number | null;
          page_end: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          title: string;
          order_index: number;
          page_start?: number | null;
          page_end?: number | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          order_index?: number;
          page_start?: number | null;
          page_end?: number | null;
        };
      };
      rule_sections: {
        Row: {
          id: string;
          chapter_id: string;
          title: string;
          order_index: number;
          page_start: number | null;
          page_end: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          title: string;
          order_index: number;
          page_start?: number | null;
          page_end?: number | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          order_index?: number;
          page_start?: number | null;
          page_end?: number | null;
        };
      };
      rule_entries: {
        Row: {
          id: string;
          section_id: string;
          title: string | null;
          content: string;
          content_embedding: number[] | null;
          page_reference: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          title?: string | null;
          content: string;
          content_embedding?: number[] | null;
          page_reference?: string | null;
          order_index: number;
          created_at?: string;
        };
        Update: {
          title?: string | null;
          content?: string;
          content_embedding?: number[] | null;
          page_reference?: string | null;
          order_index?: number;
        };
      };
      rule_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
        };
      };
      rule_entry_categories: {
        Row: {
          entry_id: string;
          category_id: string;
        };
        Insert: {
          entry_id: string;
          category_id: string;
        };
        Update: {
          // Join table - no updates
        };
      };
    };
    Enums: {
      dice_mode: 'rng' | 'player_entered';
      map_mode: 'grid_2d' | 'narrative_only';
      player_role: 'owner' | 'player';
      invite_status: 'pending' | 'accepted' | 'declined';
      session_status: 'active' | 'paused' | 'ended';
      event_type: 'session_start' | 'session_end' | 'player_action' | 'ai_response' | 'dice_roll' | 'state_change' | 'combat_start' | 'combat_end' | 'turn_start' | 'turn_end';
      // Rules Explorer enums
      document_status: 'processing' | 'completed' | 'failed';
      file_type: 'pdf' | 'txt';
    };
  };
}
