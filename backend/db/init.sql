-- =============================================================================
-- D&D Master - Database Schema Initialization Script
-- =============================================================================
-- Version: 2.0
-- Target: PostgreSQL 14+ with pgvector extension
-- Purpose: Initialize database schema for D&D campaign management
--
-- This script creates all tables, types, indexes, triggers, and views.
-- For content data (rules, classes, spells, etc.), run content.sql after this.
--
-- This script is idempotent - safe to run multiple times via DROP IF EXISTS
-- =============================================================================

-- =============================================================================
-- SECTION 1: Extensions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- SECTION 2: Drop Existing Objects (Idempotent)
-- =============================================================================
-- Drop tables in reverse dependency order to handle foreign key constraints

-- Campaign/Game management tables
DROP TABLE IF EXISTS campaign_invites CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS campaign_players CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- D&D Content junction tables
DROP TABLE IF EXISTS class_spells CASCADE;
DROP TABLE IF EXISTS rule_references CASCADE;

-- D&D Content tables (second-level dependencies)
DROP TABLE IF EXISTS feats CASCADE;
DROP TABLE IF EXISTS backgrounds CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS monsters CASCADE;
DROP TABLE IF EXISTS spells CASCADE;
DROP TABLE IF EXISTS class_features CASCADE;
DROP TABLE IF EXISTS subraces CASCADE;
DROP TABLE IF EXISTS subclasses CASCADE;
DROP TABLE IF EXISTS rules CASCADE;
DROP TABLE IF EXISTS sections CASCADE;

-- First-level dependency tables
DROP TABLE IF EXISTS races CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS rule_categories CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;

-- Independent tables
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS conditions CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS abilities CASCADE;

-- Drop ENUM types
DROP TYPE IF EXISTS event_type CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS invite_status CASCADE;
DROP TYPE IF EXISTS player_role CASCADE;
DROP TYPE IF EXISTS map_mode CASCADE;
DROP TYPE IF EXISTS dice_mode CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS size_category CASCADE;
DROP TYPE IF EXISTS item_type CASCADE;
DROP TYPE IF EXISTS rarity CASCADE;

-- =============================================================================
-- SECTION 3: ENUM Types
-- =============================================================================

-- Campaign/Game ENUM types
CREATE TYPE dice_mode AS ENUM ('rng', 'player_entered');
CREATE TYPE map_mode AS ENUM ('grid_2d', 'narrative_only');
CREATE TYPE player_role AS ENUM ('owner', 'player');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE session_status AS ENUM ('active', 'paused', 'ended');
CREATE TYPE event_type AS ENUM (
    'session_start',
    'session_end',
    'player_action',
    'ai_response',
    'dice_roll',
    'state_change',
    'combat_start',
    'combat_end',
    'turn_start',
    'turn_end'
);

-- D&D Content ENUM types
CREATE TYPE document_type AS ENUM (
    'rules',
    'handbook',
    'supplement',
    'adventure'
);

CREATE TYPE size_category AS ENUM (
    'Tiny',
    'Small',
    'Medium',
    'Large',
    'Huge',
    'Gargantuan'
);

CREATE TYPE item_type AS ENUM (
    'weapon',
    'armor',
    'adventuring_gear',
    'tool',
    'mount',
    'vehicle',
    'trade_good',
    'magic_item'
);

CREATE TYPE rarity AS ENUM (
    'common',
    'uncommon',
    'rare',
    'very_rare',
    'legendary',
    'artifact'
);

-- =============================================================================
-- SECTION 4: Core Application Tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 4.1 Profiles Table (user accounts)
-- ---------------------------------------------------------------------------

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_profiles_email ON profiles(email);

-- ---------------------------------------------------------------------------
-- 4.2 Campaigns Table
-- ---------------------------------------------------------------------------

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    dice_mode dice_mode NOT NULL DEFAULT 'rng',
    map_mode map_mode NOT NULL DEFAULT 'grid_2d',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_campaigns_owner ON campaigns(owner_id);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);

-- ---------------------------------------------------------------------------
-- 4.3 Campaign Players Table
-- ---------------------------------------------------------------------------

CREATE TABLE campaign_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role player_role NOT NULL DEFAULT 'player',
    invite_status invite_status NOT NULL DEFAULT 'pending',
    invited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    joined_at TIMESTAMPTZ,
    UNIQUE(campaign_id, user_id)
);

