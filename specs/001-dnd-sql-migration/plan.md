# Implementation Plan: D&D Content SQL Migration Script

**Branch**: `001-dnd-sql-migration` | **Date**: 2026-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dnd-sql-migration/spec.md`

## Summary

Generate a pure PostgreSQL 18 SQL script that extracts all D&D rules and player handbook content from source documents in `/docs` (rules.txt ~25K lines, handbook.txt ~47K lines) into a normalized relational database schema with pgvector support for semantic search. The script must be idempotent, create 19+ tables, populate all content with proper escaping, and include verification queries.

## Technical Context

**Language/Version**: PostgreSQL 18 + pgvector extension (SQL DDL/DML only)
**Primary Dependencies**: pgvector for VECTOR(1536) columns, uuid-ossp for gen_random_uuid()
**Storage**: PostgreSQL with normalized relational schema + JSONB for complex fields
**Testing**: SQL verification queries embedded in script; manual execution against fresh database
**Target Platform**: PostgreSQL 18 database (Supabase compatible)
**Project Type**: Single SQL script output (no application code)
**Performance Goals**: Full-text search queries return results within 1 second
**Constraints**: Script must be idempotent (re-runnable), all content extracted (no summaries)
**Scale/Scope**: ~72K lines of source content, 19+ database tables, hundreds of entities

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Single deliverable (one SQL file)
- [x] No external dependencies beyond PostgreSQL extensions
- [x] No application code required (pure SQL)
- [x] Clear input/output boundaries (docs/ -> migration.sql)

## Project Structure

### Documentation (this feature)

```text
specs/001-dnd-sql-migration/
├── spec.md              # Feature specification
├── plan.md              # This file
├── checklists/
│   └── requirements.md  # Quality checklist (passed)
└── tasks.md             # Implementation tasks (to be created)
```

### Source Code (repository root)

```text
docs/                    # Source documents (INPUT)
├── rules.txt            # D&D Basic Rules (~25K lines)
├── rules.pdf            # PDF version (backup)
├── handbook.txt         # Player's Handbook (~47K lines)
└── handbook.pdf         # PDF version (backup)

migrations/              # Generated SQL script (OUTPUT)
└── 001-dnd-content.sql  # Complete migration script
```

**Structure Decision**: Single SQL file output in `migrations/` directory. Source documents remain in `docs/`. No application code needed - this is a pure data migration task.

## Complexity Tracking

No constitution violations - this is a straightforward single-file deliverable.

---

## Phase 0: Document Analysis Research

### Source Document Structure

**rules.txt** (D&D Basic Rules v1.0, November 2018):
- Part 1: Creating a Character (Ch. 1-6)
  - Races: Dwarf, Elf, Halfling, Human
  - Classes: Cleric, Fighter, Rogue, Wizard
  - Backgrounds, Equipment, Customization
- Part 2: Playing the Game (Ch. 7-9)
  - Ability Scores, Adventuring, Combat rules
- Part 3: Rules of Magic (Ch. 10-11)
  - Spellcasting rules, Spell descriptions
- Part 4: DM's Tools (Ch. 12-13)
  - Monsters (stat blocks), Combat Encounters

**handbook.txt** (Player's Handbook):
- Expanded content with all 12 classes
- All playable races with subraces
- Complete spell list (300+ spells)
- Feats, expanded backgrounds

### Entity Extraction Patterns

**Spells** (identified pattern):
```
[Spell Name]

[Level]-level [school]
Casting Time: [time]
Range: [range]
Components: V, S, M ([materials])
Duration: [duration]
[Description paragraphs]
At Higher Levels. [scaling text]
```

**Monsters** (identified pattern):
```
[Monster Name]

