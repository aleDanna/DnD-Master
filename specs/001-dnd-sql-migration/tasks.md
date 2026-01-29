# Tasks: D&D Content SQL Migration Script

**Input**: Design documents from `/specs/001-dnd-sql-migration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: No automated tests required - verification is embedded in the SQL script via verification queries (Section 10).

**Organization**: Tasks are grouped by user story to enable incremental content extraction. All tasks write to a single output file: `migrations/001-dnd-content.sql`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different SQL sections, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Source Documents**: `docs/rules.txt`, `docs/handbook.txt`
- **Output**: `migrations/001-dnd-content.sql` (single SQL file)
- All tasks append/update sections in the same output file

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create project structure and initialize output file

- [ ] T001 Create migrations directory at repository root
- [ ] T002 Create migrations/001-dnd-content.sql with file header and section comments

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema creation that MUST be complete before ANY content can be inserted

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Write Section 1 (Extensions) in migrations/001-dnd-content.sql - CREATE EXTENSION for uuid-ossp and pgvector
- [ ] T004 Write Section 2 (Drop existing) in migrations/001-dnd-content.sql - DROP TABLE IF EXISTS CASCADE for all tables
- [ ] T005 Write Section 3 (ENUM types) in migrations/001-dnd-content.sql - document_type, size_category, item_type, rarity ENUMs
- [ ] T006 Write Section 4 (Tables - Independent) in migrations/001-dnd-content.sql - abilities, skills, conditions, documents tables
- [ ] T007 Write Section 4 (Tables - First-level deps) in migrations/001-dnd-content.sql - chapters, rule_categories, classes, races tables
- [ ] T008 Write Section 4 (Tables - Second-level deps) in migrations/001-dnd-content.sql - sections, rules, subclasses, subraces, class_features, spells, monsters, items, backgrounds, feats tables
- [ ] T009 Write Section 4 (Tables - Junction) in migrations/001-dnd-content.sql - rule_references, class_spells tables
- [ ] T010 Write Section 5 (Indexes - FTS) in migrations/001-dnd-content.sql - Full-text search indexes on content columns
- [ ] T011 Write Section 5 (Indexes - Vector) in migrations/001-dnd-content.sql - ivfflat indexes on embedding columns
- [ ] T012 Write Section 5 (Indexes - Unique) in migrations/001-dnd-content.sql - Unique indexes on slug columns
- [ ] T013 Write Section 5 (Indexes - FK) in migrations/001-dnd-content.sql - Foreign key indexes for query performance

**Checkpoint**: Schema ready - content extraction can now begin

---

## Phase 3: User Story 1 - Generate Complete SQL Migration Script (Priority: P1) 🎯 MVP

**Goal**: Create a working migration script with reference data and verification queries

**Independent Test**: Execute the script against a fresh PostgreSQL 18 database - all tables should be created and reference data populated

### Implementation for User Story 1

- [ ] T014 [US1] Write Section 6 (Reference data - Abilities) in migrations/001-dnd-content.sql - INSERT 6 abilities (STR, DEX, CON, INT, WIS, CHA)
- [ ] T015 [US1] Write Section 6 (Reference data - Skills) in migrations/001-dnd-content.sql - INSERT 18 skills with ability mappings
- [ ] T016 [US1] Write Section 6 (Reference data - Conditions) in migrations/001-dnd-content.sql - INSERT 15 conditions from docs/rules.txt
- [ ] T017 [US1] Write Section 6 (Reference data - Documents) in migrations/001-dnd-content.sql - INSERT document metadata for rules.txt and handbook.txt
- [ ] T018 [US1] Write Section 9 (Views) in migrations/001-dnd-content.sql - v_spell_list, v_class_spell_list, v_monster_by_cr views
- [ ] T019 [US1] Write Section 10 (Verification) in migrations/001-dnd-content.sql - SELECT COUNT(*) verification queries for all tables

**Checkpoint**: MVP script ready - creates schema, inserts reference data, includes verification. Can be tested independently.

---

## Phase 4: User Story 2 - Query D&D Rules by Category (Priority: P2)

**Goal**: Extract and categorize all rules content for full-text search

**Independent Test**: Query rules by category slug (e.g., 'combat') and verify content with source references

### Implementation for User Story 2

- [ ] T020 [US2] Analyze docs/rules.txt for rule category structure (Combat, Movement, Magic, Skills, etc.)
- [ ] T021 [US2] Write Section 7 (Rule categories) in migrations/001-dnd-content.sql - INSERT rule_categories with hierarchy
- [ ] T022 [US2] Extract rules from docs/rules.txt Part 2 (Ch. 7-9: Ability Scores, Adventuring, Combat)
- [ ] T023 [US2] Write Section 7 (Rules content) in migrations/001-dnd-content.sql - INSERT rules with source_page references
- [ ] T024 [US2] Write Section 7 (Rule references) in migrations/001-dnd-content.sql - INSERT rule_references for cross-links

**Checkpoint**: Rules queryable - full-text search on combat rules should return relevant results with page numbers

---

## Phase 5: User Story 3 - Retrieve Spell Information (Priority: P2)

**Goal**: Extract all spells with complete attributes and class relationships

**Independent Test**: Query for 'Fireball' spell and verify all attributes (level, school, components, description)

### Implementation for User Story 3

- [ ] T025 [P] [US3] Analyze docs/rules.txt Chapter 11 for spell extraction patterns
- [ ] T026 [P] [US3] Analyze docs/handbook.txt spell section for complete spell list
- [ ] T027 [US3] Write Section 8.4 (Spells - Cantrips) in migrations/001-dnd-content.sql - INSERT level 0 spells
- [ ] T028 [US3] Write Section 8.4 (Spells - 1st-3rd level) in migrations/001-dnd-content.sql - INSERT spells levels 1-3
- [ ] T029 [US3] Write Section 8.4 (Spells - 4th-6th level) in migrations/001-dnd-content.sql - INSERT spells levels 4-6
- [ ] T030 [US3] Write Section 8.4 (Spells - 7th-9th level) in migrations/001-dnd-content.sql - INSERT spells levels 7-9
- [ ] T031 [US3] Write Section 8.4 (Class-Spell relationships) in migrations/001-dnd-content.sql - INSERT class_spells junction records

**Checkpoint**: Spells queryable - can retrieve Wizard spell list, Fireball details, spells by school

---

## Phase 6: User Story 4 - Look Up Monster Statistics (Priority: P3)

**Goal**: Extract all monsters with complete stat blocks in JSONB format

**Independent Test**: Query for 'Goblin' monster and verify stat block (AC, HP, abilities, actions)

### Implementation for User Story 4

- [ ] T032 [P] [US4] Analyze docs/rules.txt Chapter 12 for monster stat block patterns
- [ ] T033 [US4] Write Section 8.5 (Monsters - CR 0-1) in migrations/001-dnd-content.sql - INSERT low-level creatures
- [ ] T034 [US4] Write Section 8.5 (Monsters - CR 2-5) in migrations/001-dnd-content.sql - INSERT mid-level creatures
- [ ] T035 [US4] Write Section 8.5 (Monsters - CR 6+) in migrations/001-dnd-content.sql - INSERT high-level creatures with legendary actions

**Checkpoint**: Monsters queryable - can filter by CR, retrieve complete stat blocks with JSONB actions

---

## Phase 7: User Story 5 - Browse Character Creation Options (Priority: P3)

**Goal**: Extract all character creation content (races, classes, backgrounds, feats)

**Independent Test**: Query for Fighter class and verify hit die, proficiencies, and subclasses

### Implementation for User Story 5

- [ ] T036 [P] [US5] Analyze docs/rules.txt and docs/handbook.txt for class/race structure
- [ ] T037 [US5] Write Section 8.1 (Classes) in migrations/001-dnd-content.sql - INSERT 12 classes with proficiencies
- [ ] T038 [US5] Write Section 8.1 (Subclasses) in migrations/001-dnd-content.sql - INSERT 36+ subclasses
- [ ] T039 [US5] Write Section 8.2 (Class Features) in migrations/001-dnd-content.sql - INSERT features by level
- [ ] T040 [US5] Write Section 8.3 (Races) in migrations/001-dnd-content.sql - INSERT 9 races with traits
- [ ] T041 [US5] Write Section 8.3 (Subraces) in migrations/001-dnd-content.sql - INSERT 15+ subraces
- [ ] T042 [US5] Write Section 8.6 (Items - Weapons) in migrations/001-dnd-content.sql - INSERT weapons with properties
- [ ] T043 [US5] Write Section 8.6 (Items - Armor) in migrations/001-dnd-content.sql - INSERT armor with AC values
- [ ] T044 [US5] Write Section 8.6 (Items - Equipment) in migrations/001-dnd-content.sql - INSERT adventuring gear
- [ ] T045 [US5] Write Section 8.7 (Feats) in migrations/001-dnd-content.sql - INSERT 40+ feats from handbook
- [ ] T046 [US5] Write Section 8.8 (Backgrounds) in migrations/001-dnd-content.sql - INSERT 15+ backgrounds

**Checkpoint**: Character options queryable - can browse all races, classes, view Fighter features by level

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation

- [ ] T047 [P] Review all INSERT statements for proper single quote escaping
- [ ] T048 [P] Verify all slugs are URL-safe (lowercase, hyphens, no special chars)
- [ ] T049 Run complete script against fresh PostgreSQL 18 database
- [ ] T050 Verify all COUNT(*) queries return expected entity counts
- [ ] T051 Test idempotency by running script twice
- [ ] T052 Add SQL comments documenting any content extraction edge cases

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - creates MVP deliverable
- **User Stories 2-5 (Phase 4-7)**: Depend on Foundational; can run in parallel after US1
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - delivers MVP script
- **User Story 2 (P2)**: Can start after Foundational - adds rules content
- **User Story 3 (P2)**: Can start after Foundational - adds spells content
- **User Story 4 (P3)**: Can start after Foundational - adds monsters content
- **User Story 5 (P3)**: Can start after Foundational - adds character options content

### Within Each User Story

- Document analysis tasks can run in parallel
- Content extraction follows logical grouping (related entities together)
- Each phase adds content to the same SQL file
- Verification at each checkpoint confirms data integrity

### Parallel Opportunities

- **Foundational phase**: T010-T013 (index creation) can be written in parallel
- **US3**: T025-T026 (document analysis) can run in parallel
- **US4**: T032 can run while US3 is completing
- **US5**: T036 can run while US4 is completing
- **Polish**: T047-T048 can run in parallel

---

## Parallel Example: User Story 3 (Spells)

```bash
# Launch document analysis in parallel:
Task T025: "Analyze docs/rules.txt Chapter 11 for spell extraction patterns"
Task T026: "Analyze docs/handbook.txt spell section for complete spell list"

