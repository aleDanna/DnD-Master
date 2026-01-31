-- Migration: 008_items
-- Description: Create items table for equipment and magic items
-- Date: 2026-01-30

CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    subtype VARCHAR(50),
    rarity VARCHAR(20),
    cost JSONB,
    weight DECIMAL(10, 2),
    properties TEXT[],
    damage JSONB,
    armor_class JSONB,
    description TEXT NOT NULL,
    requires_attunement BOOLEAN,
    source_document VARCHAR(100),
    source_page INTEGER,
    search_vector TSVECTOR,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_rarity ON items(rarity);
CREATE INDEX IF NOT EXISTS idx_items_slug ON items(slug);
CREATE INDEX IF NOT EXISTS idx_items_search_vector ON items USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_items_embedding ON items USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger for updated_at
CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
