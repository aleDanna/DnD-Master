# Feature Specification: D&D Content SQL Migration Script

**Feature Branch**: `003-dnd-content-migration`
**Created**: 2026-01-29
**Status**: Draft
**Input**: Generate a PostgreSQL SQL script that parses and transposes all D&D rules and player handbook content from source documents in `/docs` into a normalized relational database schema with pgvector support for semantic search.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initialize D&D Content Database (Priority: P1)

A database administrator runs the generated SQL script against a fresh PostgreSQL database to populate it with all D&D game content, creating the complete schema and inserting all extracted data from source documents.

**Why this priority**: This is the core deliverable - without a working SQL script that successfully creates and populates the database, no other functionality is possible. The AI Dungeon Master application cannot function without structured access to game content.

**Independent Test**: Can be fully tested by executing the SQL script against an empty PostgreSQL database and verifying all tables are created with correct data counts matching source document content.

**Acceptance Scenarios**:

1. **Given** a fresh PostgreSQL database with pgvector extension available, **When** the administrator executes the generated SQL script, **Then** all tables are created without errors and all D&D content from source documents is inserted.
2. **Given** a database that already contains the D&D content tables, **When** the administrator re-runs the SQL script, **Then** the script completes without errors (idempotent execution) and data integrity is preserved.
3. **Given** the SQL script has been executed, **When** the administrator runs the verification queries at the end of the script, **Then** all entity counts are displayed confirming data was inserted correctly.

---

### User Story 2 - Query Rules by Category (Priority: P2)

The AI Dungeon Master application queries the database to retrieve specific game rules organized by category (Combat, Movement, Magic, Skills, Conditions) to provide contextual gameplay assistance to players during a session.

**Why this priority**: Rules lookup is the most common operation during gameplay. Players and DMs need quick access to specific rules without searching through entire documents.

**Independent Test**: Can be tested by running SQL queries against the rules table filtering by category and verifying returned content matches the source document organization.

**Acceptance Scenarios**:

1. **Given** the D&D content database is populated, **When** querying rules by category (e.g., "Combat"), **Then** all rules belonging to that category are returned with their full content, titles, and source references.
2. **Given** a rule that references other rules, **When** retrieving that rule, **Then** the cross-references are available through the rule_references table to enable navigation to related rules.
3. **Given** a rules query, **When** using full-text search on rule content, **Then** relevant rules are returned ranked by relevance.

---

### User Story 3 - Search Spells and Class Content (Priority: P3)

The AI Dungeon Master application searches for spells by various attributes (level, school, class, components) and retrieves class information including features and subclasses to assist players with character abilities.

**Why this priority**: Spell and class lookups are essential for character gameplay. Players frequently need to reference their available spells and class features during combat and roleplay.

**Independent Test**: Can be tested by querying the spells table with various filters and verifying the class_spells junction table correctly links classes to their spell lists.

**Acceptance Scenarios**:

1. **Given** the database is populated, **When** searching for spells by level and school, **Then** matching spells are returned with all attributes (casting time, range, components, duration, description).
2. **Given** a specific class, **When** querying for available spells, **Then** all spells that class can cast are returned through the class_spells relationship.
3. **Given** a class, **When** querying for class features, **Then** features are returned ordered by the level at which they are acquired.

---

### User Story 4 - Lookup Monsters and Items (Priority: P4)

The AI Dungeon Master application retrieves monster statistics and magic item descriptions to prepare encounters and handle loot distribution during gameplay.

**Why this priority**: Monster stats are essential for combat encounters and item lookups support treasure/loot scenarios. These are DM-focused features supporting encounter management.

**Independent Test**: Can be tested by querying monsters by challenge rating and items by rarity, verifying all expected attributes are populated.

**Acceptance Scenarios**:

1. **Given** the database is populated, **When** querying monsters by challenge rating, **Then** monsters are returned with complete stat blocks including abilities, actions, and special traits.
2. **Given** a monster marked as a boss, **When** querying for boss monsters, **Then** the monster's legendary actions and lair actions are included.
3. **Given** the items table, **When** filtering by item type and rarity, **Then** matching items are returned with complete descriptions and relevant properties.

---

### User Story 5 - Semantic Search Preparation (Priority: P5)

The database schema includes embedding columns on all content tables with proper vector indexes, enabling future integration with semantic search capabilities for natural language queries.

**Why this priority**: While embeddings will be populated later by a separate process, the schema must be ready to support semantic search. This is foundational infrastructure for advanced AI features.

**Independent Test**: Can be tested by verifying all content tables have a VECTOR(1536) embedding column and appropriate vector indexes exist.

**Acceptance Scenarios**:

1. **Given** the database schema is created, **When** inspecting content tables (rules, spells, monsters, items, etc.), **Then** each table contains an `embedding` column of type VECTOR(1536) with NULL values.
2. **Given** the embedding columns exist, **When** checking indexes, **Then** vector similarity indexes exist for efficient cosine similarity searches.

---

### Edge Cases

