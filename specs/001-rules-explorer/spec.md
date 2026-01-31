# Feature Specification: Rules Explorer

**Feature Branch**: `001-rules-explorer`
**Created**: 2026-01-30
**Status**: Draft
**Input**: User description: "Create a detailed specification for the Rules Explorer feature - a comprehensive D&D 5th Edition reference interface with hierarchical navigation and multi-modal search."

## Problem Statement

Players and Dungeon Masters need quick, reliable access to D&D rules and reference materials during gameplay and preparation. Currently, they must search through PDFs or physical books, which is slow and disrupts game flow. A streamlined digital reference tool would reduce lookup time and keep the game moving.

## Solution Overview

A web-based Rules Explorer providing:
1. Hierarchical sidebar navigation for browsing content by category
2. Full-text search for finding specific terms
3. Semantic search for finding conceptually related content
4. Clean, readable content display with source citations

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Rules by Category (Priority: P1)

As a DM preparing a session, I want to browse rules organized by category (Combat, Adventuring, Spellcasting, etc.) so that I can review related rules in context.

**Why this priority**: Browsing is the foundational navigation method. Without it, users cannot access any content. This enables the core value proposition of organized rule access.

**Independent Test**: Can be fully tested by navigating through the category tree and verifying all content is accessible and properly organized. Delivers immediate value as a structured reference tool.

**Acceptance Scenarios**:

1. **Given** a user is on the Rules Explorer page, **When** they view the sidebar, **Then** they see top-level categories: Rules, Classes, Races, Spells, Bestiary, Items, Backgrounds, Feats, Conditions, Skills
2. **Given** a user clicks on a category, **When** it has subcategories, **Then** the category expands to reveal its children
3. **Given** a user clicks on an expanded category, **When** they click again, **Then** the category collapses
4. **Given** the Rules category is expanded, **When** the user views subcategories, **Then** they see: Using Ability Scores, Adventuring, Combat, Spellcasting (each with their own subcategories)
5. **Given** the Classes category is expanded, **When** the user views it, **Then** they see all 12 core classes, each expandable to show subclasses
6. **Given** the Races category is expanded, **When** the user views it, **Then** they see all 9 core races, each expandable to show subraces
7. **Given** the Spells category is expanded, **When** the user views browse options, **Then** they can browse by Level (Cantrips through 9th) or by School
8. **Given** the Bestiary category is expanded, **When** the user views browse options, **Then** they can browse by Type or Challenge Rating
9. **Given** the Items category is expanded, **When** the user views browse options, **Then** they can browse by Type (Weapons, Armor, Adventuring Gear, Magic Items)
10. **Given** a user selects an item, **When** it becomes active, **Then** it is visually highlighted in the sidebar
11. **Given** a user navigates to content, **When** the page loads, **Then** the URL updates to reflect the current selection (enabling deep links and bookmarking)

---

### User Story 2 - View Content Detail (Priority: P1)

As a player looking up a specific rule, I want to see the full content of a selected item so that I can understand exactly how it works.

**Why this priority**: Content display is essential - without it, browsing has no purpose. This completes the core read-only reference experience.

**Independent Test**: Can be tested by selecting any item from the sidebar and verifying the complete content displays correctly with all relevant fields.

**Acceptance Scenarios**:

1. **Given** a user selects a rule, **When** the content panel loads, **Then** it displays title, summary, full content, keywords, and source citation
2. **Given** a user selects a class, **When** the content panel loads, **Then** it displays description, hit die, proficiencies, and features organized by level
3. **Given** a user selects a race, **When** the content panel loads, **Then** it displays description, ability score modifiers, racial traits, and available subraces
4. **Given** a user selects a spell, **When** the content panel loads, **Then** it displays level, school, casting time, range, components, duration, and full description
5. **Given** a user selects a monster, **When** the content panel loads, **Then** it displays a complete stat block including AC, HP, speed, ability scores, skills, actions, and special abilities
6. **Given** a user selects an item, **When** the content panel loads, **Then** it displays type, rarity, cost, weight, properties, and description
7. **Given** any content is displayed, **When** the user views the source citation, **Then** they see the document name and page number reference
8. **Given** a user is viewing nested content, **When** they view the header area, **Then** a breadcrumb trail shows their current location in the hierarchy

---

### User Story 3 - Search by Keyword (Priority: P2)

As a DM needing to quickly find a rule, I want to search for specific terms like "grapple" or "concentration" so that I can find relevant rules instantly.