CREATE INDEX idx_campaign_players_campaign ON campaign_players(campaign_id);
CREATE INDEX idx_campaign_players_user ON campaign_players(user_id);
CREATE INDEX idx_campaign_players_status ON campaign_players(invite_status);

-- ---------------------------------------------------------------------------
-- 4.4 Characters Table
-- ---------------------------------------------------------------------------

CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    race TEXT NOT NULL,
    class TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 20),

    -- Core stats
    max_hp INTEGER NOT NULL,
    current_hp INTEGER NOT NULL,
    armor_class INTEGER NOT NULL,
    speed INTEGER NOT NULL DEFAULT 30,

    -- Ability scores (1-30 range per D&D rules)
    strength INTEGER NOT NULL CHECK (strength >= 1 AND strength <= 30),
    dexterity INTEGER NOT NULL CHECK (dexterity >= 1 AND dexterity <= 30),
    constitution INTEGER NOT NULL CHECK (constitution >= 1 AND constitution <= 30),
    intelligence INTEGER NOT NULL CHECK (intelligence >= 1 AND intelligence <= 30),
    wisdom INTEGER NOT NULL CHECK (wisdom >= 1 AND wisdom <= 30),
    charisma INTEGER NOT NULL CHECK (charisma >= 1 AND charisma <= 30),

    -- Additional data stored as JSON for flexibility
    skills JSONB DEFAULT '{}' NOT NULL,
    proficiencies JSONB DEFAULT '[]' NOT NULL,
    equipment JSONB DEFAULT '[]' NOT NULL,
    spells JSONB DEFAULT '[]' NOT NULL,
    features JSONB DEFAULT '[]' NOT NULL,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_characters_campaign ON characters(campaign_id);
CREATE INDEX idx_characters_user ON characters(user_id);

-- ---------------------------------------------------------------------------
-- 4.5 Sessions Table
-- ---------------------------------------------------------------------------

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT,
    status session_status NOT NULL DEFAULT 'active',
    version INTEGER NOT NULL DEFAULT 1,

    -- Narrative state (for AI context)
    narrative_summary TEXT,
    current_location TEXT,
    active_npcs JSONB DEFAULT '[]' NOT NULL,

    -- Combat state (null if not in combat)
    combat_state JSONB,

    -- Map state (null if narrative_only mode)
    map_state JSONB,

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ,
    last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_sessions_campaign ON sessions(campaign_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity DESC);

-- ---------------------------------------------------------------------------
-- 4.6 Events Table
-- ---------------------------------------------------------------------------

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    type event_type NOT NULL,
    actor_id UUID REFERENCES profiles(id),
    actor_name TEXT,

    -- Event payload (structure depends on type)
    content JSONB NOT NULL,

    -- Rule citations (for AI responses with mechanics)
    rule_citations JSONB DEFAULT '[]' NOT NULL,

    -- Sequential ordering within session
    sequence INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_session_sequence ON events(session_id, sequence);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_created_at ON events(created_at);

-- ---------------------------------------------------------------------------
-- 4.7 Campaign Invites Table
-- ---------------------------------------------------------------------------

CREATE TABLE campaign_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'dm')),
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ
);

CREATE INDEX idx_campaign_invites_campaign ON campaign_invites(campaign_id);
CREATE INDEX idx_campaign_invites_token ON campaign_invites(token);
CREATE INDEX idx_campaign_invites_email ON campaign_invites(email);

-- =============================================================================
-- SECTION 5: D&D Content Tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 5.1 Independent Tables (no foreign keys)
-- ---------------------------------------------------------------------------

-- Abilities: The six core ability scores
CREATE TABLE abilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(20) NOT NULL,
    abbreviation VARCHAR(3) NOT NULL UNIQUE,
    description TEXT,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills: Proficiencies that can be applied to ability checks
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    ability_id UUID REFERENCES abilities(id),
    description TEXT,
    slug VARCHAR(50) NOT NULL UNIQUE,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conditions: Status effects (Blinded, Poisoned, etc.)
CREATE TABLE conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    embedding VECTOR(1536),
    source_document TEXT,
    source_page INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents: Source document metadata
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL UNIQUE,
    doc_type document_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50),
    publication_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 5.2 First-Level Dependency Tables