- What happens when source documents contain inconsistent formatting or OCR artifacts?
  - The script should handle common text artifacts and escape special characters properly.
- How does the system handle duplicate entity names across different sources?
  - Entities are distinguished by their source_document reference; slug uniqueness is enforced per table.
- What happens when a rule or entity references another that doesn't exist in the source documents?
  - Cross-references are created only for entities that exist; missing references are omitted gracefully.
- How are spell components with special characters (material components with apostrophes) handled?
  - All text content is properly escaped with single quotes doubled for PostgreSQL.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The SQL script MUST create all necessary database extensions (uuid-ossp, pgvector) before creating tables.
- **FR-002**: The SQL script MUST be fully idempotent - safe to run multiple times without causing errors or data corruption.
- **FR-003**: The SQL script MUST drop existing tables (if any) before recreating them to ensure clean state.
- **FR-004**: The SQL script MUST create tables in proper dependency order (parent tables before child tables with foreign keys).
- **FR-005**: The SQL script MUST use UUID primary keys with gen_random_uuid() as default for all tables.
- **FR-006**: The SQL script MUST include created_at and updated_at timestamp columns on all tables.
- **FR-007**: The SQL script MUST extract and insert ALL content from both source documents (rules.txt and handbook.txt) - no content should be summarized or omitted.
- **FR-008**: The SQL script MUST properly escape all single quotes in text content for PostgreSQL compatibility.
- **FR-009**: The SQL script MUST generate URL-safe slugs for all named entities (lowercase, hyphens, no special characters).
- **FR-010**: The SQL script MUST create full-text search indexes on content columns using GIN indexes with English text search configuration.
- **FR-011**: The SQL script MUST create vector similarity indexes on embedding columns for future semantic search.
- **FR-012**: The SQL script MUST create foreign key indexes for query performance.
- **FR-013**: The SQL script MUST include verification queries at the end that display entity counts for all populated tables.
- **FR-014**: The SQL script MUST maintain source traceability with source_document, source_chapter, and source_page columns where applicable.
- **FR-015**: The SQL script MUST create views for common query patterns (spell lists, class spell lists, monsters by challenge rating).

### Key Entities

- **Document**: Represents a source document (rules or handbook) with metadata including filename, type, title, and description.
- **Chapter**: Represents a chapter within a document, with chapter number, title, and page range.
- **Section**: Represents a section within a chapter, containing the actual content text and embedding vector.
- **Rule Category**: Hierarchical categorization of rules (e.g., Combat > Melee Attacks, Magic > Spellcasting).
- **Rule**: Individual game rule with title, content, summary, and references to related rules.
- **Class**: Player character class with hit die, proficiencies, and starting equipment.
- **Subclass**: Specialization of a class available at a specific level.
- **Class Feature**: Ability or trait gained by a class or subclass at a specific level.
- **Spell**: Magic spell with all attributes (level, school, components, duration, description).
- **Monster**: Creature with complete stat block (abilities, AC, HP, speed, actions, traits).
- **Item**: Equipment or magic item with type, rarity, and specific properties (weapon damage, armor AC).
- **Race**: Player character race with traits and ability score modifiers.
- **Subrace**: Variant of a race with additional or modified traits.
- **Background**: Character background with proficiencies, equipment, and feature.
- **Feat**: Optional character ability with prerequisites and benefits.
- **Condition**: Status effect (blinded, frightened, etc.) with mechanical effects.
- **Skill**: Character skill with associated ability score.
- **Ability**: Core ability score (Strength, Dexterity, etc.) with description.

## Assumptions

- **PostgreSQL Version**: The target database is PostgreSQL 16+ (pgvector requires PostgreSQL 11+, gen_random_uuid() is built-in from PostgreSQL 13+).
- **pgvector Extension**: The pgvector extension is available and can be installed via CREATE EXTENSION.
- **Embedding Dimension**: Using 1536-dimension vectors (compatible with OpenAI text-embedding-ada-002 and similar models).
- **Source Document Encoding**: Source documents (rules.txt, handbook.txt) are UTF-8 encoded plain text.
- **Content Completeness**: Both source documents contain the complete content needed; PDF versions may be ignored if TXT versions are comprehensive.
- **Single Execution Context**: The script is designed to be run as a single transaction or sequential execution, not parallel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The SQL script executes without errors on a fresh PostgreSQL database with pgvector extension available.
- **SC-002**: All content from source documents is extractable from the database - verification queries return non-zero counts for all entity tables.
- **SC-003**: The script can be re-run on an existing database without errors (idempotency verification).
- **SC-004**: Full-text search queries return relevant results - searching for "fireball" returns the Fireball spell, searching for "attack roll" returns combat rules.
- **SC-005**: Cross-reference queries work correctly - querying a class returns its associated spells through the junction table.
- **SC-006**: Entity counts in verification output match the actual content in source documents (within 5% tolerance for edge cases).
- **SC-007**: All slugs are unique within their respective tables - no duplicate key errors on slug indexes.
- **SC-008**: Source traceability is maintained - each content record can be traced back to its source document and approximate location.
