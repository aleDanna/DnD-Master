-- =============================================================================
-- D&D Content SQL Migration Script
-- =============================================================================
-- Version: 1.0
-- Target: PostgreSQL 18 with pgvector extension
-- Purpose: Create schema and populate D&D 5th Edition content for AI Dungeon Master
-- Source Documents: docs/rules.txt, docs/handbook.txt
--
-- This script is idempotent - safe to run multiple times via DROP IF EXISTS CASCADE
-- Embeddings are set to NULL - populated later by separate embedding process
-- =============================================================================

-- =============================================================================
-- SECTION 1: Extensions
-- =============================================================================
-- Required PostgreSQL extensions for UUID generation and vector similarity search

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- =============================================================================
-- SECTION 2: Drop Existing Objects (Idempotent)
-- =============================================================================
-- Drop tables in reverse dependency order to handle foreign key constraints

-- Junction tables first
DROP TABLE IF EXISTS class_spells CASCADE;
DROP TABLE IF EXISTS rule_references CASCADE;

-- Content tables (second-level dependencies)
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
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS size_category CASCADE;
DROP TYPE IF EXISTS item_type CASCADE;
DROP TYPE IF EXISTS rarity CASCADE;

-- =============================================================================
-- SECTION 3: ENUM Types
-- =============================================================================
-- Custom enumeration types for constrained values

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
-- SECTION 4: Tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 4.1 Independent Tables (no foreign keys)
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
-- 4.2 First-Level Dependency Tables
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
-- 4.3 Second-Level Dependency Tables
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
-- 4.4 Junction Tables
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
-- SECTION 5: Indexes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 5.1 Full-Text Search Indexes
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
-- 5.2 Vector Similarity Indexes (ivfflat)
-- ---------------------------------------------------------------------------
-- Note: These indexes work best with populated data; lists parameter should be ~sqrt(rows)
-- Using lists=100 as reasonable default for expected data volume

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
-- 5.3 Unique Indexes (already covered by UNIQUE constraints, explicit for clarity)
-- ---------------------------------------------------------------------------

-- Slug uniqueness is enforced by UNIQUE constraints in table definitions

-- ---------------------------------------------------------------------------
-- 5.4 Foreign Key Indexes (for query performance)
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

-- Additional useful query indexes
CREATE INDEX idx_spells_level ON spells(level);
CREATE INDEX idx_spells_school ON spells(school);
CREATE INDEX idx_monsters_challenge_rating ON monsters(challenge_rating);
CREATE INDEX idx_monsters_monster_type ON monsters(monster_type);
CREATE INDEX idx_items_item_type ON items(item_type);
CREATE INDEX idx_items_rarity ON items(rarity);

-- =============================================================================
-- SECTION 6: Reference Data
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 6.1 Abilities
-- ---------------------------------------------------------------------------

INSERT INTO abilities (name, abbreviation, description, slug) VALUES
('Strength', 'STR', 'Measures physical power, athletic training, and the extent to which you can exert raw physical force.', 'strength'),
('Dexterity', 'DEX', 'Measures agility, reflexes, balance, and coordination.', 'dexterity'),
('Constitution', 'CON', 'Measures health, stamina, and vital force.', 'constitution'),
('Intelligence', 'INT', 'Measures mental acuity, accuracy of recall, and the ability to reason.', 'intelligence'),
('Wisdom', 'WIS', 'Measures perception, intuition, and insight.', 'wisdom'),
('Charisma', 'CHA', 'Measures force of personality, persuasiveness, and leadership.', 'charisma');

-- ---------------------------------------------------------------------------
-- 6.2 Skills
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
-- 6.3 Conditions
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
-- 6.4 Documents
-- ---------------------------------------------------------------------------

INSERT INTO documents (filename, doc_type, title, description, version, publication_date) VALUES
('rules.txt', 'rules', 'D&D Basic Rules', 'The Basic Rules for Dungeons & Dragons is a free PDF that covers the core of the tabletop game. It includes information on the four main classes (Cleric, Fighter, Rogue, Wizard), the four most common races (Dwarf, Elf, Halfling, Human), and the equipment, spells, and monsters needed to run a game.', 'v1.0', '2018-11-01'),
('handbook.txt', 'handbook', 'Player''s Handbook', 'The Player''s Handbook is the essential reference for every Dungeons & Dragons roleplayer. It contains rules for character creation and advancement, backgrounds and skills, exploration and combat, equipment, spells, and much more.', '5th Edition', '2014-08-19');

-- =============================================================================
-- SECTION 7: Rules Content
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 7.1 Rule Categories
-- ---------------------------------------------------------------------------

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order) VALUES
('Using Ability Scores', 'using-ability-scores', 'Rules for ability checks, skills, saving throws, and contests', NULL, 1),
('Adventuring', 'adventuring', 'Rules for travel, exploration, and the environment', NULL, 2),
('Combat', 'combat', 'Rules for combat encounters, actions, and damage', NULL, 3),
('Spellcasting', 'spellcasting', 'Rules for casting spells and magical effects', NULL, 4);

-- Sub-categories for Ability Scores
INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Ability Checks', 'ability-checks', 'Rules for making ability checks and determining difficulty', id, 1
FROM rule_categories WHERE slug = 'using-ability-scores';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Skills', 'skills', 'Using skill proficiencies with ability checks', id, 2
FROM rule_categories WHERE slug = 'using-ability-scores';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Saving Throws', 'saving-throws', 'Resisting spells, traps, and harmful effects', id, 3
FROM rule_categories WHERE slug = 'using-ability-scores';

-- Sub-categories for Adventuring
INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Movement', 'movement', 'Rules for travel pace, climbing, swimming, and jumping', id, 1
FROM rule_categories WHERE slug = 'adventuring';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Environment', 'environment', 'Rules for vision, light, hazards, and survival', id, 2
FROM rule_categories WHERE slug = 'adventuring';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Resting', 'resting', 'Rules for short and long rests', id, 3
FROM rule_categories WHERE slug = 'adventuring';

-- Sub-categories for Combat
INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Actions in Combat', 'actions-in-combat', 'Standard actions available during combat', id, 1
FROM rule_categories WHERE slug = 'combat';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Making an Attack', 'making-an-attack', 'Rules for attack rolls, modifiers, and critical hits', id, 2
FROM rule_categories WHERE slug = 'combat';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Cover', 'cover', 'Rules for half, three-quarters, and total cover', id, 3
FROM rule_categories WHERE slug = 'combat';

INSERT INTO rule_categories (name, slug, description, parent_id, sort_order)
SELECT 'Damage and Healing', 'damage-and-healing', 'Rules for damage types, hit points, and healing', id, 4
FROM rule_categories WHERE slug = 'combat';

-- ---------------------------------------------------------------------------
-- 7.2 Rules
-- ---------------------------------------------------------------------------

-- Ability Check Rules
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Ability Checks', 'ability-checks',
'An ability check tests a character''s or monster''s innate talent and training in an effort to overcome a challenge. The DM calls for an ability check when a character or monster attempts an action (other than an attack) that has a chance of failure. When the outcome is uncertain, the dice determine the results.

For every ability check, the DM decides which of the six abilities is relevant to the task at hand and the difficulty of the task, represented by a Difficulty Class. The more difficult a task, the higher its DC.

To make an ability check, roll a d20 and add the relevant ability modifier. As with other d20 rolls, apply bonuses and penalties, and compare the total to the DC. If the total equals or exceeds the DC, the ability check is a success—the creature overcomes the challenge at hand. Otherwise, it''s a failure, which means the character or monster makes no progress toward the objective or makes progress combined with a setback determined by the DM.

Typical Difficulty Classes:
- Very Easy: DC 5
- Easy: DC 10
- Medium: DC 15
- Hard: DC 20
- Very Hard: DC 25
- Nearly Impossible: DC 30',
'Roll d20 + ability modifier vs DC to determine success or failure',
ARRAY['ability check', 'dc', 'difficulty class', 'd20'],
'rules.txt', 'Chapter 7', 60
FROM rule_categories WHERE slug = 'ability-checks';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Passive Checks', 'passive-checks',
'A passive check is a special kind of ability check that doesn''t involve any die rolls. Such a check can represent the average result for a task done repeatedly, such as searching for secret doors over and over again, or can be used when the DM wants to secretly determine whether the characters succeed at something without rolling dice, such as noticing a hidden monster.

Here''s how to determine a character''s total for a passive check:

10 + all modifiers that normally apply to the check

If the character has advantage on the check, add 5. For disadvantage, subtract 5. The game refers to a passive check total as a score.

For example, if a 1st-level character has a Wisdom of 15 and proficiency in Perception, he or she has a passive Wisdom (Perception) score of 14.',
'Passive check = 10 + modifiers; +5 for advantage, -5 for disadvantage',
ARRAY['passive check', 'perception', 'passive perception'],
'rules.txt', 'Chapter 7', 62
FROM rule_categories WHERE slug = 'ability-checks';

-- Saving Throw Rules
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Saving Throws', 'saving-throws-rule',
'A saving throw—also called a save—represents an attempt to resist a spell, a trap, a poison, a disease, or a similar threat. You don''t normally decide to make a saving throw; you are forced to make one because your character or monster is at risk of harm.

To make a saving throw, roll a d20 and add the appropriate ability modifier. For example, you use your Dexterity modifier for a Dexterity saving throw.

A saving throw can be modified by a situational bonus or penalty and can be affected by advantage and disadvantage, as determined by the DM.

Each class gives proficiency in at least two saving throws. The wizard, for example, is proficient in Intelligence saves. As with skill proficiencies, proficiency in a saving throw lets a character add his or her proficiency bonus to saving throws made using a particular ability score. Some monsters have saving throw proficiencies as well.

The Difficulty Class for a saving throw is determined by the effect that causes it. For example, the DC for a saving throw allowed by a spell is determined by the caster''s spellcasting ability and proficiency bonus.',
'Roll d20 + ability modifier to resist harmful effects',
ARRAY['saving throw', 'save', 'dc'],
'rules.txt', 'Chapter 7', 63
FROM rule_categories WHERE slug = 'saving-throws';

-- Combat Rules
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Attack Rolls', 'attack-rolls',
'When you make an attack, your attack roll determines whether the attack hits or misses. To make an attack roll, roll a d20 and add the appropriate modifiers. If the total of the roll plus modifiers equals or exceeds the target''s Armor Class (AC), the attack hits.

