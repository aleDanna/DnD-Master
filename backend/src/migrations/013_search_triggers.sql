-- Migration: 013_search_triggers
-- Description: Create search vector triggers for all content tables
-- Date: 2026-01-30

-- Rules search vector trigger
CREATE OR REPLACE FUNCTION update_rules_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rules_search_vector
    BEFORE INSERT OR UPDATE ON rules
    FOR EACH ROW
    EXECUTE FUNCTION update_rules_search_vector();

-- Classes search vector trigger
CREATE OR REPLACE FUNCTION update_classes_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.primary_ability, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_classes_search_vector
    BEFORE INSERT OR UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_classes_search_vector();

-- Subclasses search vector trigger
CREATE OR REPLACE FUNCTION update_subclasses_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subclasses_search_vector
    BEFORE INSERT OR UPDATE ON subclasses
    FOR EACH ROW
    EXECUTE FUNCTION update_subclasses_search_vector();

-- Races search vector trigger
CREATE OR REPLACE FUNCTION update_races_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.size, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_races_search_vector
    BEFORE INSERT OR UPDATE ON races
    FOR EACH ROW
    EXECUTE FUNCTION update_races_search_vector();

-- Subraces search vector trigger
CREATE OR REPLACE FUNCTION update_subraces_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subraces_search_vector
    BEFORE INSERT OR UPDATE ON subraces
    FOR EACH ROW
    EXECUTE FUNCTION update_subraces_search_vector();

-- Spells search vector trigger
CREATE OR REPLACE FUNCTION update_spells_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.school, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.higher_levels, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_spells_search_vector
    BEFORE INSERT OR UPDATE ON spells
    FOR EACH ROW
    EXECUTE FUNCTION update_spells_search_vector();

-- Monsters search vector trigger
CREATE OR REPLACE FUNCTION update_monsters_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.type, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.subtype, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_monsters_search_vector
    BEFORE INSERT OR UPDATE ON monsters
    FOR EACH ROW
    EXECUTE FUNCTION update_monsters_search_vector();

-- Items search vector trigger
CREATE OR REPLACE FUNCTION update_items_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.type, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.rarity, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_items_search_vector
    BEFORE INSERT OR UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_items_search_vector();

-- Backgrounds search vector trigger
CREATE OR REPLACE FUNCTION update_backgrounds_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.feature_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.feature_description, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_backgrounds_search_vector
    BEFORE INSERT OR UPDATE ON backgrounds
    FOR EACH ROW
    EXECUTE FUNCTION update_backgrounds_search_vector();

-- Feats search vector trigger
CREATE OR REPLACE FUNCTION update_feats_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.prerequisites, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_feats_search_vector
    BEFORE INSERT OR UPDATE ON feats
    FOR EACH ROW
    EXECUTE FUNCTION update_feats_search_vector();

-- Conditions search vector trigger
CREATE OR REPLACE FUNCTION update_conditions_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conditions_search_vector
    BEFORE INSERT OR UPDATE ON conditions
    FOR EACH ROW
    EXECUTE FUNCTION update_conditions_search_vector();

-- Skills search vector trigger
CREATE OR REPLACE FUNCTION update_skills_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.ability, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_skills_search_vector
    BEFORE INSERT OR UPDATE ON skills
    FOR EACH ROW
    EXECUTE FUNCTION update_skills_search_vector();
