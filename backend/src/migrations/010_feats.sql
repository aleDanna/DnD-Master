-- Migration: 010_feats
-- Description: Create feats table for character feats
-- Date: 2026-01-30

CREATE TABLE IF NOT EXISTS feats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    prerequisites TEXT,
    description TEXT NOT NULL,
    benefits JSONB,
    source_document VARCHAR(100),
    source_page INTEGER,
    search_vector TSVECTOR,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feats_slug ON feats(slug);
CREATE INDEX IF NOT EXISTS idx_feats_search_vector ON feats USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_feats_embedding ON feats USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger for updated_at
CREATE TRIGGER update_feats_updated_at
    BEFORE UPDATE ON feats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
