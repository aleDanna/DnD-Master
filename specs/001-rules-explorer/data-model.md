# Data Model: Rules Explorer

**Feature**: 001-rules-explorer
**Date**: 2026-01-30
**Source**: [spec.md](./spec.md) Key Entities section

## Entity Overview

```
┌─────────────────┐     ┌─────────────────┐
│  RuleCategory   │────<│      Rule       │
└─────────────────┘     └─────────────────┘
        │ (self-ref)
        └──────────────────┐

┌─────────────────┐     ┌─────────────────┐
│     Class       │────<│    Subclass     │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│      Race       │────<│    Subrace      │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│     Spell       │────<│  SpellClass     │────>│     Class       │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Monster      │     │      Item       │     │   Background    │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      Feat       │     │   Condition     │     │     Skill       │
└─────────────────┘     └─────────────────┘     └─────────────────┘

All entities reference:
┌─────────────────┐
│  SourceCitation │ (embedded in each entity)
└─────────────────┘
```

## Entity Definitions

### RuleCategory

Represents a hierarchical grouping of rules (e.g., Combat, Adventuring).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | string | required, max 100 | Display name |
| slug | string | required, unique | URL-friendly identifier |
| parent_id | UUID | FK nullable | Reference to parent category (null for top-level) |
| sort_order | integer | required | Display order within parent |
| description | text | nullable | Optional category description |
| created_at | timestamp | required | Creation timestamp |
| updated_at | timestamp | required | Last update timestamp |

**Indexes**: `(parent_id, sort_order)`, `(slug)`

### Rule

Individual rule entry within a category.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| title | string | required, max 200 | Rule title |
| slug | string | required, unique | URL-friendly identifier |
| category_id | UUID | FK required | Parent category reference |
| summary | text | nullable | Brief summary (for search results) |
| content | text | required | Full rule content (markdown) |
| keywords | text[] | nullable | Searchable keywords array |
| source_document | string | nullable | Source book name |
| source_page | integer | nullable | Page number in source |
| search_vector | tsvector | generated | Full-text search index |
| embedding | vector(1536) | nullable | Semantic search embedding |
| created_at | timestamp | required | Creation timestamp |
| updated_at | timestamp | required | Last update timestamp |

**Indexes**: `(category_id)`, `(slug)`, GIN on `(search_vector)`, IVFFlat on `(embedding)`

### Class

D&D character class.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | string | required, max 50 | Class name |
| slug | string | required, unique | URL-friendly identifier |
| description | text | required | Class description |
| hit_die | string | required | Hit die type (e.g., "d10") |
| primary_ability | string | required | Primary ability score |
| saving_throws | text[] | required | Proficient saving throws |
| armor_proficiencies | text[] | nullable | Armor proficiencies |
| weapon_proficiencies | text[] | nullable | Weapon proficiencies |
| tool_proficiencies | text[] | nullable | Tool proficiencies |
| skill_choices | jsonb | nullable | Skill choice options |
| features | jsonb | required | Features by level (array of {level, name, description}) |
| source_document | string | nullable | Source book name |
| source_page | integer | nullable | Page number |
| search_vector | tsvector | generated | Full-text search index |
| embedding | vector(1536) | nullable | Semantic search embedding |
| created_at | timestamp | required | Creation timestamp |
| updated_at | timestamp | required | Last update timestamp |

**Indexes**: `(slug)`, GIN on `(search_vector)`, GIN on `(features)`

### Subclass

Specialization within a class.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | string | required, max 100 | Subclass name |
| slug | string | required, unique | URL-friendly identifier |
| class_id | UUID | FK required | Parent class reference |
| description | text | required | Subclass description |
| features | jsonb | required | Features by level |
| source_document | string | nullable | Source book name |
| source_page | integer | nullable | Page number |
| search_vector | tsvector | generated | Full-text search index |
| embedding | vector(1536) | nullable | Semantic search embedding |
| created_at | timestamp | required | Creation timestamp |
| updated_at | timestamp | required | Last update timestamp |

**Indexes**: `(class_id)`, `(slug)`

### Race

D&D character race.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | string | required, max 50 | Race name |
| slug | string | required, unique | URL-friendly identifier |
| description | text | required | Race description |
| ability_score_increase | jsonb | required | Ability score modifiers |
| age_description | text | nullable | Age characteristics |
| size | string | required | Size category |
| speed | integer | required | Base walking speed |
| languages | text[] | required | Known languages |
| traits | jsonb | required | Racial traits (array of {name, description}) |
| source_document | string | nullable | Source book name |
| source_page | integer | nullable | Page number |
| search_vector | tsvector | generated | Full-text search index |
| embedding | vector(1536) | nullable | Semantic search embedding |
| created_at | timestamp | required | Creation timestamp |
| updated_at | timestamp | required | Last update timestamp |