Modifiers to the Roll:
When a character makes an attack roll, the two most common modifiers to the roll are an ability modifier and the character''s proficiency bonus. When a monster makes an attack roll, it uses whatever modifier is provided in its stat block.

Ability Modifier: The ability modifier used for a melee weapon attack is Strength, and the ability modifier used for a ranged weapon attack is Dexterity. Weapons that have the finesse or thrown property break this rule.

Proficiency Bonus: You add your proficiency bonus to your attack roll when you attack using a weapon with which you have proficiency, as well as when you attack with a spell.

Rolling 1 or 20: If the d20 roll for an attack is a 20, the attack hits regardless of any modifiers or the target''s AC. This is called a critical hit. If the d20 roll for an attack is a 1, the attack misses regardless of any modifiers or the target''s AC.',
'd20 + ability modifier + proficiency bonus vs AC; 20 = critical hit, 1 = automatic miss',
ARRAY['attack roll', 'ac', 'armor class', 'critical hit', 'natural 20'],
'rules.txt', 'Chapter 9', 73
FROM rule_categories WHERE slug = 'making-an-attack';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Opportunity Attacks', 'opportunity-attacks',
'In a fight, everyone is constantly watching for a chance to strike an enemy who is fleeing or passing by. Such a strike is called an opportunity attack.

You can make an opportunity attack when a hostile creature that you can see moves out of your reach. To make the opportunity attack, you use your reaction to make one melee attack against the provoking creature. The attack occurs right before the creature leaves your reach.

You can avoid provoking an opportunity attack by taking the Disengage action. You also don''t provoke an opportunity attack when you teleport or when someone or something moves you without using your movement, action, or reaction. For example, you don''t provoke an opportunity attack if an explosion hurls you out of a foe''s reach or if gravity causes you to fall past an enemy.',
'Use reaction to make melee attack when hostile creature leaves your reach',
ARRAY['opportunity attack', 'reaction', 'disengage'],
'rules.txt', 'Chapter 9', 74
FROM rule_categories WHERE slug = 'actions-in-combat';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Cover', 'cover-rule',
'Walls, trees, creatures, and other obstacles can provide cover during combat, making a target more difficult to harm with an attack. A target can benefit from cover only when an attack or other effect originates on the opposite side of the cover.

There are three degrees of cover:

Half Cover: A target with half cover has a +2 bonus to AC and Dexterity saving throws. A target has half cover if an obstacle blocks at least half of its body. The obstacle might be a low wall, a large piece of furniture, a narrow tree trunk, or a creature, whether that creature is an enemy or a friend.

Three-Quarters Cover: A target with three-quarters cover has a +5 bonus to AC and Dexterity saving throws. A target has three-quarters cover if about three-quarters of it is covered by an obstacle. The obstacle might be a portcullis, an arrow slit, or a thick tree trunk.

Total Cover: A target with total cover can''t be targeted directly by an attack or a spell, although some spells can reach such a target by including it in an area of effect. A target has total cover if it is completely concealed by an obstacle.',
'Half cover: +2 AC/DEX saves; Three-quarters: +5 AC/DEX saves; Total: cannot be targeted',
ARRAY['cover', 'half cover', 'three-quarters cover', 'total cover', 'ac bonus'],
'rules.txt', 'Chapter 9', 75
FROM rule_categories WHERE slug = 'cover';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Damage and Healing', 'damage-and-healing-rule',
'Injury and the risk of death are constant companions of those who explore the worlds of D&D. The thrust of a sword, a well-placed arrow, or a blast of flame from a fireball spell all have the potential to damage, or even kill, the hardiest of creatures.

Hit Points: Hit points represent a combination of physical and mental durability, the will to live, and luck. Creatures with more hit points are more difficult to kill. Those with fewer hit points are more fragile.

A creature''s current hit points (usually just called hit points) can be any number from the creature''s hit point maximum down to 0. This number changes frequently as a creature takes damage or receives healing.

Whenever a creature takes damage, that damage is subtracted from its hit points. The loss of hit points has no effect on a creature''s capabilities until the creature drops to 0 hit points.

Damage Rolls: Each weapon, spell, and harmful monster ability specifies the damage it deals. You roll the damage die or dice, add any modifiers, and apply the damage to your target. Magic weapons, special abilities, and other factors can grant a bonus to damage.

Critical Hits: When you score a critical hit, you get to roll extra dice for the attack''s damage against the target. Roll all of the attack''s damage dice twice and add them together. Then add any relevant modifiers as normal.',
'Hit points represent durability; critical hits roll damage dice twice',
ARRAY['damage', 'hit points', 'hp', 'healing', 'critical hit', 'damage roll'],
'rules.txt', 'Chapter 9', 76
FROM rule_categories WHERE slug = 'damage-and-healing';

-- Movement and Environment Rules
INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Travel Pace', 'travel-pace',
'While traveling, a group of adventurers can move at a normal, fast, or slow pace. A fast pace makes characters less perceptive, while a slow pace makes it possible to sneak around and to search an area more carefully.

Travel Pace:
- Fast: 400 feet per minute, 4 miles per hour, 30 miles per day. Effect: −5 penalty to passive Wisdom (Perception) scores.
- Normal: 300 feet per minute, 3 miles per hour, 24 miles per day. Effect: —
- Slow: 200 feet per minute, 2 miles per hour, 18 miles per day. Effect: Able to use stealth.

Difficult Terrain: The travel speeds given assume relatively simple terrain: roads, open plains, or clear dungeon corridors. But adventurers often face dense forests, deep swamps, rubble-filled ruins, steep mountains, and ice-covered ground—all considered difficult terrain. You move at half speed in difficult terrain—moving 1 foot in difficult terrain costs 2 feet of speed.',
'Fast: 4 mph, -5 Perception; Normal: 3 mph; Slow: 2 mph, can stealth. Difficult terrain = half speed.',
ARRAY['travel pace', 'movement', 'difficult terrain', 'speed'],
'rules.txt', 'Chapter 8', 66
FROM rule_categories WHERE slug = 'movement';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Jumping', 'jumping',
'Your Strength determines how far you can jump.

Long Jump: When you make a long jump, you cover a number of feet up to your Strength score if you move at least 10 feet on foot immediately before the jump. When you make a standing long jump, you can leap only half that distance. Either way, each foot you clear on the jump costs a foot of movement.

This rule assumes that the height of your jump doesn''t matter, such as a jump across a stream or chasm. At your DM''s option, you must succeed on a DC 10 Strength (Athletics) check to clear a low obstacle (no taller than a quarter of the jump''s distance), such as a hedge or low wall. Otherwise, you hit it.

When you land in difficult terrain, you must succeed on a DC 10 Dexterity (Acrobatics) check to land on your feet. Otherwise, you land prone.

High Jump: When you make a high jump, you leap into the air a number of feet equal to 3 + your Strength modifier if you move at least 10 feet on foot immediately before the jump. When you make a standing high jump, you can jump only half that distance. Either way, each foot you clear on the jump costs a foot of movement.',
'Long jump = Strength score in feet (with 10 ft running start). High jump = 3 + STR modifier feet.',
ARRAY['jumping', 'long jump', 'high jump', 'athletics'],
'rules.txt', 'Chapter 8', 67
FROM rule_categories WHERE slug = 'movement';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Falling', 'falling',
'A fall from a great height is one of the most common hazards facing an adventurer. At the end of a fall, a creature takes 1d6 bludgeoning damage for every 10 feet it fell, to a maximum of 20d6. The creature lands prone, unless it avoids taking damage from the fall.',
'1d6 bludgeoning damage per 10 feet fallen (max 20d6), land prone',
ARRAY['falling', 'fall damage', 'hazard'],
'rules.txt', 'Chapter 8', 69
FROM rule_categories WHERE slug = 'environment';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Vision and Light', 'vision-and-light',
'The most fundamental tasks of adventuring—noticing danger, finding hidden objects, hitting an enemy in combat, and targeting a spell, to name just a few—rely heavily on a character''s ability to see.

Bright Light: Bright light lets most creatures see normally. Even gloomy days provide bright light, as do torches, lanterns, fires, and other sources of illumination within a specific radius.

Dim Light: Dim light, also called shadows, creates a lightly obscured area. An area of dim light is usually a boundary between a source of bright light, such as a torch, and surrounding darkness. The soft light of twilight and dawn also counts as dim light. A particularly brilliant full moon might bathe the land in dim light.

Darkness: Darkness creates a heavily obscured area. Characters face darkness outdoors at night (even most moonlit nights), within the confines of an unlit dungeon or a subterranean vault, or in an area of magical darkness.

A creature in a lightly obscured area has disadvantage on Wisdom (Perception) checks that rely on sight. A heavily obscured area—such as darkness, opaque fog, or dense foliage—blocks vision entirely. A creature effectively suffers from the blinded condition when trying to see something in that area.',
'Bright light = normal vision; Dim light = disadvantage on Perception; Darkness = blinded',
ARRAY['vision', 'light', 'darkness', 'bright light', 'dim light', 'obscured'],
'rules.txt', 'Chapter 8', 68
FROM rule_categories WHERE slug = 'environment';

INSERT INTO rules (category_id, title, slug, content, summary, keywords, source_document, source_chapter, source_page)
SELECT id, 'Resting', 'resting-rule',
'Heroic though they might be, adventurers can''t spend every hour of the day in the thick of exploration, social interaction, and combat. They need rest—time to sleep and eat, tend their wounds, refresh their minds and spirits for spellcasting, and brace themselves for further adventure.

Short Rest: A short rest is a period of downtime, at least 1 hour long, during which a character does nothing more strenuous than eating, drinking, reading, and tending to wounds. A character can spend one or more Hit Dice at the end of a short rest, up to the character''s maximum number of Hit Dice, which is equal to the character''s level. For each Hit Die spent in this way, the player rolls the die and adds the character''s Constitution modifier to it. The character regains hit points equal to the total. The player can decide to spend an additional Hit Die after each roll.

