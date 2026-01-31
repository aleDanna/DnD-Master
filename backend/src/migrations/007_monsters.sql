-- Migration: 007_monsters
-- Description: Create monsters table for bestiary
-- Date: 2026-01-30

CREATE TABLE IF NOT EXISTS monsters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    size VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL,
    subtype VARCHAR(100),
    alignment VARCHAR(50),
    armor_class INTEGER NOT NULL,
    armor_type VARCHAR(100),
    hit_points INTEGER NOT NULL,
    hit_dice VARCHAR(50) NOT NULL,
    speed JSONB NOT NULL,
    ability_scores JSONB NOT NULL,
    saving_throws JSONB,
    skills JSONB,
    damage_vulnerabilities TEXT[],
    damage_resistances TEXT[],
    damage_immunities TEXT[],
    condition_immunities TEXT[],
    senses JSONB,
    languages TEXT[],
    challenge_rating VARCHAR(10) NOT NULL,
    challenge_rating_numeric DECIMAL(5, 3) NOT NULL,
    experience_points INTEGER NOT NULL,
    traits JSONB,
    actions JSONB NOT NULL,
    reactions JSONB,
    legendary_actions JSONB,
    lair_actions JSONB,
    description TEXT,
    source_document VARCHAR(100),
    source_page INTEGER,
    search_vector TSVECTOR,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monsters_type ON monsters(type);
CREATE INDEX IF NOT EXISTS idx_monsters_cr ON monsters(challenge_rating_numeric);
CREATE INDEX IF NOT EXISTS idx_monsters_slug ON monsters(slug);
CREATE INDEX IF NOT EXISTS idx_monsters_search_vector ON monsters USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_monsters_embedding ON monsters USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger for updated_at
CREATE TRIGGER update_monsters_updated_at
    BEFORE UPDATE ON monsters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