**Indexes**: `(slug)`, GIN on `(search_vector)`

### Subrace

Variant within a race.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | string | required, max 100 | Subrace name |
| slug | string | required, unique | URL-friendly identifier |
| race_id | UUID | FK required | Parent race reference |
| description | text | nullable | Subrace description |
| ability_score_increase | jsonb | nullable | Additional modifiers |
| traits | jsonb | nullable | Additional or modified traits |
| source_document | string | nullable | Source book name |
| source_page | integer | nullable | Page number |
| search_vector | tsvector | generated | Full-text search index |
| embedding | vector(1536) | nullable | Semantic search embedding |
| created_at | timestamp | required | Creation timestamp |
| updated_at | timestamp | required | Last update timestamp |

**Indexes**: `(race_id)`, `(slug)`

### Spell

Magic spell.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | string | required, max 100 | Spell name |
| slug | string | required, unique | URL-friendly identifier |
| level | integer | required, 0-9 | Spell level (0 = cantrip) |
| school | string | required | Magic school |
| casting_time | string | required | Casting time |
| range | string | required | Range |
| components | jsonb | required | {verbal, somatic, material, material_description} |
| duration | string | required | Duration |
| concentration | boolean | required | Requires concentration |
| ritual | boolean | required | Can be cast as ritual |
| description | text | required | Full spell description |
| higher_levels | text | nullable | At higher levels text |
| source_document | string | nullable | Source book name |
| source_page | integer | nullable | Page number |
| search_vector | tsvector | generated | Full-text search index |
| embedding | vector(1536) | nullable | Semantic search embedding |
| created_at | timestamp | required | Creation timestamp |
| updated_at | timestamp | required | Last update timestamp |

**Indexes**: `(level)`, `(school)`, `(slug)`, GIN on `(search_vector)`

### SpellClass (Junction Table)

Associates spells with classes that can cast them.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| spell_id | UUID | FK, PK | Spell reference |
| class_id | UUID | FK, PK | Class reference |

**Indexes**: `(class_id, spell_id)`

### Monster

Creature entry from bestiary.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | string | required, max 100 | Monster name |
| slug | string | required, unique | URL-friendly identifier |
| size | string | required | Size category |
| type | string | required | Creature type (e.g., "beast", "undead") |
| subtype | string | nullable | Creature subtype |
| alignment | string | nullable | Alignment |
| armor_class | integer | required | AC value |
| armor_type | string | nullable | Armor description |
| hit_points | integer | required | Average HP |
| hit_dice | string | required | Hit dice formula |
| speed | jsonb | required | Speed by type (walk, fly, swim, etc.) |
| ability_scores | jsonb | required | {str, dex, con, int, wis, cha} |
| saving_throws | jsonb | nullable | Saving throw bonuses |
| skills | jsonb | nullable | Skill bonuses |
| damage_vulnerabilities | text[] | nullable | Damage vulnerabilities |
| damage_resistances | text[] | nullable | Damage resistances |
| damage_immunities | text[] | nullable | Damage immunities |
| condition_immunities | text[] | nullable | Condition immunities |
| senses | jsonb | nullable | Special senses |
| languages | text[] | nullable | Known languages |
| challenge_rating | string | required | CR (e.g., "1/4", "5", "21") |
| challenge_rating_numeric | decimal | required | Numeric CR for sorting/filtering |
| experience_points | integer | required | XP value |
| traits | jsonb | nullable | Special traits |
| actions | jsonb | required | Actions |
| reactions | jsonb | nullable | Reactions |
| legendary_actions | jsonb | nullable | Legendary actions |
| lair_actions | jsonb | nullable | Lair actions |
| description | text | nullable | Flavor description |
| source_document | string | nullable | Source book name |
| source_page | integer | nullable | Page number |
| search_vector | tsvector | generated | Full-text search index |
| embedding | vector(1536) | nullable | Semantic search embedding |
| created_at | timestamp | required | Creation timestamp |
| updated_at | timestamp | required | Last update timestamp |

**Indexes**: `(type)`, `(challenge_rating_numeric)`, `(slug)`, GIN on `(search_vector)`

### Item

