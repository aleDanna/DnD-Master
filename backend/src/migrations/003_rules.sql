-- Migration: 003_rules
-- Description: Create rules table with search_vector and embedding columns
-- Date: 2026-01-30

CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    category_id UUID NOT NULL REFERENCES rule_categories(id) ON DELETE CASCADE,
    summary TEXT,
    content TEXT NOT NULL,
    keywords TEXT[],
    source_document VARCHAR(100),
    source_page INTEGER,
    search_vector TSVECTOR,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rules_category ON rules(category_id);
CREATE INDEX IF NOT EXISTS idx_rules_slug ON rules(slug);
CREATE INDEX IF NOT EXISTS idx_rules_search_vector ON rules USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_rules_embedding ON rules USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger for updated_at
CREATE TRIGGER update_rules_updated_at
    BEFORE UPDATE ON rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
