-- Migration: 003_campaign_players
-- Create campaign_players junction table for multiplayer

-- Enum types for player roles and invite status
CREATE TYPE player_role AS ENUM ('owner', 'player');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined');

-- Campaign players junction table
CREATE TABLE IF NOT EXISTS campaign_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role player_role NOT NULL DEFAULT 'player',
  invite_status invite_status NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  joined_at TIMESTAMPTZ,
  UNIQUE(campaign_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_players_campaign ON campaign_players(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_players_user ON campaign_players(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_players_status ON campaign_players(invite_status);

-- Enable RLS
ALTER TABLE campaign_players ENABLE ROW LEVEL SECURITY;