Long Rest: A long rest is a period of extended downtime, at least 8 hours long, during which a character sleeps for at least 6 hours and performs no more than 2 hours of light activity, such as reading, talking, eating, or standing watch. If the rest is interrupted by a period of strenuous activity—at least 1 hour of walking, fighting, casting spells, or similar adventuring activity—the characters must begin the rest again to gain any benefit from it. At the end of a long rest, a character regains all lost hit points. The character also regains spent Hit Dice, up to a number of dice equal to half of the character''s total number of them. A character can''t benefit from more than one long rest in a 24-hour period.',
'Short rest (1+ hr): spend Hit Dice to heal. Long rest (8 hrs): regain all HP and half Hit Dice.',
ARRAY['rest', 'short rest', 'long rest', 'hit dice', 'healing'],
'rules.txt', 'Chapter 8', 70
FROM rule_categories WHERE slug = 'resting';

-- =============================================================================
-- SECTION 8: Player Content
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 8.1 Classes and Subclasses
-- ---------------------------------------------------------------------------

-- Core Classes from Basic Rules
INSERT INTO classes (name, slug, description, hit_die, primary_ability, saving_throw_proficiencies, armor_proficiencies, weapon_proficiencies, tool_proficiencies, skill_choices, skill_count, starting_equipment, source_document, source_page) VALUES
('Cleric', 'cleric', 'A priestly champion who wields divine magic in service of a higher power. Clerics are intermediaries between the mortal world and the distant planes of the gods. As varied as the gods they serve, clerics strive to embody the handiwork of their deities.', 'd8', 'Wisdom', ARRAY['Wisdom', 'Charisma'], ARRAY['Light armor', 'Medium armor', 'Shields'], ARRAY['Simple weapons'], NULL, ARRAY['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'], 2, 'A mace or warhammer, scale mail or leather armor or chain mail, a light crossbow and 20 bolts or any simple weapon, a priest''s pack or an explorer''s pack, a shield and a holy symbol', 'rules.txt', 20),

('Fighter', 'fighter', 'A master of martial combat, skilled with a variety of weapons and armor. Fighters learn the basics of all combat styles. Every fighter can swing an axe, fence with a rapier, wield a longsword or a greatsword, use a bow, and even trap foes in a net with some degree of skill.', 'd10', 'Strength or Dexterity', ARRAY['Strength', 'Constitution'], ARRAY['All armor', 'Shields'], ARRAY['Simple weapons', 'Martial weapons'], NULL, ARRAY['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'], 2, 'Chain mail or leather armor with longbow and 20 arrows, a martial weapon and a shield or two martial weapons, a light crossbow and 20 bolts or two handaxes, a dungeoneer''s pack or an explorer''s pack', 'rules.txt', 24),

('Rogue', 'rogue', 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies. Rogues devote as much effort to mastering the use of a variety of skills as they do to perfecting their combat abilities, giving them a broad expertise that few other characters can match.', 'd8', 'Dexterity', ARRAY['Dexterity', 'Intelligence'], ARRAY['Light armor'], ARRAY['Simple weapons', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'], ARRAY['Thieves'' tools'], ARRAY['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'], 4, 'A rapier or a shortsword, a shortbow and quiver of 20 arrows or a shortsword, a burglar''s pack or a dungeoneer''s pack or an explorer''s pack, leather armor, two daggers, and thieves'' tools', 'rules.txt', 26),

('Wizard', 'wizard', 'A scholarly magic-user capable of manipulating the structures of reality. Drawing on the subtle weave of magic that permeates the cosmos, wizards cast spells of explosive fire, arcing lightning, subtle deception, and brute-force mind control.', 'd6', 'Intelligence', ARRAY['Intelligence', 'Wisdom'], NULL, ARRAY['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'], NULL, ARRAY['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'], 2, 'A quarterstaff or a dagger, a component pouch or an arcane focus, a scholar''s pack or an explorer''s pack, and a spellbook', 'rules.txt', 29);

-- Subclasses for Core Classes
INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Life Domain', 'life-domain', 'The Life domain focuses on the vibrant positive energy—one of the fundamental forces of the universe—that sustains all life. The gods of life promote vitality and health through healing the sick and wounded, caring for those in need, and driving away the forces of death and undeath.', 1, 'rules.txt', 21
FROM classes c WHERE c.slug = 'cleric';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Champion', 'champion', 'The archetypal Champion focuses on the development of raw physical power honed to deadly perfection. Those who model themselves on this archetype combine rigorous training with physical excellence to deal devastating blows.', 3, 'rules.txt', 25
FROM classes c WHERE c.slug = 'fighter';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'Thief', 'thief', 'You hone your skills in the larcenous arts. Burglars, bandits, cutpurses, and other criminals typically follow this archetype, but so do rogues who prefer to think of themselves as professional treasure seekers, explorers, delvers, and investigators.', 3, 'rules.txt', 27
FROM classes c WHERE c.slug = 'rogue';

INSERT INTO subclasses (class_id, name, slug, description, subclass_level, source_document, source_page)
SELECT c.id, 'School of Evocation', 'school-of-evocation', 'You focus your study on magic that creates powerful elemental effects such as bitter cold, searing flame, rolling thunder, crackling lightning, and burning acid. Some evokers find employment in military forces, serving as artillery to blast enemy armies from afar.', 2, 'rules.txt', 30
FROM classes c WHERE c.slug = 'wizard';

-- ---------------------------------------------------------------------------
-- 8.2 Class Features
-- ---------------------------------------------------------------------------

-- Fighter Class Features
INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Fighting Style', 'fighter-fighting-style', 1, 'You adopt a particular style of fighting as your specialty. Choose one of the following options: Archery, Defense, Dueling, Great Weapon Fighting, Protection, or Two-Weapon Fighting. You can''t take a Fighting Style option more than once, even if you later get to choose again.', 'rules.txt', 24
FROM classes c WHERE c.slug = 'fighter';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Second Wind', 'fighter-second-wind', 1, 'You have a limited well of stamina that you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.', 'rules.txt', 24
FROM classes c WHERE c.slug = 'fighter';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Action Surge', 'fighter-action-surge', 2, 'Starting at 2nd level, you can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action on top of your regular action and a possible bonus action. Once you use this feature, you must finish a short or long rest before you can use it again. Starting at 17th level, you can use it twice before a rest, but only once on the same turn.', 'rules.txt', 25
FROM classes c WHERE c.slug = 'fighter';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Extra Attack', 'fighter-extra-attack', 5, 'Beginning at 5th level, you can attack twice, instead of once, whenever you take the Attack action on your turn. The number of attacks increases to three when you reach 11th level in this class and to four when you reach 20th level in this class.', 'rules.txt', 25
FROM classes c WHERE c.slug = 'fighter';

-- Wizard Class Features
INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Spellcasting', 'wizard-spellcasting', 1, 'As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power. You know three cantrips of your choice from the wizard spell list. You learn additional wizard cantrips of your choice at higher levels. Your spellbook contains six 1st-level wizard spells of your choice.', 'rules.txt', 29
FROM classes c WHERE c.slug = 'wizard';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Arcane Recovery', 'wizard-arcane-recovery', 1, 'You have learned to regain some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher.', 'rules.txt', 29
FROM classes c WHERE c.slug = 'wizard';

-- Rogue Class Features
INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Expertise', 'rogue-expertise', 1, 'At 1st level, choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves'' tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies. At 6th level, you can choose two more of your proficiencies to gain this benefit.', 'rules.txt', 26
FROM classes c WHERE c.slug = 'rogue';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Sneak Attack', 'rogue-sneak-attack', 1, 'Beginning at 1st level, you know how to strike subtly and exploit a foe''s distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or a ranged weapon. You don''t need advantage on the attack roll if another enemy of the target is within 5 feet of it, that enemy isn''t incapacitated, and you don''t have disadvantage on the attack roll. The amount of the extra damage increases as you gain levels in this class.', 'rules.txt', 26
FROM classes c WHERE c.slug = 'rogue';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Cunning Action', 'rogue-cunning-action', 2, 'Starting at 2nd level, your quick thinking and agility allow you to move and act quickly. You can take a bonus action on each of your turns in combat. This action can be used only to take the Dash, Disengage, or Hide action.', 'rules.txt', 27
FROM classes c WHERE c.slug = 'rogue';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Uncanny Dodge', 'rogue-uncanny-dodge', 5, 'Starting at 5th level, when an attacker that you can see hits you with an attack, you can use your reaction to halve the attack''s damage against you.', 'rules.txt', 27
FROM classes c WHERE c.slug = 'rogue';

-- Cleric Class Features
INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Spellcasting', 'cleric-spellcasting', 1, 'As a conduit for divine power, you can cast cleric spells. You know three cantrips of your choice from the cleric spell list. You prepare the list of cleric spells that are available for you to cast, choosing from the cleric spell list. You can change your list of prepared spells when you finish a long rest.', 'rules.txt', 20
FROM classes c WHERE c.slug = 'cleric';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Channel Divinity', 'cleric-channel-divinity', 2, 'At 2nd level, you gain the ability to channel divine energy directly from your deity, using that energy to fuel magical effects. You start with two such effects: Turn Undead and an effect determined by your domain. When you use your Channel Divinity, you choose which effect to create. You must then finish a short or long rest to use your Channel Divinity again.', 'rules.txt', 21
FROM classes c WHERE c.slug = 'cleric';

INSERT INTO class_features (class_id, name, slug, level, description, source_document, source_page)
SELECT c.id, 'Divine Intervention', 'cleric-divine-intervention', 10, 'Beginning at 10th level, you can call on your deity to intervene on your behalf when your need is great. Imploring your deity''s aid requires you to use your action. Describe the assistance you seek, and roll percentile dice. If you roll a number equal to or lower than your cleric level, your deity intervenes.', 'rules.txt', 22
FROM classes c WHERE c.slug = 'cleric';

-- ---------------------------------------------------------------------------
-- 8.3 Races and Subraces
-- ---------------------------------------------------------------------------

