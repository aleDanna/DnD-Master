-- Migration: 012_skills
-- Description: Create skills table for character skills
-- Date: 2026-01-30

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    ability VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    source_document VARCHAR(100),
    source_page INTEGER,
    search_vector TSVECTOR,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skills_ability ON skills(ability);
CREATE INDEX IF NOT EXISTS idx_skills_slug ON skills(slug);
CREATE INDEX IF NOT EXISTS idx_skills_search_vector ON skills USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_skills_embedding ON skills USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger for updated_at
CREATE TRIGGER update_skills_updated_at
    BEFORE UPDATE ON skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
