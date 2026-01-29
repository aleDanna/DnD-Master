# Feature Specification: D&D Content SQL Migration Script

**Feature Branch**: `001-dnd-sql-migration`
**Created**: 2026-01-29
**Status**: Draft
**Input**: Generate a PostgreSQL SQL script that extracts all D&D rules and player handbook content from source documents in `/docs` into a normalized database schema with pgvector support for semantic search.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Complete SQL Migration Script (Priority: P1)

A developer needs to generate a single, self-contained SQL migration script that creates a complete D&D content database from the source documents located in `/docs`. The script must be executable on a fresh PostgreSQL database and populate all tables with content extracted from the Rules and Player's Handbook documents.

**Why this priority**: This is the core deliverable. Without a functioning SQL script that creates the schema and populates data, no other functionality can exist. The AI Dungeon Master application depends entirely on having structured D&D content available in the database.

**Independent Test**: Can be fully tested by executing the generated SQL script against a fresh PostgreSQL 18 database with pgvector extension. Success is verified when all tables are created and populated with content matching the source documents.

**Acceptance Scenarios**:

1. **Given** a fresh PostgreSQL 18 database with pgvector extension installed, **When** the generated SQL script is executed, **Then** all tables are created without errors and the verification queries return expected row counts for each entity type.
2. **Given** the SQL script has been executed once, **When** the same script is executed again, **Then** the script completes without errors (idempotent behavior via DROP IF EXISTS).
3. **Given** the source documents contain specific D&D content (spells, classes, monsters, etc.), **When** the script is generated, **Then** INSERT statements include ALL content from the source documents with proper text escaping and formatting.

---

### User Story 2 - Query D&D Rules by Category (Priority: P2)

The AI Dungeon Master needs to retrieve game rules organized by category (Combat, Movement, Magic, Skills, Conditions, etc.) to provide contextual gameplay assistance. Rules must be searchable by full-text search and traceable to their source document location.

**Why this priority**: Rules lookup is essential for the AI DM to answer player questions and adjudicate gameplay situations. This builds on the P1 foundation by ensuring rules are properly categorized and searchable.

**Independent Test**: Can be tested by querying the rules table by category slug and verifying that relevant rules are returned with their source references.

**Acceptance Scenarios**:

1. **Given** the database is populated with rules content, **When** querying for rules in the "combat" category, **Then** all combat-related rules are returned with their title, content, summary, and source page reference.
2. **Given** the database has full-text search indexes, **When** searching for "attack of opportunity", **Then** relevant rules are returned ranked by relevance.

---

### User Story 3 - Retrieve Spell Information (Priority: P2)

The AI Dungeon Master needs to look up spell details including level, school, components, duration, and full description to help players understand spell mechanics and make casting decisions.

**Why this priority**: Spells are one of the most frequently referenced entity types during gameplay. Players constantly need spell details, and the AI DM must have quick access to complete spell information.

**Independent Test**: Can be tested by querying for a specific spell by name and verifying all attributes are populated correctly.

**Acceptance Scenarios**:

1. **Given** the database contains spell data, **When** querying for "Fireball", **Then** the result includes level (3), school (Evocation), casting time, range, components, duration, full description, and at-higher-levels text.
2. **Given** the database has class-spell relationships, **When** querying for Wizard spells, **Then** all spells available to the Wizard class are returned.

---

### User Story 4 - Look Up Monster Statistics (Priority: P3)

The Dungeon Master needs to retrieve complete monster stat blocks including ability scores, actions, and special abilities to run combat encounters.

**Why this priority**: Monster data is critical for combat encounters but is typically needed less frequently than rules or spells during active play.

**Independent Test**: Can be tested by querying for a specific monster and verifying the complete stat block is returned.

**Acceptance Scenarios**:

1. **Given** the database contains monster data, **When** querying for "Goblin", **Then** the result includes size, type, alignment, AC, HP, speed, all ability scores, actions, and source reference.
2. **Given** the database has challenge rating data, **When** filtering monsters by CR range (0-1), **Then** appropriate low-level monsters are returned sorted by challenge rating.

---

### User Story 5 - Browse Character Creation Options (Priority: P3)

Players and the AI DM need to browse available races, classes, subclasses, and backgrounds for character creation and leveling decisions.

**Why this priority**: Character options are primarily needed during character creation or level-up, which occurs less frequently than active gameplay queries.

**Independent Test**: Can be tested by querying for all classes and verifying each includes hit die, proficiencies, and available subclasses.

**Acceptance Scenarios**:

1. **Given** the database contains class data, **When** querying for the Fighter class, **Then** the result includes hit die (d10), proficiencies, and all class features by level.
2. **Given** the database has race data, **When** listing all races, **Then** each race includes racial traits, ability score modifiers, and available subraces.

---

### Edge Cases

