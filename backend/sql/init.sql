-- DnD-Master Database Initialization Script
-- PostgreSQL with optional pgvector extension
-- Run this script to initialize the database schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Try to enable pgvector (optional - semantic search will be disabled if not available)
-- To install pgvector: https://github.com/pgvector/pgvector#installation
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
  RAISE NOTICE 'pgvector extension enabled - semantic search available';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgvector extension not available - semantic search will be disabled';
  RAISE NOTICE 'Full-text search will still work. To enable semantic search, install pgvector.';
END $$;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Create types only if they don't exist
DO $$ BEGIN
  CREATE TYPE dice_mode AS ENUM ('rng', 'player_entered');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE map_mode AS ENUM ('grid_2d', 'narrative_only');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE player_role AS ENUM ('owner', 'player');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('active', 'paused', 'ended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE file_type AS ENUM ('pdf', 'txt');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  dice_mode dice_mode DEFAULT 'rng',
  map_mode map_mode DEFAULT 'narrative_only',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_owner_id ON campaigns(owner_id);

-- Campaign players (join table for campaigns and users)
CREATE TABLE IF NOT EXISTS campaign_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role player_role DEFAULT 'player',
  invite_status invite_status DEFAULT 'pending',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(campaign_id, user_id)
);

-- Create indexes for campaign_players
CREATE INDEX IF NOT EXISTS idx_campaign_players_campaign_id ON campaign_players(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_players_user_id ON campaign_players(user_id);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  race VARCHAR(100) NOT NULL,
  class VARCHAR(100) NOT NULL,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 20),
  max_hp INTEGER NOT NULL CHECK (max_hp > 0),
  current_hp INTEGER NOT NULL CHECK (current_hp >= 0),
  armor_class INTEGER NOT NULL CHECK (armor_class >= 0),
  speed INTEGER DEFAULT 30 CHECK (speed >= 0),
  -- Ability scores
  strength INTEGER NOT NULL CHECK (strength >= 1 AND strength <= 30),
  dexterity INTEGER NOT NULL CHECK (dexterity >= 1 AND dexterity <= 30),
  constitution INTEGER NOT NULL CHECK (constitution >= 1 AND constitution <= 30),
  intelligence INTEGER NOT NULL CHECK (intelligence >= 1 AND intelligence <= 30),
  wisdom INTEGER NOT NULL CHECK (wisdom >= 1 AND wisdom <= 30),
  charisma INTEGER NOT NULL CHECK (charisma >= 1 AND charisma <= 30),
  -- JSON fields for complex data
  skills JSONB DEFAULT '[]'::jsonb,
  proficiencies JSONB DEFAULT '[]'::jsonb,
  equipment JSONB DEFAULT '[]'::jsonb,
  spells JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for characters
CREATE INDEX IF NOT EXISTS idx_characters_campaign_id ON characters(campaign_id);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255),
  status session_status DEFAULT 'active',
  version INTEGER DEFAULT 1,
  narrative_summary TEXT,
  current_location VARCHAR(255),
  active_npcs JSONB DEFAULT '[]'::jsonb,
  combat_state JSONB,
  map_state JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_campaign_id ON sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Events table (immutable event log)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type event_type NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name VARCHAR(255),
  content JSONB NOT NULL,
  rule_citations JSONB DEFAULT '[]'::jsonb,
  sequence_num SERIAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for events
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_sequence ON events(session_id, sequence_num);

-- =============================================================================
-- RULES EXPLORER TABLES
-- =============================================================================

-- Source documents (uploaded rulebooks)
CREATE TABLE IF NOT EXISTS source_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  file_type file_type NOT NULL,
  file_hash VARCHAR(64) NOT NULL UNIQUE,
  total_pages INTEGER,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  ingested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status document_status DEFAULT 'processing',
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for source_documents
CREATE INDEX IF NOT EXISTS idx_source_documents_status ON source_documents(status);

-- Rule chapters
CREATE TABLE IF NOT EXISTS rule_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  order_index INTEGER NOT NULL,
  page_start INTEGER,
  page_end INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for rule_chapters
CREATE INDEX IF NOT EXISTS idx_rule_chapters_document_id ON rule_chapters(document_id);
CREATE INDEX IF NOT EXISTS idx_rule_chapters_order ON rule_chapters(document_id, order_index);