Equipment or object.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | string | required, max 100 | Item name |
| slug | string | required, unique | URL-friendly identifier |
| type | string | required | Item type (weapon, armor, gear, magic) |
| subtype | string | nullable | Item subtype |
| rarity | string | nullable | Rarity for magic items |
| cost | jsonb | nullable | {amount, currency} |
| weight | decimal | nullable | Weight in pounds |
| properties | text[] | nullable | Weapon/armor properties |
| damage | jsonb | nullable | Damage for weapons |
| armor_class | jsonb | nullable | AC for armor |
| description | text | required | Item description |
| requires_attunement | boolean | nullable | Magic item attunement |
| source_document | string | nullable | Source book name |
| source_page | integer | nullable | Page number |
| search_vector | tsvector | generated | Full-text search index |
| embedding | vector(1536) | nullable | Semantic search embedding |
| created_at | timestamp | required | Creation timestamp |
| updated_at | timestamp | required | Last update timestamp |

**Indexes**: `(type)`, `(rarity)`, `(slug)`, GIN on `(search_vector)`

### Background

Character background.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | string | required, max 100 | Background name |
| slug | string | required, unique | URL-friendly identifier |
| description | text | required | Background description |
| skill_proficiencies | text[] | required | Granted skill proficiencies |
| tool_proficiencies | text[] | nullable | Granted tool proficiencies |
| languages | integer | nullable | Number of language choices |
| equipment | text | required | Starting equipment |
| feature_name | string | required | Background feature name |
| feature_description | text | required | Background feature description |
| suggested_characteristics | jsonb | nullable | Personality traits, ideals, bonds, flaws |
| source_document | string | nullable | Source book name |
| source_page | integer | nullable | Page number |
| search_vector | tsvector | generated | Full-text search index |
| embedding | vector(1536) | nullable | Semantic search embedding |
| created_at | timestamp | required | Creation timestamp |
| updated_at | timestamp | required | Last update timestamp |

**Indexes**: `(slug)`, GIN on `(search_vector)`

### Feat

Character feat.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | string | required, max 100 | Feat name |
| slug | string | required, unique | URL-friendly identifier |
| prerequisites | text | nullable | Prerequisites text |
| description | text | required | Feat description |
| benefits | jsonb | nullable | Structured benefits |
| source_document | string | nullable | Source book name |
| source_page | integer | nullable | Page number |
| search_vector | tsvector | generated | Full-text search index |
| embedding | vector(1536) | nullable | Semantic search embedding |
| created_at | timestamp | required | Creation timestamp |
| updated_at | timestamp | required | Last update timestamp |

**Indexes**: `(slug)`, GIN on `(search_vector)`

### Condition

Status condition.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | string | required, max 50 | Condition name |
| slug | string | required, unique | URL-friendly identifier |
| description | text | required | Condition effects |
| source_document | string | nullable | Source book name |
| source_page | integer | nullable | Page number |
| search_vector | tsvector | generated | Full-text search index |
| embedding | vector(1536) | nullable | Semantic search embedding |
| created_at | timestamp | required | Creation timestamp |
| updated_at | timestamp | required | Last update timestamp |

**Indexes**: `(slug)`, GIN on `(search_vector)`

### Skill

Character skill.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | string | required, max 50 | Skill name |
| slug | string | required, unique | URL-friendly identifier |
| ability | string | required | Associated ability score |
| description | text | required | Skill description |
| source_document | string | nullable | Source book name |
| source_page | integer | nullable | Page number |
| search_vector | tsvector | generated | Full-text search index |
| embedding | vector(1536) | nullable | Semantic search embedding |
| created_at | timestamp | required | Creation timestamp |
| updated_at | timestamp | required | Last update timestamp |

**Indexes**: `(ability)`, `(slug)`, GIN on `(search_vector)`

## Validation Rules

### Cross-Entity Validations

1. **RuleCategory.parent_id** must reference an existing RuleCategory or be null
2. **Rule.category_id** must reference an existing RuleCategory
3. **Subclass.class_id** must reference an existing Class
4. **Subrace.race_id** must reference an existing Race
5. **SpellClass** entries must reference valid Spell and Class records

### Field Validations

1. **slug** fields: lowercase alphanumeric with hyphens only, max 100 chars
2. **level** (Spell): integer 0-9
3. **challenge_rating_numeric** (Monster): valid CR values (0, 0.125, 0.25, 0.5, 1-30)
4. **search_vector**: auto-generated, not directly writable
5. **embedding**: 1536-dimension vector or null

## Search Vector Generation

For each table with `search_vector`, create a trigger:

```sql
-- Example for rules table
CREATE OR REPLACE FUNCTION update_rule_search_vector()
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
```

## Notes

- All UUIDs generated using `gen_random_uuid()` or application layer
- Timestamps use `TIMESTAMPTZ` for timezone awareness
- JSONB used for flexible structured data (features, traits, etc.)
- Array types (`text[]`) for simple lists without relationships
- Vector column requires pgvector extension: `CREATE EXTENSION vector;`
