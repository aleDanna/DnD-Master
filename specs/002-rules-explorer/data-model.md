# Data Model: Rules & Handbook

**Feature**: 002-rules-explorer | **Date**: 2026-01-29 (Updated)

> **Note**: The complete database schema exists at `/migrations/001-dnd-content.sql`. This document provides an overview and documents the relationships relevant to the handbook feature.

## Entity Relationship Overview

```
                                    ┌─────────────┐
                                    │  abilities  │ (6 core stats)
                                    └──────┬──────┘
                                           │
                                    ┌──────┴──────┐
                                    │   skills    │
                                    └─────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RULES HIERARCHY                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌───────────────┐     ┌────────────────────┐     ┌────────────┐               │
│  │   documents   │────>│     chapters       │────>│  sections  │               │
│  └───────────────┘     └────────────────────┘     └────────────┘               │
│                                                                                  │
│  ┌────────────────────┐     ┌────────────┐                                      │
│  │  rule_categories   │────>│   rules    │                                      │
│  │  (self-ref parent) │     └─────┬──────┘                                      │
│  └────────────────────┘           │                                              │
│                            ┌──────┴─────────┐                                    │
│                            │ rule_references│ (cross-refs)                       │
│                            └────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CHARACTER OPTIONS                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌───────────┐     ┌─────────────┐     ┌────────────────┐                       │
│  │  classes  │────>│  subclasses │     │ class_features │<────┘                 │
│  └─────┬─────┘     └─────────────┘     └────────────────┘                       │
│        │                                                                         │
│        │           ┌─────────────┐                                               │
│        └──────────>│ class_spells│<────┐                                         │
│                    └─────────────┘     │                                         │
│                                        │                                         │
│  ┌───────────┐     ┌─────────────┐     │                                         │
│  │   races   │────>│  subraces   │     │                                         │
│  └───────────┘     └─────────────┘     │                                         │
│                                        │                                         │
│  ┌─────────────┐   ┌───────────┐       │                                         │
│  │ backgrounds │   │   feats   │       │                                         │
│  └─────────────┘   └───────────┘       │                                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            SPELLS & MONSTERS                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌───────────┐                    ┌────────────┐                                 │
│  │  spells   │                    │  monsters  │                                 │
│  └───────────┘                    └────────────┘                                 │
│                                                                                  │
│  ┌───────────┐     ┌──────────────┐                                              │
│  │   items   │     │  conditions  │                                              │
│  └───────────┘     └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tables by Category

### Reference Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **abilities** | 6 core ability scores (STR, DEX, CON, INT, WIS, CHA) | name, abbreviation, description |
| **skills** | 18 skills mapped to abilities | name, ability_id, description |
| **conditions** | Status effects (blinded, grappled, etc.) | name, description, embedding |

### Document Structure

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **documents** | Source document metadata | filename, doc_type, title |
| **chapters** | Document chapters | document_id, chapter_number, title |
| **sections** | Chapter subsections | chapter_id, title, content, embedding |

### Rules

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **rule_categories** | Hierarchical categories | name, slug, parent_id, sort_order |
| **rules** | Individual game rules | category_id, title, slug, content, summary, embedding |
| **rule_references** | Cross-references | source_rule_id, target_rule_id, reference_type |

### Character Options

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **classes** | Player classes | name, slug, hit_die, primary_ability, proficiencies |
| **subclasses** | Class specializations | class_id, name, subclass_level, features |
| **class_features** | Class/subclass abilities | class_id, subclass_id, name, level, description |
| **races** | Player races | name, ability_score_increase, traits, speed |
| **subraces** | Race variants | race_id, name, ability_score_increase, traits |
| **backgrounds** | Character backgrounds | name, skill_proficiencies, feature_description |
| **feats** | Optional abilities | name, prerequisites, description, benefits |

### Spells

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **spells** | Magic spells | name, level, school, casting_time, range, components, duration, concentration, ritual, description |
| **class_spells** | Which classes can cast which spells | class_id, subclass_id, spell_id |

### Monsters

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **monsters** | Creatures/enemies | name, size, monster_type, armor_class, hit_points, speed, ability_scores, challenge_rating, actions, traits |

### Items

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **items** | Equipment & magic items | name, item_type, rarity, damage, armor_class, weapon_properties, attunement_required |

---

## Key Relationships

### Class → Spells (Many-to-Many via class_spells)

```sql
-- Get all spells for a class
SELECT s.* FROM spells s
JOIN class_spells cs ON cs.spell_id = s.id
WHERE cs.class_id = :class_id
ORDER BY s.level, s.name;
```

### Class → Features (One-to-Many)

```sql
-- Get features for a class by level
SELECT * FROM class_features
WHERE class_id = :class_id
ORDER BY level, name;
```

### Rule Categories (Self-referential hierarchy)

```sql
-- Get category tree
WITH RECURSIVE category_tree AS (
  SELECT id, name, parent_id, 0 as depth
  FROM rule_categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.name, c.parent_id, ct.depth + 1
  FROM rule_categories c
  JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY depth, name;
```

---

## Enum Types

```sql
-- Document type
CREATE TYPE document_type AS ENUM ('rules', 'handbook', 'supplement', 'adventure');

-- Monster size
CREATE TYPE size_category AS ENUM ('Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan');

-- Item type
CREATE TYPE item_type AS ENUM ('weapon', 'armor', 'adventuring_gear', 'tool', 'mount', 'vehicle', 'trade_good', 'magic_item');

-- Item rarity
CREATE TYPE rarity AS ENUM ('common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact');
```

---

## Search Support

### Vector Embeddings

All searchable content tables have `embedding VECTOR(1536)` columns for semantic search:
- rules, rule_categories, sections
- spells, classes, subclasses, class_features
- races, subraces, monsters, items
- conditions, skills, backgrounds, feats

### Full-Text Indexes

GIN indexes exist on all text content fields for full-text search:

```sql
-- Examples from schema
CREATE INDEX idx_rules_content_fts ON rules USING GIN (to_tsvector('english', content));
CREATE INDEX idx_spells_description_fts ON spells USING GIN (to_tsvector('english', description));
CREATE INDEX idx_monsters_name_fts ON monsters USING GIN (to_tsvector('english', name));
```

---

## API Response Types

### Summary Card Types (Frontend)

```typescript
// Spell summary (Spells tab cards)
interface SpellSummary {
  id: string;
  name: string;
  slug: string;
  level: number;
  school: string;
  castingTime: string;
  concentration: boolean;
}

// Monster summary (Bestiary tab cards)
interface MonsterSummary {
  id: string;
  name: string;
  slug: string;
  size: string;
  monsterType: string;
  challengeRating: string;
  armorClass: number;
  hitPoints: number;
}

// Item summary (Equipment tab cards)
interface ItemSummary {
  id: string;
  name: string;
  slug: string;
  itemType: string;
  rarity: string | null;
  attunementRequired: boolean;
}

// Class summary (Characters tab cards)
interface ClassSummary {
  id: string;
  name: string;
  slug: string;
  hitDie: string;
  primaryAbility: string;
}

// Rule summary (Rules tab cards)
interface RuleSummary {
  id: string;
  title: string;
  slug: string;
  categoryPath: string[];
  summary: string;
}
```

### Search Result Type

```typescript
interface SearchResult {
  type: 'spell' | 'monster' | 'item' | 'class' | 'race' | 'rule' | 'feat' | 'background' | 'condition';
  id: string;
  name: string;
  slug: string;
  score: number;  // RRF fusion score
  excerpt: string;  // Relevant snippet
  attributes: Record<string, unknown>;  // Type-specific attributes
}

interface SearchResponse {
  query: string;
  total: number;
  groups: {
    type: string;
    count: number;
    results: SearchResult[];
  }[];
}
```

---

## Migration Reference

**Source**: `/migrations/001-dnd-content.sql`

This migration creates all tables, indexes, and initial reference data. The schema is idempotent and can be re-run safely.
