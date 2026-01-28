-- Migration: 002_campaigns
-- Create campaigns table

-- Enum types for campaign settings
CREATE TYPE dice_mode AS ENUM ('rng', 'player_entered');
CREATE TYPE map_mode AS ENUM ('grid_2d', 'narrative_only');

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  dice_mode dice_mode NOT NULL DEFAULT 'rng',
  map_mode map_mode NOT NULL DEFAULT 'grid_2d',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_owner ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