-- Core Races from Basic Rules
INSERT INTO races (name, slug, description, ability_score_increase, age_description, alignment_description, size, size_description, speed, speed_description, languages, language_description, traits, source_document, source_page) VALUES
('Dwarf', 'dwarf', 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal. Kingdoms rich in ancient grandeur, halls carved into the roots of mountains, the echoing of picks and hammers in deep mines and blazing forges, a commitment to clan and tradition, and a burning hatred of goblins and orcs—these common threads unite all dwarves.', '{"constitution": 2}', 'Dwarves mature at the same rate as humans, but they''re considered young until they reach the age of 50. On average, they live about 350 years.', 'Most dwarves are lawful, believing firmly in the benefits of a well-ordered society. They tend toward good as well, with a strong sense of fair play and a belief that everyone deserves to share in the benefits of a just order.', 'Medium', 'Dwarves stand between 4 and 5 feet tall and average about 150 pounds.', 25, 'Your speed is not reduced by wearing heavy armor.', ARRAY['Common', 'Dwarvish'], 'You can speak, read, and write Common and Dwarvish.', '{"darkvision": "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", "dwarven_resilience": "You have advantage on saving throws against poison, and you have resistance against poison damage.", "dwarven_combat_training": "You have proficiency with the battleaxe, handaxe, light hammer, and warhammer.", "stonecunning": "Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check."}', 'rules.txt', 18),

('Elf', 'elf', 'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. They live in places of ethereal beauty, in the midst of ancient forests or in silvery spires glittering with faerie light, where soft music drifts through the air and gentle fragrances waft on the breeze.', '{"dexterity": 2}', 'Although elves reach physical maturity at about the same age as humans, the elven understanding of adulthood goes beyond physical growth to encompass worldly experience. An elf typically claims adulthood and an adult name around the age of 100 and can live to be 750 years old.', 'Elves love freedom, variety, and self-expression, so they lean strongly toward the gentler aspects of chaos. They value and protect others'' freedom as well as their own, and they are more often good than not.', 'Medium', 'Elves range from under 5 to over 6 feet tall and have slender builds.', 30, 'Your base walking speed is 30 feet.', ARRAY['Common', 'Elvish'], 'You can speak, read, and write Common and Elvish.', '{"darkvision": "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", "keen_senses": "You have proficiency in the Perception skill.", "fey_ancestry": "You have advantage on saving throws against being charmed, and magic can''t put you to sleep.", "trance": "Elves don''t need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day."}', 'rules.txt', 15),

('Halfling', 'halfling', 'The comforts of home are the goals of most halflings'' lives: a place to settle in peace and quiet, far from marauding monsters and clashing armies; a blazing fire and a generous meal; fine drink and fine conversation. Though some halflings live out their days in remote agricultural communities, others form nomadic bands that travel constantly.', '{"dexterity": 2}', 'A halfling reaches adulthood at the age of 20 and generally lives into the middle of his or her second century.', 'Most halflings are lawful good. As a rule, they are good-hearted and kind, hate to see others in pain, and have no tolerance for oppression. They are also very orderly and traditional, leaning heavily on the support of their community and the comfort of their old ways.', 'Small', 'Halflings average about 3 feet tall and weigh about 40 pounds.', 25, 'Your base walking speed is 25 feet.', ARRAY['Common', 'Halfling'], 'You can speak, read, and write Common and Halfling.', '{"lucky": "When you roll a 1 on an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.", "brave": "You have advantage on saving throws against being frightened.", "halfling_nimbleness": "You can move through the space of any creature that is of a size larger than yours."}', 'rules.txt', 16),

('Human', 'human', 'In the reckonings of most worlds, humans are the youngest of the common races, late to arrive on the world scene and short-lived in comparison to dwarves, elves, and dragons. Perhaps it is because of their shorter lives that they strive to achieve as much as they can in the years they are given. Or maybe they feel they have something to prove to the elder races, and that''s why they build their mighty empires on the foundation of conquest and trade.', '{"strength": 1, "dexterity": 1, "constitution": 1, "intelligence": 1, "wisdom": 1, "charisma": 1}', 'Humans reach adulthood in their late teens and live less than a century.', 'Humans tend toward no particular alignment. The best and the worst are found among them.', 'Medium', 'Humans vary widely in height and build, from barely 5 feet to well over 6 feet tall.', 30, 'Your base walking speed is 30 feet.', ARRAY['Common'], 'You can speak, read, and write Common and one extra language of your choice.', '{}', 'rules.txt', 17);

-- Subraces
INSERT INTO subraces (race_id, name, slug, description, ability_score_increase, traits, source_document, source_page)
SELECT r.id, 'Hill Dwarf', 'hill-dwarf', 'As a hill dwarf, you have keen senses, deep intuition, and remarkable resilience. The gold dwarves of Faerûn in their mighty southern kingdom are hill dwarves, as are the exiled Neidar and the debased Klar of Krynn in the Dragonlance setting.', '{"wisdom": 1}', '{"dwarven_toughness": "Your hit point maximum increases by 1, and it increases by 1 every time you gain a level."}', 'rules.txt', 18
FROM races r WHERE r.slug = 'dwarf';

INSERT INTO subraces (race_id, name, slug, description, ability_score_increase, traits, source_document, source_page)
SELECT r.id, 'High Elf', 'high-elf', 'As a high elf, you have a keen mind and a mastery of at least the basics of magic. In many of the worlds of D&D, there are two kinds of high elves. One type is haughty and reclusive, believing themselves to be superior to non-elves and even other elves. The other type is more common and more friendly, and often encountered among humans and other races.', '{"intelligence": 1}', '{"elf_weapon_training": "You have proficiency with the longsword, shortsword, shortbow, and longbow.", "cantrip": "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.", "extra_language": "You can speak, read, and write one extra language of your choice."}', 'rules.txt', 15
FROM races r WHERE r.slug = 'elf';

INSERT INTO subraces (race_id, name, slug, description, ability_score_increase, traits, source_document, source_page)
SELECT r.id, 'Lightfoot Halfling', 'lightfoot-halfling', 'As a lightfoot halfling, you can easily hide from notice, even using other people as cover. You''re inclined to be affable and get along well with others. Lightfoots are more prone to wanderlust than other halflings, and often dwell alongside other races or take up a nomadic life.', '{"charisma": 1}', '{"naturally_stealthy": "You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you."}', 'rules.txt', 17
FROM races r WHERE r.slug = 'halfling';

-- ---------------------------------------------------------------------------
-- 8.4 Spells
-- ---------------------------------------------------------------------------

-- Cantrips (Level 0)
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Acid Splash', 'acid-splash', 0, 'Conjuration', '1 action', '60 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'You hurl a bubble of acid. Choose one or two creatures you can see within range. If you choose two, they must be within 5 feet of each other. A target must succeed on a Dexterity saving throw or take 1d6 acid damage.', 'This spell''s damage increases by 1d6 when you reach 5th level (2d6), 11th level (3d6), and 17th level (4d6).', 'rules.txt', 86),

