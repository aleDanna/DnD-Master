-- =============================================================================
-- D&D Master - Consolidated Database Initialization Script
-- =============================================================================
-- Version: 1.0
-- Target: PostgreSQL 14+ with pgvector extension
-- Purpose: Initialize database schema for D&D campaign management with content
--
-- This script consolidates:
--   - User authentication tables (standalone, replacing Supabase auth)
--   - Campaign management tables (campaigns, players, sessions, events)
--   - D&D 5th Edition content (rules, classes, races, spells, monsters, etc.)
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
DROP TABLE IF EXISTS users CASCADE;

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
-- 4.1 Users Table (replaces Supabase auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_email ON users(email);

-- ---------------------------------------------------------------------------
-- 4.2 Campaigns Table
-- ---------------------------------------------------------------------------

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    actor_id UUID REFERENCES users(id),
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
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    at_higher_levels TEXT,
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
    monster_type VARCHAR(50) NOT NULL,
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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
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
-- SECTION 7: D&D Content Indexes
-- =============================================================================

-- Full-Text Search Indexes
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

-- Vector Similarity Indexes (ivfflat)
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

-- Foreign Key Indexes
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

-- Additional useful query indexes
CREATE INDEX idx_spells_level ON spells(level);
CREATE INDEX idx_spells_school ON spells(school);
CREATE INDEX idx_monsters_challenge_rating ON monsters(challenge_rating);
CREATE INDEX idx_monsters_monster_type ON monsters(monster_type);
CREATE INDEX idx_items_item_type ON items(item_type);
CREATE INDEX idx_items_rarity ON items(rarity);

-- =============================================================================
-- SECTION 8: Views
-- =============================================================================

-- Spell List View
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

-- Class Spell List View
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

-- Monster by CR View
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
-- SECTION 9: D&D Reference Data
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 9.1 Abilities
-- ---------------------------------------------------------------------------

INSERT INTO abilities (name, abbreviation, description, slug) VALUES
('Strength', 'STR', 'Measures physical power, athletic training, and the extent to which you can exert raw physical force.', 'strength'),
('Dexterity', 'DEX', 'Measures agility, reflexes, balance, and coordination.', 'dexterity'),
('Constitution', 'CON', 'Measures health, stamina, and vital force.', 'constitution'),
('Intelligence', 'INT', 'Measures mental acuity, accuracy of recall, and the ability to reason.', 'intelligence'),
('Wisdom', 'WIS', 'Measures perception, intuition, and insight.', 'wisdom'),
('Charisma', 'CHA', 'Measures force of personality, persuasiveness, and leadership.', 'charisma');

-- ---------------------------------------------------------------------------
-- 9.2 Skills
-- ---------------------------------------------------------------------------

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Acrobatics', id, 'Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation, such as when you''re trying to run across a sheet of ice, balance on a tightrope, or stay upright on a rocking ship''s deck.', 'acrobatics'
FROM abilities WHERE abbreviation = 'DEX';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Animal Handling', id, 'When there is any question whether you can calm down a domesticated animal, keep a mount from getting spooked, or intuit an animal''s intentions, the DM might call for a Wisdom (Animal Handling) check.', 'animal-handling'
FROM abilities WHERE abbreviation = 'WIS';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Arcana', id, 'Your Intelligence (Arcana) check measures your ability to recall lore about spells, magic items, eldritch symbols, magical traditions, the planes of existence, and the inhabitants of those planes.', 'arcana'
FROM abilities WHERE abbreviation = 'INT';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Athletics', id, 'Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming.', 'athletics'
FROM abilities WHERE abbreviation = 'STR';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Deception', id, 'Your Charisma (Deception) check determines whether you can convincingly hide the truth, either verbally or through your actions.', 'deception'
FROM abilities WHERE abbreviation = 'CHA';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'History', id, 'Your Intelligence (History) check measures your ability to recall lore about historical events, legendary people, ancient kingdoms, past disputes, recent wars, and lost civilizations.', 'history'
FROM abilities WHERE abbreviation = 'INT';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Insight', id, 'Your Wisdom (Insight) check decides whether you can determine the true intentions of a creature, such as when searching out a lie or predicting someone''s next move.', 'insight'
FROM abilities WHERE abbreviation = 'WIS';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Intimidation', id, 'When you attempt to influence someone through overt threats, hostile actions, and physical violence, the DM might ask you to make a Charisma (Intimidation) check.', 'intimidation'
FROM abilities WHERE abbreviation = 'CHA';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Investigation', id, 'When you look around for clues and make deductions based on those clues, you make an Intelligence (Investigation) check.', 'investigation'
FROM abilities WHERE abbreviation = 'INT';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Medicine', id, 'A Wisdom (Medicine) check lets you try to stabilize a dying companion or diagnose an illness.', 'medicine'
FROM abilities WHERE abbreviation = 'WIS';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Nature', id, 'Your Intelligence (Nature) check measures your ability to recall lore about terrain, plants and animals, the weather, and natural cycles.', 'nature'
FROM abilities WHERE abbreviation = 'INT';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Perception', id, 'Your Wisdom (Perception) check lets you spot, hear, or otherwise detect the presence of something. It measures your general awareness of your surroundings and the keenness of your senses.', 'perception'
FROM abilities WHERE abbreviation = 'WIS';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Performance', id, 'Your Charisma (Performance) check determines how well you can delight an audience with music, dance, acting, storytelling, or some other form of entertainment.', 'performance'
FROM abilities WHERE abbreviation = 'CHA';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Persuasion', id, 'When you attempt to influence someone or a group of people with tact, social graces, or good nature, the DM might ask you to make a Charisma (Persuasion) check.', 'persuasion'
FROM abilities WHERE abbreviation = 'CHA';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Religion', id, 'Your Intelligence (Religion) check measures your ability to recall lore about deities, rites and prayers, religious hierarchies, holy symbols, and the practices of secret cults.', 'religion'
FROM abilities WHERE abbreviation = 'INT';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Sleight of Hand', id, 'Whenever you attempt an act of legerdemain or manual trickery, such as planting something on someone else or concealing an object on your person, make a Dexterity (Sleight of Hand) check.', 'sleight-of-hand'
FROM abilities WHERE abbreviation = 'DEX';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Stealth', id, 'Make a Dexterity (Stealth) check when you attempt to conceal yourself from enemies, slink past guards, slip away without being noticed, or sneak up on someone without being seen or heard.', 'stealth'
FROM abilities WHERE abbreviation = 'DEX';

INSERT INTO skills (name, ability_id, description, slug)
SELECT 'Survival', id, 'The DM might ask you to make a Wisdom (Survival) check to follow tracks, hunt wild game, guide your group through frozen wastelands, identify signs that owlbears live nearby, predict the weather, or avoid quicksand.', 'survival'
FROM abilities WHERE abbreviation = 'WIS';

-- ---------------------------------------------------------------------------
-- 9.3 Conditions
-- ---------------------------------------------------------------------------

INSERT INTO conditions (name, description, slug, source_document, source_page) VALUES
('Blinded', 'A blinded creature can''t see and automatically fails any ability check that requires sight.
The creature''s attack rolls have disadvantage, and attack rolls against the creature have advantage.', 'blinded', 'rules.txt', 290),

('Charmed', 'A charmed creature can''t attack the charmer or target the charmer with harmful abilities or magical effects.
The charmer has advantage on any ability check to interact socially with the creature.', 'charmed', 'rules.txt', 290),

('Deafened', 'A deafened creature can''t hear and automatically fails any ability check that requires hearing.', 'deafened', 'rules.txt', 290),

('Exhaustion', 'Some special abilities and environmental hazards, such as starvation and the long-term effects of freezing or scorching temperatures, can lead to a special condition called exhaustion. Exhaustion is measured in six levels.

Level 1: Disadvantage on ability checks
Level 2: Speed halved
Level 3: Disadvantage on attack rolls and saving throws
Level 4: Hit point maximum halved
Level 5: Speed reduced to 0
Level 6: Death

If an already exhausted creature suffers another effect that causes exhaustion, its current level of exhaustion increases by the amount specified in the effect''s description.

A creature suffers the effect of its current level of exhaustion as well as all lower levels.

An effect that removes exhaustion reduces its level as specified in the effect''s description, with all exhaustion effects ending if a creature''s exhaustion level is reduced below 1.

Finishing a long rest reduces a creature''s exhaustion level by 1, provided that the creature has also ingested some food and drink.', 'exhaustion', 'rules.txt', 291),

('Frightened', 'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.
The creature can''t willingly move closer to the source of its fear.', 'frightened', 'rules.txt', 290),

('Grappled', 'A grappled creature''s speed becomes 0, and it can''t benefit from any bonus to its speed.
The condition ends if the grappler is incapacitated.
The condition also ends if an effect removes the grappled creature from the reach of the grappler or grappling effect, such as when a creature is hurled away by the thunderwave spell.', 'grappled', 'rules.txt', 290),

('Incapacitated', 'An incapacitated creature can''t take actions or reactions.', 'incapacitated', 'rules.txt', 290),

('Invisible', 'An invisible creature is impossible to see without the aid of magic or a special sense. For the purpose of hiding, the creature is heavily obscured. The creature''s location can be detected by any noise it makes or any tracks it leaves.
Attack rolls against the creature have disadvantage, and the creature''s attack rolls have advantage.', 'invisible', 'rules.txt', 291),

('Paralyzed', 'A paralyzed creature is incapacitated and can''t move or speak.
The creature automatically fails Strength and Dexterity saving throws.
Attack rolls against the creature have advantage.
Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.', 'paralyzed', 'rules.txt', 291),

('Petrified', 'A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging.
The creature is incapacitated, can''t move or speak, and is unaware of its surroundings.
Attack rolls against the creature have advantage.
The creature automatically fails Strength and Dexterity saving throws.
The creature has resistance to all damage.
The creature is immune to poison and disease, although a poison or disease already in its system is suspended, not neutralized.', 'petrified', 'rules.txt', 291),

('Poisoned', 'A poisoned creature has disadvantage on attack rolls and ability checks.', 'poisoned', 'rules.txt', 292),

('Prone', 'A prone creature''s only movement option is to crawl, unless it stands up and thereby ends the condition.
The creature has disadvantage on attack rolls.
An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage.', 'prone', 'rules.txt', 292),

('Restrained', 'A restrained creature''s speed becomes 0, and it can''t benefit from any bonus to its speed.
Attack rolls against the creature have advantage, and the creature''s attack rolls have disadvantage.
The creature has disadvantage on Dexterity saving throws.', 'restrained', 'rules.txt', 292),

('Stunned', 'A stunned creature is incapacitated, can''t move, and can speak only falteringly.
The creature automatically fails Strength and Dexterity saving throws.
Attack rolls against the creature have advantage.', 'stunned', 'rules.txt', 292),

('Unconscious', 'An unconscious creature is incapacitated, can''t move or speak, and is unaware of its surroundings.
The creature drops whatever it''s holding and falls prone.
The creature automatically fails Strength and Dexterity saving throws.
Attack rolls against the creature have advantage.
Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.', 'unconscious', 'rules.txt', 292);

-- ---------------------------------------------------------------------------
-- 9.4 Documents
-- ---------------------------------------------------------------------------

INSERT INTO documents (filename, doc_type, title, description, version, publication_date) VALUES
('rules.txt', 'rules', 'D&D Basic Rules', 'The Basic Rules for Dungeons & Dragons is a free PDF that covers the core of the tabletop game. It includes information on the four main classes (Cleric, Fighter, Rogue, Wizard), the four most common races (Dwarf, Elf, Halfling, Human), and the equipment, spells, and monsters needed to run a game.', 'v1.0', '2018-11-01'),
('handbook.txt', 'handbook', 'Player''s Handbook', 'The Player''s Handbook is the essential reference for every Dungeons & Dragons roleplayer. It contains rules for character creation and advancement, backgrounds and skills, exploration and combat, equipment, spells, and much more.', '5th Edition', '2014-08-19');

-- =============================================================================
-- END OF SCHEMA CREATION
-- =============================================================================
-- Additional D&D content data (rules, classes, races, spells, monsters, items,
-- feats, backgrounds) should be loaded from a separate seed file or the original
-- migrations/001-dnd-content.sql data sections.
-- =============================================================================
