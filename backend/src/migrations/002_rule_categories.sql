-- Migration: 002_rule_categories
-- Description: Create rule_categories table for hierarchical rule organization
-- Date: 2026-01-30

CREATE TABLE IF NOT EXISTS rule_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES rule_categories(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rule_categories_parent_sort ON rule_categories(parent_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_rule_categories_slug ON rule_categories(slug);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rule_categories_updated_at
    BEFORE UPDATE ON rule_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
