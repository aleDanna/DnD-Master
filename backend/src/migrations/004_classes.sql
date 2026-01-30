-- Migration: 004_classes
-- Description: Create classes and subclasses tables
-- Date: 2026-01-30

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    hit_die VARCHAR(10) NOT NULL,
    primary_ability VARCHAR(50) NOT NULL,
    saving_throws TEXT[] NOT NULL,
    armor_proficiencies TEXT[],
    weapon_proficiencies TEXT[],
    tool_proficiencies TEXT[],
    skill_choices JSONB,
    features JSONB NOT NULL,
    source_document VARCHAR(100),
    source_page INTEGER,
    search_vector TSVECTOR,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subclasses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    features JSONB NOT NULL,
    source_document VARCHAR(100),
    source_page INTEGER,
    search_vector TSVECTOR,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for classes
CREATE INDEX IF NOT EXISTS idx_classes_slug ON classes(slug);
CREATE INDEX IF NOT EXISTS idx_classes_search_vector ON classes USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_classes_features ON classes USING GIN(features);

-- Indexes for subclasses
CREATE INDEX IF NOT EXISTS idx_subclasses_class ON subclasses(class_id);
CREATE INDEX IF NOT EXISTS idx_subclasses_slug ON subclasses(slug);
CREATE INDEX IF NOT EXISTS idx_subclasses_search_vector ON subclasses USING GIN(search_vector);

-- Triggers for updated_at
CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subclasses_updated_at
    BEFORE UPDATE ON subclasses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