-- ---------------------------------------------------------------------------

-- Chapters: Major divisions within a document
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id),
    chapter_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    page_start INT,
    page_end INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, chapter_number)
);

-- Rule Categories: Hierarchical grouping of rules
CREATE TABLE rule_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES rule_categories(id),
    sort_order INT DEFAULT 0,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes: Playable character classes
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    hit_die VARCHAR(10) NOT NULL,
    primary_ability TEXT,
    saving_throw_proficiencies TEXT[],
    armor_proficiencies TEXT[],
    weapon_proficiencies TEXT[],
    tool_proficiencies TEXT[],
    skill_choices TEXT[],
    skill_count INT DEFAULT 2,
    starting_equipment TEXT,
    multiclass_requirements TEXT,
    embedding VECTOR(1536),
    source_document TEXT,
    source_page INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Races: Playable character races
CREATE TABLE races (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    ability_score_increase JSONB,
    age_description TEXT,
    alignment_description TEXT,
    size size_category DEFAULT 'Medium',
    size_description TEXT,
    speed INT DEFAULT 30,
    speed_description TEXT,
    languages TEXT[],
    language_description TEXT,
    traits JSONB,
    embedding VECTOR(1536),
    source_document TEXT,
    source_page INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 5.3 Second-Level Dependency Tables
-- ---------------------------------------------------------------------------

-- Sections: Subsections within chapters
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES chapters(id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    content TEXT,
    page_number INT,
    sort_order INT DEFAULT 0,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rules: Individual game rules
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES rule_categories(id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    summary TEXT,
    keywords TEXT[],
    embedding VECTOR(1536),
    source_document TEXT,
    source_chapter TEXT,
    source_page INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subclasses: Specializations within a class
CREATE TABLE subclasses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    subclass_level INT NOT NULL DEFAULT 3,
    features JSONB,
    embedding VECTOR(1536),
    source_document TEXT,
    source_page INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subraces: Variants of a race
CREATE TABLE subraces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    race_id UUID NOT NULL REFERENCES races(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    ability_score_increase JSONB,
    traits JSONB,
    embedding VECTOR(1536),
    source_document TEXT,
    source_page INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class Features: Abilities gained at specific levels
CREATE TABLE class_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id),
    subclass_id UUID REFERENCES subclasses(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    level INT NOT NULL,
    description TEXT NOT NULL,
    is_optional BOOLEAN DEFAULT FALSE,
    prerequisites TEXT,
    embedding VECTOR(1536),
    source_document TEXT,
    source_page INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT class_or_subclass CHECK (class_id IS NOT NULL OR subclass_id IS NOT NULL)
);

-- Spells: Magical abilities
CREATE TABLE spells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    level INT NOT NULL CHECK (level >= 0 AND level <= 9),
    school VARCHAR(50) NOT NULL,
    casting_time VARCHAR(100) NOT NULL,
    range VARCHAR(100) NOT NULL,
    components VARCHAR(10) NOT NULL,
    materials TEXT,
    duration VARCHAR(100) NOT NULL,
    concentration BOOLEAN DEFAULT FALSE,
    ritual BOOLEAN DEFAULT FALSE,
    description TEXT NOT NULL,
    higher_levels TEXT,
    embedding VECTOR(1536),
    source_document TEXT,
    source_page INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monsters: Creatures with stat blocks
CREATE TABLE monsters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    size size_category NOT NULL,
    type VARCHAR(50) NOT NULL,
    subtype VARCHAR(100),
    alignment VARCHAR(50),
    armor_class INT NOT NULL,
    armor_type VARCHAR(100),
    hit_points INT NOT NULL,
    hit_dice VARCHAR(50),
    speed JSONB NOT NULL,
    ability_scores JSONB NOT NULL,
    saving_throws JSONB,
    skills JSONB,
    damage_vulnerabilities TEXT[],
    damage_resistances TEXT[],
    damage_immunities TEXT[],
    condition_immunities TEXT[],
    senses JSONB,
    languages TEXT[],
    challenge_rating VARCHAR(10) NOT NULL,
    challenge_rating_numeric DECIMAL(5,3),
    experience_points INT,
    traits JSONB,
    actions JSONB,
    bonus_actions JSONB,
    reactions JSONB,
    legendary_actions JSONB,
    lair_actions JSONB,
    regional_effects JSONB,
    description TEXT,
    embedding VECTOR(1536),
    source_document TEXT,
    source_page INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items: Equipment and magic items
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    item_type item_type NOT NULL,
    rarity rarity,
    description TEXT,
    cost VARCHAR(50),
    weight VARCHAR(50),
    -- Weapon-specific fields
    damage VARCHAR(50),
    damage_type VARCHAR(50),
    weapon_properties TEXT[],
    weapon_range VARCHAR(50),
    -- Armor-specific fields
    armor_class VARCHAR(50),
    armor_type VARCHAR(50),
    strength_requirement INT,
    stealth_disadvantage BOOLEAN,
    -- Magic item fields
    attunement_required BOOLEAN DEFAULT FALSE,
    attunement_requirements TEXT,
    magical_properties JSONB,
    embedding VECTOR(1536),
    source_document TEXT,
    source_page INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backgrounds: Character backgrounds
CREATE TABLE backgrounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    skill_proficiencies TEXT[],
    tool_proficiencies TEXT[],
    languages INT DEFAULT 0,
    equipment TEXT,
    feature_name VARCHAR(100),
    feature_description TEXT,
    suggested_characteristics TEXT,
    personality_traits TEXT[],
    ideals TEXT[],
    bonds TEXT[],
    flaws TEXT[],
    embedding VECTOR(1536),
    source_document TEXT,
    source_page INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feats: Optional character abilities
CREATE TABLE feats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    prerequisites TEXT,
    benefits JSONB,
    embedding VECTOR(1536),
    source_document TEXT,
    source_page INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 5.4 Junction Tables
-- ---------------------------------------------------------------------------

-- Rule References: Cross-references between rules
CREATE TABLE rule_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    target_rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    reference_type VARCHAR(50) DEFAULT 'related',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_rule_id, target_rule_id)
);

-- Class Spells: Which classes can cast which spells
CREATE TABLE class_spells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subclass_id UUID REFERENCES subclasses(id) ON DELETE CASCADE,
    spell_id UUID NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT class_or_subclass_spell CHECK (class_id IS NOT NULL OR subclass_id IS NOT NULL)
);

