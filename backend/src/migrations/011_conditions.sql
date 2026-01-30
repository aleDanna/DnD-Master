-- Migration: 011_conditions
-- Description: Create conditions table for status conditions
-- Date: 2026-01-30

CREATE TABLE IF NOT EXISTS conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    source_document VARCHAR(100),
    source_page INTEGER,
    search_vector TSVECTOR,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conditions_slug ON conditions(slug);
CREATE INDEX IF NOT EXISTS idx_conditions_search_vector ON conditions USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_conditions_embedding ON conditions USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger for updated_at
CREATE TRIGGER update_conditions_updated_at
    BEFORE UPDATE ON conditions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
