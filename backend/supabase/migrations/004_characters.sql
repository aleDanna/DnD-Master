-- Migration: 004_characters
-- Create characters table

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  race TEXT NOT NULL,
  class TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 20),

  -- Core stats
  max_hp INTEGER NOT NULL,
  current_hp INTEGER NOT NULL,
  armor_class INTEGER NOT NULL,
  speed INTEGER NOT NULL DEFAULT 30,

  -- Ability scores (1-30 range per D&D rules)
  strength INTEGER NOT NULL CHECK (strength >= 1 AND strength <= 30),
  dexterity INTEGER NOT NULL CHECK (dexterity >= 1 AND dexterity <= 30),
  constitution INTEGER NOT NULL CHECK (constitution >= 1 AND constitution <= 30),
  intelligence INTEGER NOT NULL CHECK (intelligence >= 1 AND intelligence <= 30),
  wisdom INTEGER NOT NULL CHECK (wisdom >= 1 AND wisdom <= 30),
  charisma INTEGER NOT NULL CHECK (charisma >= 1 AND charisma <= 30),

  -- Additional data stored as JSON for flexibility
  skills JSONB DEFAULT '{}' NOT NULL,
  proficiencies JSONB DEFAULT '[]' NOT NULL,
  equipment JSONB DEFAULT '[]' NOT NULL,
  spells JSONB DEFAULT '[]' NOT NULL,
  features JSONB DEFAULT '[]' NOT NULL,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_characters_campaign ON characters(campaign_id);
CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id);

-- Enable RLS
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