-- =============================================================================
-- SECTION 6: Triggers
-- =============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update session last_activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-increment event sequence within a session
CREATE OR REPLACE FUNCTION set_event_sequence()
RETURNS TRIGGER AS $$
BEGIN
    SELECT COALESCE(MAX(sequence), 0) + 1 INTO NEW.sequence
    FROM events
    WHERE session_id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_activity BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_session_activity();

CREATE TRIGGER set_events_sequence BEFORE INSERT ON events
    FOR EACH ROW EXECUTE FUNCTION set_event_sequence();

-- =============================================================================
-- SECTION 7: Indexes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 7.1 Full-Text Search Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_rules_content_fts ON rules USING GIN (to_tsvector('english', content));
CREATE INDEX idx_rules_title_fts ON rules USING GIN (to_tsvector('english', title));
CREATE INDEX idx_spells_description_fts ON spells USING GIN (to_tsvector('english', description));
CREATE INDEX idx_spells_name_fts ON spells USING GIN (to_tsvector('english', name));
CREATE INDEX idx_monsters_description_fts ON monsters USING GIN (to_tsvector('english', COALESCE(description, '')));
CREATE INDEX idx_monsters_name_fts ON monsters USING GIN (to_tsvector('english', name));
CREATE INDEX idx_items_description_fts ON items USING GIN (to_tsvector('english', COALESCE(description, '')));
CREATE INDEX idx_classes_description_fts ON classes USING GIN (to_tsvector('english', COALESCE(description, '')));
CREATE INDEX idx_races_description_fts ON races USING GIN (to_tsvector('english', COALESCE(description, '')));
CREATE INDEX idx_feats_description_fts ON feats USING GIN (to_tsvector('english', description));
CREATE INDEX idx_backgrounds_description_fts ON backgrounds USING GIN (to_tsvector('english', COALESCE(description, '')));
CREATE INDEX idx_conditions_description_fts ON conditions USING GIN (to_tsvector('english', description));
CREATE INDEX idx_class_features_description_fts ON class_features USING GIN (to_tsvector('english', description));
CREATE INDEX idx_sections_content_fts ON sections USING GIN (to_tsvector('english', COALESCE(content, '')));

