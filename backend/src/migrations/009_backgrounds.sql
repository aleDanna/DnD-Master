-- Migration: 009_backgrounds
-- Description: Create backgrounds table for character backgrounds
-- Date: 2026-01-30

CREATE TABLE IF NOT EXISTS backgrounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    skill_proficiencies TEXT[] NOT NULL,
    tool_proficiencies TEXT[],
    languages INTEGER,
    equipment TEXT NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    feature_description TEXT NOT NULL,
    suggested_characteristics JSONB,
    source_document VARCHAR(100),
    source_page INTEGER,
    search_vector TSVECTOR,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_backgrounds_slug ON backgrounds(slug);
CREATE INDEX IF NOT EXISTS idx_backgrounds_search_vector ON backgrounds USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_backgrounds_embedding ON backgrounds USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger for updated_at
CREATE TRIGGER update_backgrounds_updated_at
    BEFORE UPDATE ON backgrounds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