**Why this priority**: Search accelerates access beyond browsing alone. Critical for in-game use when users know what term they need but not where to find it.

**Independent Test**: Can be tested by searching for known terms and verifying matching results appear with relevant snippets.

**Acceptance Scenarios**:

1. **Given** a user is on any page, **When** they look for search, **Then** a search input is prominently visible (top of sidebar or header)
2. **Given** a user types in the search field, **When** they press Enter or pause typing for 300ms, **Then** search executes automatically
3. **Given** search returns results, **When** results are displayed, **Then** they are grouped by category (Rules, Spells, Monsters, etc.)
4. **Given** search results are shown, **When** the user views a result, **Then** they see: title, category, and a text snippet with the matching term highlighted
5. **Given** a user sees a search result, **When** they click it, **Then** they navigate to the full content for that item
6. **Given** a search returns no results, **When** the results area loads, **Then** a helpful "No results found" message appears with suggestions
7. **Given** a user has performed searches, **When** they focus the search input, **Then** they see their last 10 recent searches for quick re-access

---

### User Story 4 - Semantic Search (Priority: P3)

As a player unsure of exact terminology, I want to search by concept like "how to hide from enemies" so that I can find relevant content even without knowing exact terms.

**Why this priority**: Enhances discoverability for new players or those unfamiliar with official terminology. Builds on existing search infrastructure.

**Independent Test**: Can be tested by searching conceptual phrases and verifying semantically related content appears ranked by relevance.

**Acceptance Scenarios**:

1. **Given** a user is using search, **When** they want conceptual search, **Then** they can toggle between "Keyword" and "Semantic" search modes
2. **Given** semantic search is active, **When** a user searches "how to hide from enemies", **Then** results include Stealth rules, Hide action, Invisibility conditions, and related spells
3. **Given** semantic search returns results, **When** they are displayed, **Then** they are ranked by relevance/similarity score
4. **Given** semantic search is active, **When** results appear, **Then** a clear indicator shows this is AI-powered search
5. **Given** semantic search, **When** results span multiple content types, **Then** all relevant types (rules, spells, monsters, items) are included

---

### User Story 5 - Mobile Navigation (Priority: P2)

As a player at the table using my phone, I want to access the Rules Explorer on mobile so that I can look up rules without a laptop.

**Why this priority**: Many players use phones at the table. Without mobile support, a significant portion of the target audience cannot use the tool effectively.

**Independent Test**: Can be tested on mobile devices by navigating the full feature set and verifying all functionality is accessible and usable.

**Acceptance Scenarios**:

1. **Given** a user is on a screen narrower than 768px, **When** the page loads, **Then** the sidebar is collapsed and a hamburger menu icon is visible
2. **Given** the sidebar is collapsed, **When** the user taps the hamburger menu, **Then** the sidebar opens as a slide-over drawer
3. **Given** the sidebar drawer is open, **When** the user taps outside or swipes to close, **Then** the drawer closes
4. **Given** a mobile user is viewing content, **When** they read the content, **Then** it is readable without horizontal scrolling
5. **Given** a mobile user is navigating, **When** they tap interactive elements, **Then** tap targets are at least 44px for comfortable touch interaction
6. **Given** the sidebar is collapsed on mobile, **When** the user wants to search, **Then** search is accessible without opening the full sidebar

---

### Edge Cases

- What happens when a user navigates to a URL for content that doesn't exist? Display a 404 page with suggestions for similar content.
- What happens when a category has no content yet? Display an empty state message explaining content is coming soon.
- What happens if semantic search is unavailable (service down)? Gracefully fall back to keyword search with a notice to the user.
- What happens when search query is empty? Show recent searches or popular/suggested searches.
- What happens on extremely narrow screens (< 320px)? Maintain minimum usable layout; content may require scrolling but remains readable.
- What happens if the content source citation is missing? Display content without citation rather than failing; optionally show "Source unavailable."

## Requirements *(mandatory)*

### Functional Requirements

#### Navigation & Browsing
- **FR-001**: System MUST display a hierarchical sidebar with expandable/collapsible categories
- **FR-002**: System MUST support the following top-level categories: Rules, Classes, Races, Spells, Bestiary, Items, Backgrounds, Feats, Conditions, Skills
- **FR-003**: System MUST allow categories to expand to show subcategories or individual items
- **FR-004**: System MUST visually highlight the currently selected item in the sidebar
- **FR-005**: System MUST update the URL when content selection changes to enable deep linking
- **FR-006**: System MUST display breadcrumb navigation showing the user's current location