- What happens when a source document contains malformed or inconsistent formatting?
  - The SQL script should include reasonable fallback values and document any content that could not be fully parsed in SQL comments.
- How does the system handle content that spans multiple pages?
  - Multi-page content is concatenated with source_page referencing the starting page.
- What happens when entity names contain special characters or apostrophes?
  - All text content is properly escaped (single quotes doubled) in INSERT statements.
- How are cross-references between entities handled (e.g., class spell lists)?
  - Junction tables (class_spells) are populated with foreign key references after primary entity inserts.
- What happens if the source documents are updated?
  - The script is regenerated from scratch; the DROP IF EXISTS pattern ensures clean re-migration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a single SQL file that creates all database objects and populates all content
- **FR-002**: System MUST analyze source documents in `/docs` directory (rules.txt, rules.pdf, handbook.txt, handbook.pdf) to extract content
- **FR-003**: System MUST create tables for: documents, chapters, sections, rule_categories, rules, rule_references, spells, class_spells, classes, subclasses, class_features, monsters, items, races, subraces, backgrounds, feats, conditions, skills, and abilities
- **FR-004**: System MUST use UUID primary keys with gen_random_uuid() default for all tables
- **FR-005**: System MUST include created_at and updated_at timestamp columns on all tables
- **FR-006**: System MUST include embedding VECTOR(1536) columns on all content tables for future semantic search
- **FR-007**: System MUST maintain source traceability with source_document, source_chapter, and source_page columns
- **FR-008**: System MUST generate URL-safe slugs for all named entities (lowercase, hyphens, no special characters)
- **FR-009**: System MUST create full-text search indexes on all content/description columns
- **FR-010**: System MUST create vector similarity indexes on all embedding columns
- **FR-011**: System MUST create unique indexes on all slug columns
- **FR-012**: System MUST create foreign key indexes for query performance
- **FR-013**: System MUST be idempotent (executable multiple times without errors via DROP IF EXISTS CASCADE)
- **FR-014**: System MUST include verification queries that report row counts for each entity type
- **FR-015**: System MUST preserve paragraph breaks and list structures in description fields
- **FR-016**: System MUST properly escape single quotes in all text content
- **FR-017**: System MUST use NULL for embedding columns (to be populated later by a separate process)
- **FR-018**: System MUST create views for common queries (spell lists, class spell lists, monsters by CR)

### Key Entities

- **Document**: Represents a source document (rules or handbook) with filename, type, title, and description
- **Chapter**: A major division within a document, with chapter number, title, and page range
- **Section**: A subsection within a chapter, containing the actual content text and embedding
- **Rule Category**: A hierarchical grouping of rules (e.g., Combat > Attack Actions), with parent-child relationships
- **Rule**: An individual game rule with title, content, summary, and source reference
- **Spell**: A magical ability with level, school, components, duration, and full description
- **Class**: A playable character class with hit die, proficiencies, and features
- **Subclass**: A specialization within a class, available at a specific level
- **Class Feature**: An ability gained by a class or subclass at a specific level
- **Monster**: A creature with full stat block including abilities, actions, and special traits
- **Item**: Equipment including weapons, armor, and magic items with type-specific attributes
- **Race**: A playable character race with racial traits and ability modifiers
- **Subrace**: A variant of a race with additional or modified traits
- **Background**: A character background providing skills, equipment, and roleplay features
- **Feat**: An optional character ability that can be taken instead of ability score increases
- **Condition**: A status effect (e.g., Blinded, Poisoned) with mechanical effects
- **Skill**: A proficiency that can be applied to ability checks
- **Ability**: One of the six core ability scores (STR, DEX, CON, INT, WIS, CHA)

## Assumptions

- PostgreSQL 18 with pgvector extension is the target database
- The `/docs` directory contains authoritative D&D 5th Edition content (Basic Rules and Player's Handbook)
- Source documents are in English
- The embedding vector dimension is 1536 (compatible with OpenAI embeddings)
- JSONB columns will be used for complex structured data (monster actions, speed types, weapon properties)
- The ivfflat index type is appropriate for vector similarity search
- Content extraction prioritizes completeness over perfect formatting

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The generated SQL script executes without errors on a fresh PostgreSQL 18 database in a single pass
- **SC-002**: All verification queries return non-zero row counts matching the content volume in source documents
- **SC-003**: 100% of spells from the source documents are present in the spells table with complete attributes
- **SC-004**: 100% of monsters from the source documents are present in the monsters table with complete stat blocks
- **SC-005**: 100% of classes and their features are present with correct level associations
- **SC-006**: Full-text search queries return relevant results within 1 second for typical queries
- **SC-007**: All foreign key relationships are valid (no orphaned records)
- **SC-008**: Re-running the script produces identical results (idempotent verification)
- **SC-009**: All named entities have unique, URL-safe slugs
- **SC-010**: Source traceability allows locating any content in the original document by page number