[Size] [type], [alignment]
Armor Class [AC] ([armor type])
Hit Points [HP] ([dice])
Speed [speed] ft.
STR [score] DEX [score] CON [score] INT [score] WIS [score] CHA [score]
[Skills, Senses, Languages, Challenge Rating]
[Traits]
[Actions]
```

**Classes** (identified pattern):
- Class name, hit die, proficiencies
- Class features by level
- Subclass options at specific levels
- Spell lists (for casters)

### Content Volume Estimates

| Entity Type | Estimated Count | Source |
|-------------|-----------------|--------|
| Rules | 50-100 | Both documents |
| Spells | 300+ | Primarily handbook |
| Classes | 12 | handbook |
| Subclasses | 36+ | handbook |
| Races | 9 | Both documents |
| Subraces | 15+ | handbook |
| Monsters | 150+ | rules.txt Ch. 12 |
| Items | 100+ | Equipment chapters |
| Backgrounds | 15+ | Both documents |
| Feats | 40+ | handbook |
| Conditions | 15 | rules |
| Skills | 18 | Standard D&D 5e |

---

## Phase 1: Database Schema Design

### Table Dependency Order (for CREATE statements)

1. **Independent tables** (no foreign keys):
   - `abilities` (STR, DEX, CON, INT, WIS, CHA)
   - `skills` (reference table)
   - `conditions` (reference table)
   - `documents` (source tracking)

2. **First-level dependencies**:
   - `chapters` (depends on documents)
   - `rule_categories` (self-referential for hierarchy)
   - `classes` (independent)
   - `races` (independent)

3. **Second-level dependencies**:
   - `sections` (depends on chapters)
   - `rules` (depends on rule_categories)
   - `subclasses` (depends on classes)
   - `subraces` (depends on races)
   - `class_features` (depends on classes, subclasses)
   - `spells` (independent but needs class_spells)
   - `monsters` (independent)
   - `items` (independent)
   - `backgrounds` (independent)
   - `feats` (independent)

4. **Junction tables**:
   - `rule_references` (depends on rules)
   - `class_spells` (depends on classes, subclasses, spells)

### SQL Script Section Structure

```sql
-- SECTION 1: Extensions
-- SECTION 2: Drop existing (idempotent)
-- SECTION 3: ENUM types
-- SECTION 4: Tables (dependency order)
-- SECTION 5: Indexes (FTS, vector, unique, FK)
-- SECTION 6: Reference data (abilities, skills, conditions)
-- SECTION 7: Rules content
-- SECTION 8: Player content (classes, races, spells, monsters, items)
-- SECTION 9: Views
-- SECTION 10: Verification queries
```

### Key Schema Decisions

1. **UUID primary keys**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
2. **Timestamps**: `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
3. **Embeddings**: `embedding VECTOR(1536)` initialized as NULL
4. **Slugs**: Generated as lowercase, hyphenated, URL-safe
5. **JSONB fields**: For monster actions, speed types, weapon properties
6. **Source tracing**: `source_document TEXT`, `source_page INT`

---

## Phase 2: Implementation Tasks

### Task Breakdown

1. **Schema Generation** (Section 1-5)
   - Extensions and prerequisites
   - DROP IF EXISTS statements
   - ENUM type definitions
   - CREATE TABLE statements
   - Index creation

2. **Reference Data** (Section 6)
   - 6 abilities (STR, DEX, CON, INT, WIS, CHA)
   - 18 skills with ability mappings
   - 15 conditions with descriptions
   - Document metadata entries

3. **Content Extraction - Rules** (Section 7)
   - Rule categories hierarchy
   - Individual rules with source references
   - Rule cross-references

4. **Content Extraction - Classes** (Section 8.1-8.2)
   - 12 classes with proficiencies
   - 36+ subclasses
   - Class features by level

5. **Content Extraction - Races** (Section 8.3)
   - 9 races with traits
   - 15+ subraces

6. **Content Extraction - Spells** (Section 8.4)
   - 300+ spells with all attributes
   - Class-spell relationships

7. **Content Extraction - Monsters** (Section 8.5)
   - 150+ monsters with stat blocks
   - JSONB for actions, traits

8. **Content Extraction - Items** (Section 8.6)
   - Weapons, armor, adventuring gear
   - Magic items with properties

9. **Content Extraction - Other** (Section 8.7-8.8)
   - Feats
   - Backgrounds

10. **Views and Verification** (Section 9-10)
    - Common query views
    - Row count verification

### Acceptance Criteria Per Task

Each task must:
- Generate valid PostgreSQL 18 SQL
- Properly escape all single quotes (`'` → `''`)
- Use gen_random_uuid() for IDs
- Include source_document and source_page where applicable
- Generate URL-safe slugs
- Use NULL for embedding columns

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Inconsistent document formatting | Use flexible parsing patterns; document edge cases in SQL comments |
| Missing content from extraction | Verification queries count all entities; compare to source |
| SQL injection via content | Proper escaping of all text content |
| Performance on large dataset | Batch INSERTs; create indexes after data load |

---

## Next Steps

1. Run `/speckit.tasks` to generate detailed implementation checklist
2. Execute tasks in order, generating SQL sections incrementally
3. Test complete script against fresh PostgreSQL 18 database
4. Verify all entity counts match source document content