-- ---------------------------------------------------------------------------
-- 7.2 Vector Similarity Indexes (ivfflat)
-- ---------------------------------------------------------------------------

CREATE INDEX idx_rules_embedding ON rules USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_spells_embedding ON spells USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_monsters_embedding ON monsters USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_items_embedding ON items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_classes_embedding ON classes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_races_embedding ON races USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_feats_embedding ON feats USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_backgrounds_embedding ON backgrounds USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_conditions_embedding ON conditions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_skills_embedding ON skills USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_class_features_embedding ON class_features USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_sections_embedding ON sections USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_rule_categories_embedding ON rule_categories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_subclasses_embedding ON subclasses USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_subraces_embedding ON subraces USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ---------------------------------------------------------------------------
-- 7.3 Foreign Key Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_skills_ability_id ON skills(ability_id);
CREATE INDEX idx_chapters_document_id ON chapters(document_id);
CREATE INDEX idx_sections_chapter_id ON sections(chapter_id);
CREATE INDEX idx_rules_category_id ON rules(category_id);
CREATE INDEX idx_rule_categories_parent_id ON rule_categories(parent_id);
CREATE INDEX idx_subclasses_class_id ON subclasses(class_id);
CREATE INDEX idx_subraces_race_id ON subraces(race_id);
CREATE INDEX idx_class_features_class_id ON class_features(class_id);
CREATE INDEX idx_class_features_subclass_id ON class_features(subclass_id);
CREATE INDEX idx_class_features_level ON class_features(level);
CREATE INDEX idx_rule_references_source ON rule_references(source_rule_id);
CREATE INDEX idx_rule_references_target ON rule_references(target_rule_id);
CREATE INDEX idx_class_spells_class_id ON class_spells(class_id);
CREATE INDEX idx_class_spells_subclass_id ON class_spells(subclass_id);
CREATE INDEX idx_class_spells_spell_id ON class_spells(spell_id);

-- ---------------------------------------------------------------------------
-- 7.4 Additional Query Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_spells_level ON spells(level);
CREATE INDEX idx_spells_school ON spells(school);
CREATE INDEX idx_monsters_challenge_rating ON monsters(challenge_rating);
CREATE INDEX idx_monsters_monster_type ON monsters(monster_type);
CREATE INDEX idx_items_item_type ON items(item_type);
CREATE INDEX idx_items_rarity ON items(rarity);

-- =============================================================================
-- SECTION 8: Views
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 8.1 Spell List View
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_spell_list AS
SELECT
    s.id,
    s.name,
    s.slug,
    s.level,
    s.school,
    s.casting_time,
    s.range,
    s.components,
    s.duration,
    s.concentration,
    s.ritual,
    s.source_document,
    s.source_page
FROM spells s
ORDER BY s.level, s.name;

-- ---------------------------------------------------------------------------
-- 8.2 Class Spell List View
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_class_spell_list AS
SELECT
    c.name AS class_name,
    c.slug AS class_slug,
    s.name AS spell_name,
    s.slug AS spell_slug,
    s.level AS spell_level,
    s.school,
    s.concentration,
    s.ritual
FROM class_spells cs
JOIN classes c ON cs.class_id = c.id
JOIN spells s ON cs.spell_id = s.id
ORDER BY c.name, s.level, s.name;

-- ---------------------------------------------------------------------------
-- 8.3 Monster by CR View
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_monster_by_cr AS
SELECT
    m.id,
    m.name,
    m.slug,
    m.size,
    m.monster_type,
    m.subtype,
    m.alignment,
    m.armor_class,
    m.hit_points,
    m.challenge_rating,
    m.experience_points,
    m.source_document,
    m.source_page
FROM monsters m
ORDER BY
    CASE
        WHEN m.challenge_rating = '0' THEN 0
        WHEN m.challenge_rating = '1/8' THEN 0.125
        WHEN m.challenge_rating = '1/4' THEN 0.25
        WHEN m.challenge_rating = '1/2' THEN 0.5
        ELSE CAST(m.challenge_rating AS DECIMAL)
    END,
    m.name;

-- =============================================================================
-- END OF SCHEMA INITIALIZATION
-- =============================================================================
-- To populate the database with D&D content, run content.sql after this script.
-- =============================================================================