-- Rule sections
CREATE TABLE IF NOT EXISTS rule_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES rule_chapters(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  order_index INTEGER NOT NULL,
  page_start INTEGER,
  page_end INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for rule_sections
CREATE INDEX IF NOT EXISTS idx_rule_sections_chapter_id ON rule_sections(chapter_id);
CREATE INDEX IF NOT EXISTS idx_rule_sections_order ON rule_sections(chapter_id, order_index);

-- Rule entries (individual rules)
-- Note: content_embedding uses FLOAT[] for compatibility when pgvector is not installed
CREATE TABLE IF NOT EXISTS rule_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES rule_sections(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  content_embedding FLOAT[],  -- Stores embeddings as float array (works without pgvector)
  content_tsv tsvector,       -- Full-text search vector
  page_reference VARCHAR(50),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for rule_entries
CREATE INDEX IF NOT EXISTS idx_rule_entries_section_id ON rule_entries(section_id);
CREATE INDEX IF NOT EXISTS idx_rule_entries_order ON rule_entries(section_id, order_index);
CREATE INDEX IF NOT EXISTS idx_rule_entries_tsv ON rule_entries USING gin(content_tsv);

-- Rule categories (for organizing rules)
CREATE TABLE IF NOT EXISTS rule_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint on name if it doesn't exist
DO $$ BEGIN
  ALTER TABLE rule_categories ADD CONSTRAINT rule_categories_name_key UNIQUE (name);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rule entry categories (many-to-many join table)
CREATE TABLE IF NOT EXISTS rule_entry_categories (
  entry_id UUID NOT NULL REFERENCES rule_entries(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES rule_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, category_id)
);

-- Create indexes for rule_entry_categories
CREATE INDEX IF NOT EXISTS idx_rule_entry_categories_entry ON rule_entry_categories(entry_id);
CREATE INDEX IF NOT EXISTS idx_rule_entry_categories_category ON rule_entry_categories(category_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update content_tsv on rule_entries
CREATE OR REPLACE FUNCTION update_rule_entry_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content_tsv = to_tsvector('english', COALESCE(NEW.title, '') || ' ' || NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for full-text search on rule entries (always available)
CREATE OR REPLACE FUNCTION search_rules_fulltext(
  search_query text,
  match_count int DEFAULT 10,
  category_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  rank float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    re.id,
    ts_rank(re.content_tsv, websearch_to_tsquery('english', search_query)) AS rank
  FROM rule_entries re
  LEFT JOIN rule_entry_categories rec ON re.id = rec.entry_id
  WHERE re.content_tsv @@ websearch_to_tsquery('english', search_query)
    AND (category_filter IS NULL OR rec.category_id = category_filter)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function for semantic search (requires pgvector)
-- This function calculates cosine similarity manually using FLOAT[] arrays
CREATE OR REPLACE FUNCTION search_rules_semantic(
  query_embedding FLOAT[],
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  section_id UUID,
  title VARCHAR(255),
  content TEXT,
  page_reference VARCHAR(50),
  similarity float
) AS $$
DECLARE
  has_pgvector boolean;
BEGIN
  -- Check if pgvector is available
  SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') INTO has_pgvector;

  IF has_pgvector THEN
    -- Use pgvector's optimized cosine distance
    RETURN QUERY EXECUTE '
      SELECT
        re.id,
        re.section_id,
        re.title,
        re.content,
        re.page_reference,
        1 - (re.content_embedding::vector <=> $1::vector) AS similarity
      FROM rule_entries re
      WHERE re.content_embedding IS NOT NULL
        AND 1 - (re.content_embedding::vector <=> $1::vector) > $2
      ORDER BY re.content_embedding::vector <=> $1::vector
      LIMIT $3'
    USING query_embedding, match_threshold, match_count;
  ELSE
    -- Fallback: Calculate cosine similarity manually (slower but works without pgvector)
    RETURN QUERY
    SELECT
      re.id,
      re.section_id,
      re.title,
      re.content,
      re.page_reference,
      (
        SELECT SUM(a * b) / (SQRT(SUM(a * a)) * SQRT(SUM(b * b)))
        FROM unnest(re.content_embedding) WITH ORDINALITY AS arr1(a, i)
        JOIN unnest(query_embedding) WITH ORDINALITY AS arr2(b, j) ON arr1.i = arr2.j
      )::float AS similarity
    FROM rule_entries re
    WHERE re.content_embedding IS NOT NULL
      AND array_length(re.content_embedding, 1) = array_length(query_embedding, 1)
    ORDER BY similarity DESC
    LIMIT match_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Drop existing triggers if they exist (to allow re-running script)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
DROP TRIGGER IF EXISTS update_source_documents_updated_at ON source_documents;
DROP TRIGGER IF EXISTS update_rule_entries_tsv ON rule_entries;

-- Trigger for updating updated_at on users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updating updated_at on campaigns
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updating updated_at on characters
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updating updated_at on source_documents
CREATE TRIGGER update_source_documents_updated_at
  BEFORE UPDATE ON source_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updating content_tsv on rule_entries
CREATE TRIGGER update_rule_entries_tsv
  BEFORE INSERT OR UPDATE ON rule_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_rule_entry_tsv();

-- =============================================================================
-- SEED DATA (Optional)
-- =============================================================================

-- Insert default rule categories
INSERT INTO rule_categories (name, description) VALUES
  ('Combat', 'Rules related to combat mechanics'),
  ('Spellcasting', 'Rules for casting spells and magical effects'),
  ('Character Creation', 'Rules for creating and leveling characters'),
  ('Equipment', 'Rules about weapons, armor, and items'),
  ('Skills', 'Rules for skill checks and abilities'),
  ('Conditions', 'Status conditions and their effects'),
  ('Movement', 'Rules for movement and travel'),
  ('Rest', 'Rules for short and long rests')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- POST-INITIALIZATION NOTICE
-- =============================================================================

DO $$
DECLARE
  has_pgvector boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') INTO has_pgvector;

  RAISE NOTICE '';
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'DnD-Master Database Initialization Complete!';
  RAISE NOTICE '====================================================';

  IF has_pgvector THEN
    RAISE NOTICE 'pgvector: ENABLED (semantic search available)';
  ELSE
    RAISE NOTICE 'pgvector: NOT INSTALLED (semantic search disabled)';
    RAISE NOTICE 'Full-text search is still available.';
    RAISE NOTICE 'To enable semantic search, install pgvector:';
    RAISE NOTICE '  https://github.com/pgvector/pgvector#installation';
  END IF;

  RAISE NOTICE '====================================================';
END $$;
