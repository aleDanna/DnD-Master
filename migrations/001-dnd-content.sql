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
-- Placeholder for rules extraction from docs/rules.txt
-- Content will be added in Phase 4 (User Story 2)

-- =============================================================================
-- SECTION 8: Player Content
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 8.1 Classes and Subclasses
-- ---------------------------------------------------------------------------
-- Placeholder for class extraction from docs/rules.txt and docs/handbook.txt
-- Content will be added in Phase 7 (User Story 5)

-- ---------------------------------------------------------------------------
-- 8.2 Class Features
-- ---------------------------------------------------------------------------
-- Placeholder for class feature extraction
-- Content will be added in Phase 7 (User Story 5)

-- ---------------------------------------------------------------------------
-- 8.3 Races and Subraces
-- ---------------------------------------------------------------------------
-- Placeholder for race extraction from docs/rules.txt and docs/handbook.txt
-- Content will be added in Phase 7 (User Story 5)

-- ---------------------------------------------------------------------------
-- 8.4 Spells
-- ---------------------------------------------------------------------------
-- Placeholder for spell extraction from docs/rules.txt and docs/handbook.txt
-- Content will be added in Phase 5 (User Story 3)

-- ---------------------------------------------------------------------------
-- 8.5 Monsters
-- ---------------------------------------------------------------------------
-- Placeholder for monster extraction from docs/rules.txt
-- Content will be added in Phase 6 (User Story 4)

-- ---------------------------------------------------------------------------
-- 8.6 Items (Weapons, Armor, Equipment)
-- ---------------------------------------------------------------------------
-- Placeholder for item extraction
-- Content will be added in Phase 7 (User Story 5)

-- ---------------------------------------------------------------------------
-- 8.7 Feats
-- ---------------------------------------------------------------------------
-- Placeholder for feat extraction from docs/handbook.txt
-- Content will be added in Phase 7 (User Story 5)

-- ---------------------------------------------------------------------------
-- 8.8 Backgrounds
-- ---------------------------------------------------------------------------
-- Placeholder for background extraction
-- Content will be added in Phase 7 (User Story 5)

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