('Fire Bolt', 'fire-bolt', 0, 'Evocation', '1 action', '120 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'You hurl a mote of fire at a creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage. A flammable object hit by this spell ignites if it isn''t being worn or carried.', 'This spell''s damage increases by 1d10 when you reach 5th level (2d10), 11th level (3d10), and 17th level (4d10).', 'rules.txt', 91),

('Light', 'light', 0, 'Evocation', '1 action', 'Touch', 'V, M', 'a firefly or phosphorescent moss', '1 hour', FALSE, FALSE, 'You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet. The light can be colored as you like. Completely covering the object with something opaque blocks the light. The spell ends if you cast it again or dismiss it as an action.', NULL, 'rules.txt', 95),

('Mage Hand', 'mage-hand', 0, 'Conjuration', '1 action', '30 feet', 'V, S', NULL, '1 minute', FALSE, FALSE, 'A spectral, floating hand appears at a point you choose within range. The hand lasts for the duration or until you dismiss it as an action. The hand vanishes if it is ever more than 30 feet away from you or if you cast this spell again. You can use your action to control the hand and use it to manipulate an object, open an unlocked door or container, stow or retrieve an item from an open container, or pour the contents out of a vial.', NULL, 'rules.txt', 96),

('Prestidigitation', 'prestidigitation', 0, 'Transmutation', '1 action', '10 feet', 'V, S', NULL, 'Up to 1 hour', FALSE, FALSE, 'This spell is a minor magical trick that novice spellcasters use for practice. You create one of the following magical effects within range: You create an instantaneous, harmless sensory effect, such as a shower of sparks, a puff of wind, faint musical notes, or an odd odor. You instantaneously light or snuff out a candle, a torch, or a small campfire. You instantaneously clean or soil an object no larger than 1 cubic foot. You chill, warm, or flavor up to 1 cubic foot of nonliving material for 1 hour. You make a color, a small mark, or a symbol appear on an object or a surface for 1 hour. You create a nonmagical trinket or an illusory image that can fit in your hand and that lasts until the end of your next turn.', NULL, 'rules.txt', 99),

('Sacred Flame', 'sacred-flame', 0, 'Evocation', '1 action', '60 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'Flame-like radiance descends on a creature that you can see within range. The target must succeed on a Dexterity saving throw or take 1d8 radiant damage. The target gains no benefit from cover for this saving throw.', 'This spell''s damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).', 'rules.txt', 101),

('Ray of Frost', 'ray-of-frost', 0, 'Evocation', '1 action', '60 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'A frigid beam of blue-white light streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, it takes 1d8 cold damage, and its speed is reduced by 10 feet until the start of your next turn.', 'This spell''s damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).', 'rules.txt', 100);

-- 1st Level Spells
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Magic Missile', 'magic-missile', 1, 'Evocation', '1 action', '120 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.', 'When you cast this spell using a spell slot of 2nd level or higher, the spell creates one more dart for each slot level above 1st.', 'rules.txt', 96),

('Shield', 'shield', 1, 'Abjuration', '1 reaction', 'Self', 'V, S', NULL, '1 round', FALSE, FALSE, 'An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile.', NULL, 'rules.txt', 102),

('Cure Wounds', 'cure-wounds', 1, 'Evocation', '1 action', 'Touch', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.', 'When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.', 'rules.txt', 89),

('Detect Magic', 'detect-magic', 1, 'Divination', '1 action', 'Self', 'V, S', NULL, 'Up to 10 minutes', TRUE, TRUE, 'For the duration, you sense the presence of magic within 30 feet of you. If you sense magic in this way, you can use your action to see a faint aura around any visible creature or object in the area that bears magic, and you learn its school of magic, if any.', NULL, 'rules.txt', 90),

('Sleep', 'sleep', 1, 'Enchantment', '1 action', '90 feet', 'V, S, M', 'a pinch of fine sand, rose petals, or a cricket', '1 minute', FALSE, FALSE, 'This spell sends creatures into a magical slumber. Roll 5d8; the total is how many hit points of creatures this spell can affect. Creatures within 20 feet of a point you choose within range are affected in ascending order of their current hit points (ignoring unconscious creatures). Starting with the creature that has the lowest current hit points, each creature affected by this spell falls unconscious until the spell ends, the sleeper takes damage, or someone uses an action to shake or slap the sleeper awake.', 'When you cast this spell using a spell slot of 2nd level or higher, roll an additional 2d8 for each slot level above 1st.', 'rules.txt', 103),

('Thunderwave', 'thunderwave', 1, 'Evocation', '1 action', 'Self (15-foot cube)', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'A wave of thunderous force sweeps out from you. Each creature in a 15-foot cube originating from you must make a Constitution saving throw. On a failed save, a creature takes 2d8 thunder damage and is pushed 10 feet away from you. On a successful save, the creature takes half as much damage and isn''t pushed.', 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d8 for each slot level above 1st.', 'rules.txt', 104),

('Bless', 'bless', 1, 'Enchantment', '1 action', '30 feet', 'V, S, M', 'a sprinkling of holy water', 'Up to 1 minute', TRUE, FALSE, 'You bless up to three creatures of your choice within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target can roll a d4 and add the number rolled to the attack roll or saving throw.', 'When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.', 'rules.txt', 87),

('Burning Hands', 'burning-hands', 1, 'Evocation', '1 action', 'Self (15-foot cone)', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'As you hold your hands with thumbs touching and fingers spread, a thin sheet of flames shoots forth from your outstretched fingertips. Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes 3d6 fire damage on a failed save, or half as much damage on a successful one.', 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.', 'rules.txt', 88);

-- 2nd Level Spells
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Hold Person', 'hold-person', 2, 'Enchantment', '1 action', '60 feet', 'V, S, M', 'a small, straight piece of iron', 'Up to 1 minute', TRUE, FALSE, 'Choose a humanoid that you can see within range. The target must succeed on a Wisdom saving throw or be paralyzed for the duration. At the end of each of its turns, the target can make another Wisdom saving throw. On a success, the spell ends on the target.', 'When you cast this spell using a spell slot of 3rd level or higher, you can target one additional humanoid for each slot level above 2nd.', 'rules.txt', 93),

('Invisibility', 'invisibility', 2, 'Illusion', '1 action', 'Touch', 'V, S, M', 'an eyelash encased in gum arabic', 'Up to 1 hour', TRUE, FALSE, 'A creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target''s person. The spell ends for a target that attacks or casts a spell.', 'When you cast this spell using a spell slot of 3rd level or higher, you can target one additional creature for each slot level above 2nd.', 'rules.txt', 94),

('Misty Step', 'misty-step', 2, 'Conjuration', '1 bonus action', 'Self', 'V', NULL, 'Instantaneous', FALSE, FALSE, 'Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see.', NULL, 'rules.txt', 97),

('Scorching Ray', 'scorching-ray', 2, 'Evocation', '1 action', '120 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'You create three rays of fire and hurl them at targets within range. You can hurl them at one target or several. Make a ranged spell attack for each ray. On a hit, the target takes 2d6 fire damage.', 'When you cast this spell using a spell slot of 3rd level or higher, you create one additional ray for each slot level above 2nd.', 'rules.txt', 102),

('Spiritual Weapon', 'spiritual-weapon', 2, 'Evocation', '1 bonus action', '60 feet', 'V, S', NULL, '1 minute', FALSE, FALSE, 'You create a floating, spectral weapon within range that lasts for the duration or until you cast this spell again. When you cast the spell, you can make a melee spell attack against a creature within 5 feet of the weapon. On a hit, the target takes force damage equal to 1d8 + your spellcasting ability modifier. As a bonus action on your turn, you can move the weapon up to 20 feet and repeat the attack against a creature within 5 feet of it.', 'When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d8 for every two slot levels above 2nd.', 'rules.txt', 103);

-- 3rd Level Spells
INSERT INTO spells (name, slug, level, school, casting_time, range, components, materials, duration, concentration, ritual, description, at_higher_levels, source_document, source_page) VALUES
('Fireball', 'fireball', 3, 'Evocation', '1 action', '150 feet', 'V, S, M', 'a tiny ball of bat guano and sulfur', 'Instantaneous', FALSE, FALSE, 'A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one. The fire spreads around corners. It ignites flammable objects in the area that aren''t being worn or carried.', 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.', 'rules.txt', 91),

('Lightning Bolt', 'lightning-bolt', 3, 'Evocation', '1 action', 'Self (100-foot line)', 'V, S, M', 'a bit of fur and a rod of amber, crystal, or glass', 'Instantaneous', FALSE, FALSE, 'A stroke of lightning forming a line 100 feet long and 5 feet wide blasts out from you in a direction you choose. Each creature in the line must make a Dexterity saving throw. A creature takes 8d6 lightning damage on a failed save, or half as much damage on a successful one. The lightning ignites flammable objects in the area that aren''t being worn or carried.', 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.', 'rules.txt', 95),

('Counterspell', 'counterspell', 3, 'Abjuration', '1 reaction', '60 feet', 'S', NULL, 'Instantaneous', FALSE, FALSE, 'You attempt to interrupt a creature in the process of casting a spell. If the creature is casting a spell of 3rd level or lower, its spell fails and has no effect. If it is casting a spell of 4th level or higher, make an ability check using your spellcasting ability. The DC equals 10 + the spell''s level. On a success, the creature''s spell fails and has no effect.', 'When you cast this spell using a spell slot of 4th level or higher, the interrupted spell has no effect if its level is less than or equal to the level of the spell slot you used.', 'rules.txt', 89),

('Dispel Magic', 'dispel-magic', 3, 'Abjuration', '1 action', '120 feet', 'V, S', NULL, 'Instantaneous', FALSE, FALSE, 'Choose one creature, object, or magical effect within range. Any spell of 3rd level or lower on the target ends. For each spell of 4th level or higher on the target, make an ability check using your spellcasting ability. The DC equals 10 + the spell''s level. On a successful check, the spell ends.', 'When you cast this spell using a spell slot of 4th level or higher, you automatically end the effects of a spell on the target if the spell''s level is equal to or less than the level of the spell slot you used.', 'rules.txt', 90),

('Fly', 'fly', 3, 'Transmutation', '1 action', 'Touch', 'V, S, M', 'a wing feather from any bird', 'Up to 10 minutes', TRUE, FALSE, 'You touch a willing creature. The target gains a flying speed of 60 feet for the duration. When the spell ends, the target falls if it is still aloft, unless it can stop the fall.', 'When you cast this spell using a spell slot of 4th level or higher, you can target one additional creature for each slot level above 3rd.', 'rules.txt', 92),

('Haste', 'haste', 3, 'Transmutation', '1 action', '30 feet', 'V, S, M', 'a shaving of licorice root', 'Up to 1 minute', TRUE, FALSE, 'Choose a willing creature that you can see within range. Until the spell ends, the target''s speed is doubled, it gains a +2 bonus to AC, it has advantage on Dexterity saving throws, and it gains an additional action on each of its turns. That action can be used only to take the Attack (one weapon attack only), Dash, Disengage, Hide, or Use an Object action. When the spell ends, the target can''t move or take actions until after its next turn, as a wave of lethargy sweeps over it.', NULL, 'rules.txt', 92);

-- Class-Spell Relationships
INSERT INTO class_spells (class_id, spell_id)
SELECT c.id, s.id FROM classes c, spells s
WHERE c.slug = 'wizard' AND s.slug IN ('acid-splash', 'fire-bolt', 'light', 'mage-hand', 'prestidigitation', 'ray-of-frost', 'magic-missile', 'shield', 'detect-magic', 'sleep', 'thunderwave', 'burning-hands', 'hold-person', 'invisibility', 'misty-step', 'scorching-ray', 'fireball', 'lightning-bolt', 'counterspell', 'dispel-magic', 'fly', 'haste');

INSERT INTO class_spells (class_id, spell_id)
SELECT c.id, s.id FROM classes c, spells s
WHERE c.slug = 'cleric' AND s.slug IN ('light', 'sacred-flame', 'cure-wounds', 'detect-magic', 'bless', 'spiritual-weapon', 'dispel-magic');

-- ---------------------------------------------------------------------------
-- 8.5 Monsters
-- ---------------------------------------------------------------------------

-- CR 0-1/4 Monsters
INSERT INTO monsters (name, slug, size, monster_type, subtype, alignment, armor_class, armor_type, hit_points, hit_dice, speed, ability_scores, saving_throws, skills, senses, languages, challenge_rating, experience_points, traits, actions, description, source_document, source_page) VALUES
('Goblin', 'goblin', 'Small', 'humanoid', 'goblinoid', 'neutral evil', 15, 'leather armor, shield', 7, '2d6', '{"walk": 30}', '{"strength": 8, "dexterity": 14, "constitution": 10, "intelligence": 10, "wisdom": 8, "charisma": 8}', NULL, '{"stealth": 6}', '{"darkvision": 60, "passive_perception": 9}', ARRAY['Common', 'Goblin'], '1/4', 50, '{"nimble_escape": "The goblin can take the Disengage or Hide action as a bonus action on each of its turns."}', '{"scimitar": {"type": "melee", "attack_bonus": 4, "reach": "5 ft.", "damage": "1d6 + 2", "damage_type": "slashing"}, "shortbow": {"type": "ranged", "attack_bonus": 4, "range": "80/320 ft.", "damage": "1d6 + 2", "damage_type": "piercing"}}', 'Goblins are small, black-hearted humanoids that lair in despoiled dungeons and other dismal settings. Individually weak, they gather in large numbers to torment other creatures.', 'rules.txt', 166),

('Kobold', 'kobold', 'Small', 'humanoid', 'kobold', 'lawful evil', 12, NULL, 5, '2d6 - 2', '{"walk": 30}', '{"strength": 7, "dexterity": 15, "constitution": 9, "intelligence": 8, "wisdom": 7, "charisma": 8}', NULL, NULL, '{"darkvision": 60, "passive_perception": 8}', ARRAY['Common', 'Draconic'], '1/8', 25, '{"sunlight_sensitivity": "While in sunlight, the kobold has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight.", "pack_tactics": "The kobold has advantage on an attack roll against a creature if at least one of the kobold''s allies is within 5 feet of the creature and the ally isn''t incapacitated."}', '{"dagger": {"type": "melee", "attack_bonus": 4, "reach": "5 ft.", "damage": "1d4 + 2", "damage_type": "piercing"}, "sling": {"type": "ranged", "attack_bonus": 4, "range": "30/120 ft.", "damage": "1d4 + 2", "damage_type": "bludgeoning"}}', 'Kobolds are craven reptilian humanoids that commonly infest dungeons. They make up for their physical ineptitude with a cleverness for trap making.', 'rules.txt', 170);

-- CR 1/2 - 1 Monsters
INSERT INTO monsters (name, slug, size, monster_type, subtype, alignment, armor_class, armor_type, hit_points, hit_dice, speed, ability_scores, saving_throws, skills, senses, languages, challenge_rating, experience_points, traits, actions, description, source_document, source_page) VALUES
('Orc', 'orc', 'Medium', 'humanoid', 'orc', 'chaotic evil', 13, 'hide armor', 15, '2d8 + 6', '{"walk": 30}', '{"strength": 16, "dexterity": 12, "constitution": 16, "intelligence": 7, "wisdom": 11, "charisma": 10}', NULL, '{"intimidation": 2}', '{"darkvision": 60, "passive_perception": 10}', ARRAY['Common', 'Orc'], '1/2', 100, '{"aggressive": "As a bonus action, the orc can move up to its speed toward a hostile creature that it can see."}', '{"greataxe": {"type": "melee", "attack_bonus": 5, "reach": "5 ft.", "damage": "1d12 + 3", "damage_type": "slashing"}, "javelin": {"type": "melee_or_ranged", "attack_bonus": 5, "reach": "5 ft.", "range": "30/120 ft.", "damage": "1d6 + 3", "damage_type": "piercing"}}', 'Orcs are savage raiders and pillagers with stooped postures, low foreheads, and piggish faces with prominent lower canines that resemble tusks.', 'rules.txt', 172),

('Skeleton', 'skeleton', 'Medium', 'undead', NULL, 'lawful evil', 13, 'armor scraps', 13, '2d8 + 4', '{"walk": 30}', '{"strength": 10, "dexterity": 14, "constitution": 15, "intelligence": 6, "wisdom": 8, "charisma": 5}', NULL, NULL, '{"darkvision": 60, "passive_perception": 9}', ARRAY['understands languages it knew in life'], '1/4', 50, '{}', '{"shortsword": {"type": "melee", "attack_bonus": 4, "reach": "5 ft.", "damage": "1d6 + 2", "damage_type": "piercing"}, "shortbow": {"type": "ranged", "attack_bonus": 4, "range": "80/320 ft.", "damage": "1d6 + 2", "damage_type": "piercing"}}', 'Skeletons arise when animated by dark magic. They heed the summons of spellcasters who call them from their stony tombs and ancient battlefields.', 'rules.txt', 178),

('Zombie', 'zombie', 'Medium', 'undead', NULL, 'neutral evil', 8, NULL, 22, '3d8 + 9', '{"walk": 20}', '{"strength": 13, "dexterity": 6, "constitution": 16, "intelligence": 3, "wisdom": 6, "charisma": 5}', '{"wisdom": 0}', NULL, '{"darkvision": 60, "passive_perception": 8}', ARRAY['understands languages it knew in life'], '1/4', 50, '{"undead_fortitude": "If damage reduces the zombie to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the zombie drops to 1 hit point instead."}', '{"slam": {"type": "melee", "attack_bonus": 3, "reach": "5 ft.", "damage": "1d6 + 1", "damage_type": "bludgeoning"}}', 'From somewhere in the darkness, a gurgling moan is heard. A form emerges from the shadows, dragging one foot as it raises bloated arms and broken hands.', 'rules.txt', 187);

-- CR 2-5 Monsters
INSERT INTO monsters (name, slug, size, monster_type, subtype, alignment, armor_class, armor_type, hit_points, hit_dice, speed, ability_scores, saving_throws, skills, senses, languages, challenge_rating, experience_points, traits, actions, description, source_document, source_page) VALUES
('Ogre', 'ogre', 'Large', 'giant', NULL, 'chaotic evil', 11, 'hide armor', 59, '7d10 + 21', '{"walk": 40}', '{"strength": 19, "dexterity": 8, "constitution": 16, "intelligence": 5, "wisdom": 7, "charisma": 7}', NULL, NULL, '{"darkvision": 60, "passive_perception": 8}', ARRAY['Common', 'Giant'], '2', 450, '{}', '{"greatclub": {"type": "melee", "attack_bonus": 6, "reach": "5 ft.", "damage": "2d8 + 4", "damage_type": "bludgeoning"}, "javelin": {"type": "melee_or_ranged", "attack_bonus": 6, "reach": "5 ft.", "range": "30/120 ft.", "damage": "2d6 + 4", "damage_type": "piercing"}}', 'Ogres are as lazy of mind as they are strong of body. They live by raiding, scavenging, and killing for food and pleasure.', 'rules.txt', 172),

('Owlbear', 'owlbear', 'Large', 'monstrosity', NULL, 'unaligned', 13, 'natural armor', 59, '7d10 + 21', '{"walk": 40}', '{"strength": 20, "dexterity": 12, "constitution": 17, "intelligence": 3, "wisdom": 12, "charisma": 7}', NULL, '{"perception": 3}', '{"darkvision": 60, "passive_perception": 13}', NULL, '3', 700, '{"keen_sight_and_smell": "The owlbear has advantage on Wisdom (Perception) checks that rely on sight or smell."}', '{"multiattack": "The owlbear makes two attacks: one with its beak and one with its claws.", "beak": {"type": "melee", "attack_bonus": 7, "reach": "5 ft.", "damage": "1d10 + 5", "damage_type": "piercing"}, "claws": {"type": "melee", "attack_bonus": 7, "reach": "5 ft.", "damage": "2d8 + 5", "damage_type": "slashing"}}', 'An owlbear''s screech echoes through dark valleys and benighted forests, striking fear into the hearts of those who hear it.', 'rules.txt', 173),

('Wight', 'wight', 'Medium', 'undead', NULL, 'neutral evil', 14, 'studded leather', 45, '6d8 + 18', '{"walk": 30}', '{"strength": 15, "dexterity": 14, "constitution": 16, "intelligence": 10, "wisdom": 13, "charisma": 15}', NULL, '{"perception": 3, "stealth": 4}', '{"darkvision": 60, "passive_perception": 13}', ARRAY['languages it knew in life'], '3', 700, '{"sunlight_sensitivity": "While in sunlight, the wight has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."}', '{"multiattack": "The wight makes two longsword attacks or two longbow attacks. It can use its Life Drain in place of one longsword attack.", "life_drain": {"type": "melee", "attack_bonus": 4, "reach": "5 ft.", "damage": "1d6 + 2", "damage_type": "necrotic", "special": "The target must succeed on a DC 13 Constitution saving throw or its hit point maximum is reduced by an amount equal to the damage taken. This reduction lasts until the target finishes a long rest. The target dies if this effect reduces its hit point maximum to 0."}, "longsword": {"type": "melee", "attack_bonus": 4, "reach": "5 ft.", "damage": "1d8 + 2", "damage_type": "slashing"}, "longbow": {"type": "ranged", "attack_bonus": 4, "range": "150/600 ft.", "damage": "1d8 + 2", "damage_type": "piercing"}}', 'The word "wight" meant "person" in days of yore, but the name now refers to evil undead who were once combatants.', 'rules.txt', 186);

-- CR 6+ Monsters
INSERT INTO monsters (name, slug, size, monster_type, subtype, alignment, armor_class, armor_type, hit_points, hit_dice, speed, ability_scores, saving_throws, skills, senses, languages, challenge_rating, experience_points, traits, actions, legendary_actions, description, source_document, source_page) VALUES
('Young Black Dragon', 'young-black-dragon', 'Large', 'dragon', NULL, 'chaotic evil', 18, 'natural armor', 127, '15d10 + 45', '{"walk": 40, "fly": 80, "swim": 40}', '{"strength": 19, "dexterity": 14, "constitution": 17, "intelligence": 12, "wisdom": 11, "charisma": 15}', '{"dexterity": 5, "constitution": 6, "wisdom": 3, "charisma": 5}', '{"perception": 6, "stealth": 5}', '{"blindsight": 30, "darkvision": 120, "passive_perception": 16}', ARRAY['Common', 'Draconic'], '7', 2900, '{"amphibious": "The dragon can breathe air and water."}', '{"multiattack": "The dragon makes three attacks: one with its bite and two with its claws.", "bite": {"type": "melee", "attack_bonus": 7, "reach": "10 ft.", "damage": "2d10 + 4", "damage_type": "piercing", "extra_damage": "1d8 acid"}, "claw": {"type": "melee", "attack_bonus": 7, "reach": "5 ft.", "damage": "2d6 + 4", "damage_type": "slashing"}, "acid_breath": {"recharge": "5-6", "save_dc": 14, "save_type": "Dexterity", "damage": "11d8", "damage_type": "acid", "area": "30-foot line that is 5 feet wide"}}', NULL, 'Black dragons are the most evil-tempered and vile of the chromatic dragons. They lurk in swamps, often establishing lairs in crumbling ruins.', 'rules.txt', 159),

('Adult Red Dragon', 'adult-red-dragon', 'Huge', 'dragon', NULL, 'chaotic evil', 19, 'natural armor', 256, '19d12 + 133', '{"walk": 40, "climb": 40, "fly": 80}', '{"strength": 27, "dexterity": 10, "constitution": 25, "intelligence": 16, "wisdom": 13, "charisma": 21}', '{"dexterity": 6, "constitution": 13, "wisdom": 7, "charisma": 11}', '{"perception": 13, "stealth": 6}', '{"blindsight": 60, "darkvision": 120, "passive_perception": 23}', ARRAY['Common', 'Draconic'], '17', 18000, '{"legendary_resistance": "If the dragon fails a saving throw, it can choose to succeed instead. 3/day."}', '{"multiattack": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws.", "bite": {"type": "melee", "attack_bonus": 14, "reach": "10 ft.", "damage": "2d10 + 8", "damage_type": "piercing", "extra_damage": "2d6 fire"}, "claw": {"type": "melee", "attack_bonus": 14, "reach": "5 ft.", "damage": "2d6 + 8", "damage_type": "slashing"}, "tail": {"type": "melee", "attack_bonus": 14, "reach": "15 ft.", "damage": "2d8 + 8", "damage_type": "bludgeoning"}, "frightful_presence": {"save_dc": 19, "save_type": "Wisdom", "range": "120 feet", "effect": "frightened for 1 minute"}, "fire_breath": {"recharge": "5-6", "save_dc": 21, "save_type": "Dexterity", "damage": "18d6", "damage_type": "fire", "area": "60-foot cone"}}', '{"detect": "The dragon makes a Wisdom (Perception) check.", "tail_attack": "The dragon makes a tail attack.", "wing_attack": "The dragon beats its wings. Each creature within 10 feet must succeed on a DC 22 Dexterity saving throw or take 2d6 + 8 bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."}', 'Red dragons are the most covetous and greedy of all dragons, forever seeking to increase their treasure hoards.', 'rules.txt', 158);

-- ---------------------------------------------------------------------------
-- 8.6 Items (Weapons, Armor, Equipment)
-- ---------------------------------------------------------------------------

-- Weapons
INSERT INTO items (name, slug, item_type, description, cost, weight, damage, damage_type, weapon_properties, weapon_range, source_document, source_page) VALUES
('Dagger', 'dagger', 'weapon', 'A simple melee weapon useful for close quarters combat and throwing.', '2 gp', '1 lb.', '1d4', 'piercing', ARRAY['Finesse', 'Light', 'Thrown'], '20/60', 'rules.txt', 46),
('Shortsword', 'shortsword', 'weapon', 'A martial melee weapon favored by rogues for its quick, precise strikes.', '10 gp', '2 lb.', '1d6', 'piercing', ARRAY['Finesse', 'Light'], NULL, 'rules.txt', 46),
('Longsword', 'longsword', 'weapon', 'A versatile martial weapon, the longsword is the quintessential knight''s blade.', '15 gp', '3 lb.', '1d8', 'slashing', ARRAY['Versatile (1d10)'], NULL, 'rules.txt', 46),
('Greatsword', 'greatsword', 'weapon', 'A massive two-handed sword capable of cleaving through multiple foes.', '50 gp', '6 lb.', '2d6', 'slashing', ARRAY['Heavy', 'Two-Handed'], NULL, 'rules.txt', 46),
('Longbow', 'longbow', 'weapon', 'A tall bow used for long-range attacks, requiring significant strength to draw.', '50 gp', '2 lb.', '1d8', 'piercing', ARRAY['Ammunition', 'Heavy', 'Two-Handed'], '150/600', 'rules.txt', 46),
('Shortbow', 'shortbow', 'weapon', 'A compact bow ideal for skirmishers and those who favor mobility.', '25 gp', '2 lb.', '1d6', 'piercing', ARRAY['Ammunition', 'Two-Handed'], '80/320', 'rules.txt', 46),
('Handaxe', 'handaxe', 'weapon', 'A simple weapon that can be used in melee or thrown at enemies.', '5 gp', '2 lb.', '1d6', 'slashing', ARRAY['Light', 'Thrown'], '20/60', 'rules.txt', 46),
('Greataxe', 'greataxe', 'weapon', 'A massive axe favored by barbarians for its devastating damage.', '30 gp', '7 lb.', '1d12', 'slashing', ARRAY['Heavy', 'Two-Handed'], NULL, 'rules.txt', 46),
('Quarterstaff', 'quarterstaff', 'weapon', 'A simple wooden staff, often used by monks and travelers.', '2 sp', '4 lb.', '1d6', 'bludgeoning', ARRAY['Versatile (1d8)'], NULL, 'rules.txt', 46),
('Light Crossbow', 'light-crossbow', 'weapon', 'A mechanical ranged weapon that fires bolts.', '25 gp', '5 lb.', '1d8', 'piercing', ARRAY['Ammunition', 'Loading', 'Two-Handed'], '80/320', 'rules.txt', 46);

-- Armor
INSERT INTO items (name, slug, item_type, description, cost, weight, armor_class, armor_type, strength_requirement, stealth_disadvantage, source_document, source_page) VALUES
('Leather Armor', 'leather-armor', 'armor', 'The breastplate and shoulder protectors of this armor are made of leather that has been stiffened by being boiled in oil.', '10 gp', '10 lb.', '11 + Dex modifier', 'Light', NULL, FALSE, 'rules.txt', 45),
('Studded Leather', 'studded-leather', 'armor', 'Made from tough but flexible leather, studded leather is reinforced with close-set rivets or spikes.', '45 gp', '13 lb.', '12 + Dex modifier', 'Light', NULL, FALSE, 'rules.txt', 45),
('Chain Shirt', 'chain-shirt', 'armor', 'Made of interlocking metal rings, a chain shirt is worn between layers of clothing or leather.', '50 gp', '20 lb.', '13 + Dex modifier (max 2)', 'Medium', NULL, FALSE, 'rules.txt', 45),
('Scale Mail', 'scale-mail', 'armor', 'This armor consists of a coat and leggings of leather covered with overlapping pieces of metal.', '50 gp', '45 lb.', '14 + Dex modifier (max 2)', 'Medium', NULL, TRUE, 'rules.txt', 45),
('Chain Mail', 'chain-mail', 'armor', 'Made of interlocking metal rings, chain mail includes a layer of quilted fabric worn underneath.', '75 gp', '55 lb.', '16', 'Heavy', 13, TRUE, 'rules.txt', 45),
('Plate Armor', 'plate-armor', 'armor', 'Plate consists of shaped, interlocking metal plates to cover the entire body.', '1,500 gp', '65 lb.', '18', 'Heavy', 15, TRUE, 'rules.txt', 45),
('Shield', 'shield', 'armor', 'A shield is made from wood or metal and is carried in one hand.', '10 gp', '6 lb.', '+2', 'Shield', NULL, FALSE, 'rules.txt', 45);

-- Adventuring Gear
INSERT INTO items (name, slug, item_type, description, cost, weight, source_document, source_page) VALUES
('Backpack', 'backpack', 'adventuring_gear', 'A leather pack carried on the back, typically with drawstrings, buckles, or straps.', '2 gp', '5 lb.', 'rules.txt', 48),
('Rope (50 feet)', 'rope-50-feet', 'adventuring_gear', 'Rope, whether made of hemp or silk, has 2 hit points and can be burst with a DC 17 Strength check.', '1 gp', '10 lb.', 'rules.txt', 48),
('Torch', 'torch', 'adventuring_gear', 'A torch burns for 1 hour, providing bright light in a 20-foot radius and dim light for an additional 20 feet.', '1 cp', '1 lb.', 'rules.txt', 48),
('Rations (1 day)', 'rations', 'adventuring_gear', 'Rations consist of dry foods suitable for extended travel, including jerky, dried fruit, hardtack, and nuts.', '5 sp', '2 lb.', 'rules.txt', 48),
('Waterskin', 'waterskin', 'adventuring_gear', 'A waterskin can hold up to 4 pints of liquid.', '2 sp', '5 lb. (full)', 'rules.txt', 48),
('Bedroll', 'bedroll', 'adventuring_gear', 'A bedroll helps you sleep in comfort.', '1 gp', '7 lb.', 'rules.txt', 48),
('Tinderbox', 'tinderbox', 'adventuring_gear', 'This small container holds flint, fire steel, and tinder used to kindle a fire.', '5 sp', '1 lb.', 'rules.txt', 48),
('Healer''s Kit', 'healers-kit', 'adventuring_gear', 'This kit is a leather pouch containing bandages, salves, and splints. The kit has ten uses. You can use it to stabilize a creature that has 0 hit points without needing to make a Wisdom (Medicine) check.', '5 gp', '3 lb.', 'rules.txt', 48),
('Thieves'' Tools', 'thieves-tools', 'tool', 'This set of tools includes a small file, a set of lock picks, a small mirror mounted on a metal handle, a set of narrow-bladed scissors, and a pair of pliers.', '25 gp', '1 lb.', 'rules.txt', 48)

-- ---------------------------------------------------------------------------
-- 8.7 Feats
-- ---------------------------------------------------------------------------

INSERT INTO feats (name, slug, description, prerequisites, benefits, source_document, source_page) VALUES
('Alert', 'alert', 'Always on the lookout for danger, you gain the following benefits: You can''t be surprised while you are conscious. You gain a +5 bonus to initiative. Other creatures don''t gain advantage on attack rolls against you as a result of being unseen by you.', NULL, '{"initiative_bonus": 5, "no_surprise": true, "no_unseen_advantage": true}', 'handbook.txt', 165),

('Athlete', 'athlete', 'You have undergone extensive physical training to gain the following benefits: Increase your Strength or Dexterity score by 1, to a maximum of 20. When you are prone, standing up uses only 5 feet of your movement. Climbing doesn''t cost you extra movement. You can make a running long jump or a running high jump after moving only 5 feet on foot, rather than 10 feet.', NULL, '{"ability_increase": ["strength", "dexterity"], "prone_stand_cost": 5, "climbing_cost": "normal", "jump_run_up": 5}', 'handbook.txt', 165),

('Dual Wielder', 'dual-wielder', 'You master fighting with two weapons, gaining the following benefits: You gain a +1 bonus to AC while you are wielding a separate melee weapon in each hand. You can use two-weapon fighting even when the one-handed melee weapons you are wielding aren''t light. You can draw or stow two one-handed weapons when you would normally be able to draw or stow only one.', NULL, '{"ac_bonus": 1, "no_light_restriction": true, "draw_two_weapons": true}', 'handbook.txt', 165),

('Great Weapon Master', 'great-weapon-master', 'You''ve learned to put the weight of a weapon to your advantage, letting its momentum empower your strikes. On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action. Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack''s damage.', NULL, '{"bonus_attack_on_crit_or_kill": true, "power_attack": {"attack_penalty": -5, "damage_bonus": 10}}', 'handbook.txt', 167),

('Lucky', 'lucky', 'You have inexplicable luck that seems to kick in at just the right moment. You have 3 luck points. Whenever you make an attack roll, an ability check, or a saving throw, you can spend one luck point to roll an additional d20. You can choose to spend one of your luck points after you roll the die, but before the outcome is determined. You choose which of the d20s is used for the attack roll, ability check, or saving throw. You can also spend one luck point when an attack roll is made against you. Roll a d20, and then choose whether the attack uses the attacker''s roll or yours. If more than one creature spends a luck point to influence the outcome of a roll, the points cancel each other out; no additional dice are rolled. You regain your expended luck points when you finish a long rest.', NULL, '{"luck_points": 3, "reroll_attacks": true, "reroll_checks": true, "reroll_saves": true, "enemy_reroll": true}', 'handbook.txt', 167),

('Sentinel', 'sentinel', 'You have mastered techniques to take advantage of every drop in any enemy''s guard, gaining the following benefits: When you hit a creature with an opportunity attack, the creature''s speed becomes 0 for the rest of the turn. Creatures provoke opportunity attacks from you even if they take the Disengage action before leaving your reach. When a creature within 5 feet of you makes an attack against a target other than you (and that target doesn''t have this feat), you can use your reaction to make a melee weapon attack against the attacking creature.', NULL, '{"opportunity_attack_stops_movement": true, "disengage_still_provokes": true, "protect_allies": true}', 'handbook.txt', 169),

('Sharpshooter', 'sharpshooter', 'You have mastered ranged weapons and can make shots that others find impossible. Attacking at long range doesn''t impose disadvantage on your ranged weapon attack rolls. Your ranged weapon attacks ignore half cover and three-quarters cover. Before you make an attack with a ranged weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack''s damage.', NULL, '{"ignore_long_range_disadvantage": true, "ignore_cover": true, "power_attack": {"attack_penalty": -5, "damage_bonus": 10}}', 'handbook.txt', 170),

('War Caster', 'war-caster', 'You have practiced casting spells in the midst of combat, learning techniques that grant you the following benefits: You have advantage on Constitution saving throws that you make to maintain your concentration on a spell when you take damage. You can perform the somatic components of spells even when you have weapons or a shield in one or both hands. When a hostile creature''s movement provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature, rather than making an opportunity attack. The spell must have a casting time of 1 action and must target only that creature.', 'The ability to cast at least one spell', '{"concentration_advantage": true, "somatic_with_equipment": true, "spell_opportunity_attack": true}', 'handbook.txt', 170)

-- ---------------------------------------------------------------------------
-- 8.8 Backgrounds
-- ---------------------------------------------------------------------------

INSERT INTO backgrounds (name, slug, description, skill_proficiencies, tool_proficiencies, languages, equipment, feature_name, feature_description, source_document, source_page) VALUES
('Acolyte', 'acolyte', 'You have spent your life in the service of a temple to a specific god or pantheon of gods. You act as an intermediary between the realm of the holy and the mortal world, performing sacred rites and offering sacrifices in order to conduct worshipers into the presence of the divine.', ARRAY['Insight', 'Religion'], NULL, 2, 'A holy symbol, a prayer book or prayer wheel, 5 sticks of incense, vestments, a set of common clothes, and a pouch containing 15 gp', 'Shelter of the Faithful', 'As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your adventuring companions can expect to receive free healing and care at a temple, shrine, or other established presence of your faith.', 'rules.txt', 37),

('Criminal', 'criminal', 'You are an experienced criminal with a history of breaking the law. You have spent a lot of time among other criminals and still have contacts within the criminal underworld.', ARRAY['Deception', 'Stealth'], ARRAY['One type of gaming set', 'Thieves'' tools'], 0, 'A crowbar, a set of dark common clothes including a hood, and a pouch containing 15 gp', 'Criminal Contact', 'You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances.', 'rules.txt', 38),

('Folk Hero', 'folk-hero', 'You come from a humble social rank, but you are destined for so much more. Already the people of your home village regard you as their champion, and your destiny calls you to stand against the tyrants and monsters that threaten the common folk everywhere.', ARRAY['Animal Handling', 'Survival'], ARRAY['One type of artisan''s tools', 'Vehicles (land)'], 0, 'A set of artisan''s tools (one of your choice), a shovel, an iron pot, a set of common clothes, and a pouch containing 10 gp', 'Rustic Hospitality', 'Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among other commoners, unless you have shown yourself to be a danger to them.', 'rules.txt', 38),

('Noble', 'noble', 'You understand wealth, power, and privilege. You carry a noble title, and your family owns land, collects taxes, and wields significant political influence.', ARRAY['History', 'Persuasion'], ARRAY['One type of gaming set'], 1, 'A set of fine clothes, a signet ring, a scroll of pedigree, and a purse containing 25 gp', 'Position of Privilege', 'Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are. Common folk make every effort to accommodate you and avoid your displeasure.', 'rules.txt', 39),

('Sage', 'sage', 'You spent years learning the lore of the multiverse. You scoured manuscripts, studied scrolls, and listened to the greatest experts on the subjects that interest you.', ARRAY['Arcana', 'History'], NULL, 2, 'A bottle of black ink, a quill, a small knife, a letter from a dead colleague posing a question you have not yet been able to answer, a set of common clothes, and a pouch containing 10 gp', 'Researcher', 'When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it. Usually, this information comes from a library, scriptorium, university, or a sage or other learned person or creature.', 'rules.txt', 39),

('Soldier', 'soldier', 'War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, learned basic survival techniques, including how to stay alive on the battlefield.', ARRAY['Athletics', 'Intimidation'], ARRAY['One type of gaming set', 'Vehicles (land)'], 0, 'An insignia of rank, a trophy taken from a fallen enemy, a set of bone dice or deck of cards, a set of common clothes, and a pouch containing 10 gp', 'Military Rank', 'You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence, and they defer to you if they are of a lower rank.', 'rules.txt', 40)

-- =============================================================================
-- SECTION 9: Views
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 9.1 Spell List View
-- ---------------------------------------------------------------------------
-- Lists all spells with their key attributes

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
-- 9.2 Class Spell List View
-- ---------------------------------------------------------------------------
-- Shows spells available to each class

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
-- 9.3 Monster by CR View
-- ---------------------------------------------------------------------------
-- Lists monsters sorted by challenge rating

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
-- SECTION 10: Verification Queries
-- =============================================================================
-- Run these queries to verify data integrity after migration

-- Row counts for all tables
SELECT 'abilities' AS table_name, COUNT(*) AS row_count FROM abilities
UNION ALL SELECT 'skills', COUNT(*) FROM skills
UNION ALL SELECT 'conditions', COUNT(*) FROM conditions
UNION ALL SELECT 'documents', COUNT(*) FROM documents
UNION ALL SELECT 'chapters', COUNT(*) FROM chapters
UNION ALL SELECT 'sections', COUNT(*) FROM sections
UNION ALL SELECT 'rule_categories', COUNT(*) FROM rule_categories
UNION ALL SELECT 'rules', COUNT(*) FROM rules
UNION ALL SELECT 'rule_references', COUNT(*) FROM rule_references
UNION ALL SELECT 'classes', COUNT(*) FROM classes
UNION ALL SELECT 'subclasses', COUNT(*) FROM subclasses
UNION ALL SELECT 'class_features', COUNT(*) FROM class_features
UNION ALL SELECT 'races', COUNT(*) FROM races
UNION ALL SELECT 'subraces', COUNT(*) FROM subraces
UNION ALL SELECT 'spells', COUNT(*) FROM spells
UNION ALL SELECT 'class_spells', COUNT(*) FROM class_spells
UNION ALL SELECT 'monsters', COUNT(*) FROM monsters
UNION ALL SELECT 'items', COUNT(*) FROM items
UNION ALL SELECT 'backgrounds', COUNT(*) FROM backgrounds
UNION ALL SELECT 'feats', COUNT(*) FROM feats
ORDER BY table_name;

-- Verify reference data counts
SELECT 'Reference Data Verification' AS check_name;
SELECT
    (SELECT COUNT(*) FROM abilities) AS abilities_count,
    (SELECT COUNT(*) FROM skills) AS skills_count,
    (SELECT COUNT(*) FROM conditions) AS conditions_count,
    (SELECT COUNT(*) FROM documents) AS documents_count;

-- Expected: abilities=6, skills=18, conditions=15, documents=2

-- Verify foreign key integrity
SELECT 'Foreign Key Integrity Check' AS check_name;
SELECT
    (SELECT COUNT(*) FROM skills WHERE ability_id IS NOT NULL AND ability_id NOT IN (SELECT id FROM abilities)) AS orphaned_skills,
    (SELECT COUNT(*) FROM chapters WHERE document_id NOT IN (SELECT id FROM documents)) AS orphaned_chapters,
    (SELECT COUNT(*) FROM subclasses WHERE class_id NOT IN (SELECT id FROM classes)) AS orphaned_subclasses,
    (SELECT COUNT(*) FROM subraces WHERE race_id NOT IN (SELECT id FROM races)) AS orphaned_subraces,
    (SELECT COUNT(*) FROM class_spells WHERE spell_id NOT IN (SELECT id FROM spells)) AS orphaned_class_spells;

-- All counts should be 0

-- Verify slug uniqueness
SELECT 'Slug Uniqueness Check' AS check_name;
SELECT
    (SELECT COUNT(*) - COUNT(DISTINCT slug) FROM abilities) AS duplicate_ability_slugs,
    (SELECT COUNT(*) - COUNT(DISTINCT slug) FROM skills) AS duplicate_skill_slugs,
    (SELECT COUNT(*) - COUNT(DISTINCT slug) FROM conditions) AS duplicate_condition_slugs,
    (SELECT COUNT(*) - COUNT(DISTINCT slug) FROM classes) AS duplicate_class_slugs,
    (SELECT COUNT(*) - COUNT(DISTINCT slug) FROM races) AS duplicate_race_slugs,
    (SELECT COUNT(*) - COUNT(DISTINCT slug) FROM spells) AS duplicate_spell_slugs,
    (SELECT COUNT(*) - COUNT(DISTINCT slug) FROM monsters) AS duplicate_monster_slugs;

-- All counts should be 0

-- =============================================================================
-- END OF MIGRATION SCRIPT
-- =============================================================================