#### Content Display
- **FR-007**: System MUST display complete content details appropriate to each content type
- **FR-008**: System MUST display source citations (document name and page number) for all content
- **FR-009**: System MUST support distinct display formats for: rules, classes, races, spells, monsters, items, backgrounds, feats, conditions, and skills

#### Keyword Search
- **FR-010**: System MUST provide a prominently placed search input
- **FR-011**: System MUST execute search on Enter key or after 300ms of inactivity (debounce)
- **FR-012**: System MUST group search results by content category
- **FR-013**: System MUST display search result snippets with matching terms highlighted
- **FR-014**: System MUST allow users to click search results to navigate to full content
- **FR-015**: System MUST display helpful messaging when no results are found
- **FR-016**: System MUST save the user's last 10 searches locally for quick re-access

#### Semantic Search
- **FR-017**: System MUST provide a toggle to switch between keyword and semantic search modes
- **FR-018**: System MUST find conceptually related content even when exact terms don't match
- **FR-019**: System MUST rank semantic search results by relevance score
- **FR-020**: System MUST clearly indicate when semantic (AI-powered) search is active
- **FR-021**: System MUST search across all content types in semantic mode

#### Mobile Experience
- **FR-022**: System MUST collapse the sidebar to a hamburger menu on screens < 768px wide
- **FR-023**: System MUST display the sidebar as a slide-over drawer on mobile
- **FR-024**: System MUST ensure all interactive elements have minimum 44px touch targets
- **FR-025**: System MUST display content without requiring horizontal scroll on mobile
- **FR-026**: System MUST provide search access from the collapsed mobile state

#### Error Handling
- **FR-027**: System MUST display appropriate 404 pages for invalid content URLs
- **FR-028**: System MUST display empty state messages for categories without content
- **FR-029**: System MUST gracefully degrade to keyword search if semantic search is unavailable

### Key Entities

- **Rule Category**: Represents a grouping of rules (e.g., Combat, Adventuring). Has name, hierarchical parent, sort order. Contains rules or subcategories.
- **Rule**: Individual rule entry. Has title, summary, full content, keywords, and source citation. Belongs to a category.
- **Class**: D&D character class. Has name, description, hit die, proficiencies, and features by level. Has subclasses.
- **Subclass**: Specialization within a class. Has name, description, and features. Belongs to a class.
- **Race**: D&D character race. Has name, description, ability score modifiers, and traits. Has subraces.
- **Subrace**: Variant within a race. Has name and modified traits. Belongs to a race.
- **Spell**: Magic spell. Has name, level, school, casting time, range, components, duration, description, and class associations.
- **Monster**: Creature entry. Has name, type, challenge rating, and full stat block (AC, HP, speed, abilities, actions, etc.).
- **Item**: Equipment or object. Has name, type, rarity, cost, weight, properties, and description.
- **Background**: Character background. Has name, description, proficiencies, and features.
- **Feat**: Character feat. Has name, prerequisites, and description.
- **Condition**: Status condition. Has name and effects description.
- **Skill**: Character skill. Has name, associated ability, and description.
- **Source Citation**: Reference to original material. Has document name and page number.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can find any specific rule in 3 clicks or fewer from the landing page
- **SC-002**: Keyword search returns results in under 1 second for 95% of queries
- **SC-003**: Semantic search returns relevant results for conceptual queries (validated by user testing with 80%+ satisfaction)
- **SC-004**: 100% of content in the database is accessible through the navigation interface
- **SC-005**: All pages and features are fully functional on viewport widths from 320px to 2560px
- **SC-006**: Users can complete a rule lookup (from landing to viewing content) in under 30 seconds
- **SC-007**: Mobile users can access all features with touch-only interaction
- **SC-008**: Deep links (shared URLs) correctly load the specific content referenced

## Assumptions

- D&D 5th Edition SRD (System Reference Document) content is available and properly structured in the database
- Content includes source citations from original materials
- Semantic search capability is available through vector embeddings stored alongside content
- Users have modern web browsers (last 2 major versions of Chrome, Firefox, Safari, Edge)
- Content is in English

## Dependencies

- Existing D&D content database with structured data for all entity types
- Vector embedding storage for semantic search functionality
- User's browser supports localStorage for recent searches and preferences

## Out of Scope

- Bookmarking/favorites functionality
- AI DM integration for rule citations during gameplay
- Print-friendly views
- Offline support (PWA)
- User annotations/notes
- Content editing or management
- Multi-language support
- User accounts or authentication (public reference tool)
