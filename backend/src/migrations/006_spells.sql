-- Migration: 006_spells
-- Description: Create spells and spell_classes tables
-- Date: 2026-01-30

CREATE TABLE IF NOT EXISTS spells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    level INTEGER NOT NULL CHECK (level >= 0 AND level <= 9),
    school VARCHAR(50) NOT NULL,
    casting_time VARCHAR(100) NOT NULL,
    range VARCHAR(100) NOT NULL,
    components JSONB NOT NULL,
    duration VARCHAR(100) NOT NULL,
    concentration BOOLEAN NOT NULL DEFAULT FALSE,
    ritual BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT NOT NULL,
    higher_levels TEXT,
    source_document VARCHAR(100),
    source_page INTEGER,
    search_vector TSVECTOR,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction table for spell-class relationships
CREATE TABLE IF NOT EXISTS spell_classes (
    spell_id UUID NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (spell_id, class_id)
);

-- Indexes for spells
CREATE INDEX IF NOT EXISTS idx_spells_level ON spells(level);
CREATE INDEX IF NOT EXISTS idx_spells_school ON spells(school);
CREATE INDEX IF NOT EXISTS idx_spells_slug ON spells(slug);
CREATE INDEX IF NOT EXISTS idx_spells_search_vector ON spells USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_spells_embedding ON spells USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Indexes for spell_classes
CREATE INDEX IF NOT EXISTS idx_spell_classes_class ON spell_classes(class_id, spell_id);

-- Trigger for updated_at
CREATE TRIGGER update_spells_updated_at
    BEFORE UPDATE ON spells
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
