-- Migration: 005_races
-- Description: Create races and subraces tables
-- Date: 2026-01-30

CREATE TABLE IF NOT EXISTS races (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    ability_score_increase JSONB NOT NULL,
    age_description TEXT,
    size VARCHAR(20) NOT NULL,
    speed INTEGER NOT NULL,
    languages TEXT[] NOT NULL,
    traits JSONB NOT NULL,
    source_document VARCHAR(100),
    source_page INTEGER,
    search_vector TSVECTOR,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subraces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    description TEXT,
    ability_score_increase JSONB,
    traits JSONB,
    source_document VARCHAR(100),
    source_page INTEGER,
    search_vector TSVECTOR,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for races
CREATE INDEX IF NOT EXISTS idx_races_slug ON races(slug);
CREATE INDEX IF NOT EXISTS idx_races_search_vector ON races USING GIN(search_vector);

-- Indexes for subraces
CREATE INDEX IF NOT EXISTS idx_subraces_race ON subraces(race_id);
CREATE INDEX IF NOT EXISTS idx_subraces_slug ON subraces(slug);
CREATE INDEX IF NOT EXISTS idx_subraces_search_vector ON subraces USING GIN(search_vector);

-- Triggers for updated_at
CREATE TRIGGER update_races_updated_at
    BEFORE UPDATE ON races
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subraces_updated_at
    BEFORE UPDATE ON subraces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
