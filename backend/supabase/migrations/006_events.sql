-- Migration: 006_events
-- Create events table for session timeline

-- Enum for event types
CREATE TYPE event_type AS ENUM (
  'session_start',
  'session_end',
  'player_action',
  'ai_response',
  'dice_roll',
  'state_change',
  'combat_start',
  'combat_end',
  'turn_start',
  'turn_end'
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type event_type NOT NULL,
  actor_id UUID REFERENCES auth.users(id),  -- null for system/AI events
  actor_name TEXT,  -- "Aragorn", "DM", "System"

  -- Event payload (structure depends on type)
  content JSONB NOT NULL,

  -- Rule citations (for AI responses with mechanics)
  rule_citations JSONB DEFAULT '[]' NOT NULL,

  -- Sequential ordering within session
  sequence INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_session_sequence ON events(session_id, sequence);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Function to auto-increment sequence within a session
CREATE OR REPLACE FUNCTION set_event_sequence()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(sequence), 0) + 1 INTO NEW.sequence
  FROM events
  WHERE session_id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_events_sequence ON events;
CREATE TRIGGER set_events_sequence
  BEFORE INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION set_event_sequence();