# Then extract spells sequentially by level (can batch for efficiency)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (schema creation)
3. Complete Phase 3: User Story 1 (reference data + views + verification)
4. **STOP and VALIDATE**: Execute script on fresh database
5. Script creates all tables with reference data - MVP ready!

### Incremental Delivery

1. Complete Setup + Foundational → Schema ready
2. Add User Story 1 → Test independently → MVP script works!
3. Add User Story 2 → Test rules queries → Rules searchable
4. Add User Story 3 → Test spell queries → Spells queryable
5. Add User Story 4 → Test monster queries → Monsters queryable
6. Add User Story 5 → Test character options → Full content available

### Content Volume Tracking

| User Story | Entity Types | Estimated Records |
|------------|--------------|-------------------|
| US1 (MVP) | abilities, skills, conditions, documents | ~40 |
| US2 | rule_categories, rules, rule_references | ~150 |
| US3 | spells, class_spells | ~400 |
| US4 | monsters | ~150 |
| US5 | classes, subclasses, class_features, races, subraces, items, backgrounds, feats | ~500 |

**Total estimated**: ~1,240 records across 19+ tables

---

## Notes

- [P] tasks = different SQL sections, no dependencies
- [Story] label maps task to specific user story for traceability
- All content goes into one SQL file: migrations/001-dnd-content.sql
- Verify single quotes are escaped: `'` → `''`
- All embeddings set to NULL (populated later by separate process)
- Commit after each phase checkpoint
- Stop at any checkpoint to validate incrementally
