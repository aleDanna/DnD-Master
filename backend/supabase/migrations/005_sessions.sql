-- Migration: 005_sessions
-- Create sessions table

-- Enum for session status
CREATE TYPE session_status AS ENUM ('active', 'paused', 'ended');

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT,
  status session_status NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL DEFAULT 1,  -- For optimistic locking in multiplayer

  -- Narrative state (for AI context)
  narrative_summary TEXT,
  current_location TEXT,
  active_npcs JSONB DEFAULT '[]' NOT NULL,

  -- Combat state (null if not in combat)
  combat_state JSONB,

  -- Map state (null if narrative_only mode)
  map_state JSONB,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_campaign ON sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity DESC);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Function to update last_activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sessions_activity ON sessions;
CREATE TRIGGER update_sessions_activity
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_session_activity();
