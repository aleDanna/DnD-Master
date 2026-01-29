# Feature Specification: Rules & Handbook

**Feature Branch**: `002-rules-explorer`
**Created**: 2026-01-29
**Updated**: 2026-01-29
**Status**: Draft
**Input**: User description: "Add a Rules & Handbook menu item to browse, search, and reference D&D rules and player handbook content (monsters, items, classes, races, spells, etc.) from the database. Support semantic search with vector embeddings. AI DM should cite rules during sessions."

## Clarifications

**Session**: 2026-01-29

| Question | Decision | Rationale |
|----------|----------|-----------|
| Navigation Structure | **Tabbed interface** - Horizontal tabs for major categories (Rules, Characters, Spells, Bestiary, Equipment) | Clean separation between content types, familiar UX pattern, scales well with 14+ entity types grouped into logical categories |
| Search Scope | **Smart unified search** - AI-powered search that infers intent from query | Best user experience for mixed queries; system determines whether user wants a spell, monster, rule, or item based on natural language |
| Content Detail Level | **Summary cards** - Show 3-5 key attributes per entity type in list views | Good balance of information density; users can scan quickly while seeing relevant details (e.g., spell level/school, monster CR/type) |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Content by Category Tabs (Priority: P1)

As a DM or player, I want to browse game content organized by category tabs so that I can quickly navigate to the type of content I need (rules, characters, spells, monsters, or equipment).

**Why this priority**: This is the foundational navigation pattern. The tabbed interface provides clear separation between diverse content types while maintaining a clean, intuitive UI.

**Independent Test**: Can be fully tested by opening the Rules & Handbook page, seeing horizontal category tabs, clicking each tab to see its content, and verifying the content displays correctly.

**Acceptance Scenarios**:

1. **Given** the user opens the Rules & Handbook page, **When** the page loads, **Then** horizontal tabs are displayed for: Rules, Characters, Spells, Bestiary, Equipment.
2. **Given** the user clicks a tab, **When** the tab is selected, **Then** the content area updates to show items for that category with summary cards.
3. **Given** the user is viewing a category, **When** they click on an item card, **Then** a detail view displays the full content with all attributes.
4. **Given** the user has selected a tab, **When** they navigate away and return, **Then** the previously selected tab is remembered.

---

### User Story 2 - Browse Rules by Hierarchy (Priority: P1)

As a DM or player, I want to browse game rules organized by category hierarchy so that I can find rules by navigating a familiar structure.

**Why this priority**: Rules have a natural hierarchical organization (categories with parent/child relationships) that differs from other content types.

**Independent Test**: Can be tested by selecting the Rules tab, seeing rule categories, expanding a category to see child categories and rules, and clicking a rule to view its content.

**Acceptance Scenarios**:

1. **Given** the user selects the Rules tab, **When** the content loads, **Then** top-level rule categories are displayed as expandable items.
2. **Given** the user clicks on a category, **When** the category expands, **Then** child categories and individual rules within that category are displayed.
3. **Given** the user clicks on a rule, **When** the rule is selected, **Then** the detail view displays the full rule content with summary and source information.
4. **Given** a rule references other rules, **When** viewing the rule detail, **Then** cross-references are displayed as clickable links.

---

### User Story 3 - Browse Character Options (Priority: P1)

As a player, I want to browse character creation options (classes, subclasses, races, subraces, backgrounds, feats) so that I can plan my character build.

**Why this priority**: Character options are essential for players during character creation and leveling decisions.

**Independent Test**: Can be tested by selecting the Characters tab, seeing classes and races listed, clicking a class to see its features and subclasses, and clicking a race to see its traits.

**Acceptance Scenarios**:

1. **Given** the user selects the Characters tab, **When** the content loads, **Then** sub-categories are shown: Classes, Races, Backgrounds, Feats.
2. **Given** the user views Classes, **When** they click a class, **Then** the detail view shows hit die, proficiencies, and a list of features by level.
3. **Given** the user is viewing a class, **When** subclasses exist, **Then** available subclasses are listed with the level they become available.
4. **Given** the user views Races, **When** they click a race, **Then** the detail view shows ability score increases, traits, speed, and available subraces.
5. **Given** the user views a class feature, **When** clicking on it, **Then** the full feature description is displayed with the level it's acquired.

---

### User Story 4 - Browse Spells (Priority: P1)

As a spellcaster player, I want to browse and filter spells so that I can find spells for my character's class and level.

**Why this priority**: Spells are frequently referenced during gameplay and character planning. Filtering is essential given the large number of spells.

**Independent Test**: Can be tested by selecting the Spells tab, seeing spells listed with level and school, filtering by class and level, and viewing a spell's full details.

**Acceptance Scenarios**:

1. **Given** the user selects the Spells tab, **When** the content loads, **Then** spells are displayed as summary cards showing name, level, school, and casting time.
2. **Given** the user views spells, **When** filter options are available, **Then** the user can filter by: spell level (0-9), school, class, concentration, ritual.
3. **Given** the user clicks a spell card, **When** the detail view opens, **Then** all spell attributes are displayed: components, range, duration, description, and higher-level effects.
4. **Given** the user filters spells, **When** filters are applied, **Then** only matching spells are displayed and filter state is preserved.

---

### User Story 5 - Browse Bestiary (Priority: P1)

As a DM, I want to browse monsters and creatures so that I can find appropriate encounters for my party.

**Why this priority**: DMs frequently need to reference monster stats during session preparation and gameplay.

**Independent Test**: Can be tested by selecting the Bestiary tab, seeing monsters listed with CR and type, filtering by CR range, and viewing a monster's full stat block.

**Acceptance Scenarios**:

1. **Given** the user selects the Bestiary tab, **When** the content loads, **Then** monsters are displayed as summary cards showing name, challenge rating, size, and type.
2. **Given** the user views monsters, **When** filter options are available, **Then** the user can filter by: challenge rating range, size, monster type.
3. **Given** the user clicks a monster card, **When** the detail view opens, **Then** the full stat block is displayed: AC, HP, speed, ability scores, actions, traits, and special abilities.
4. **Given** a monster has legendary actions or lair actions, **When** viewing the detail, **Then** these are displayed in dedicated sections.

---

### User Story 6 - Browse Equipment (Priority: P1)

As a player or DM, I want to browse items and equipment so that I can find weapons, armor, and magic items.

**Why this priority**: Equipment reference is needed for character creation, shopping, and treasure distribution.

**Independent Test**: Can be tested by selecting the Equipment tab, seeing items listed with type and rarity, filtering by item type, and viewing an item's full description.

**Acceptance Scenarios**:

1. **Given** the user selects the Equipment tab, **When** the content loads, **Then** items are displayed as summary cards showing name, type, and rarity.
2. **Given** the user views items, **When** filter options are available, **Then** the user can filter by: item type (weapon, armor, potion, wondrous, etc.), rarity.
3. **Given** the user clicks an item card, **When** the detail view opens, **Then** all item attributes are displayed including damage/AC, properties, and description.
4. **Given** an item requires attunement, **When** viewing the detail, **Then** attunement requirements are prominently displayed.

---

### User Story 7 - Smart Unified Search (Priority: P1)

As a DM or player, I want to search across all content using natural language so that the system finds what I need regardless of content type.

**Why this priority**: Smart search is the primary discovery mechanism, especially during fast-paced gameplay when users don't know exactly what category contains their answer.

**Independent Test**: Can be tested by entering "fire damage spell level 3" and verifying Fireball appears; entering "large flying creature CR 5" and verifying appropriate monsters appear.

**Acceptance Scenarios**:

1. **Given** the user enters a search query, **When** they submit the search, **Then** the system analyzes the query intent and returns relevant results from all content types.
2. **Given** search results are returned, **When** displayed, **Then** results are grouped by content type with the most relevant type shown first.
3. **Given** a search query, **When** results are displayed, **Then** each result shows a summary card with type-appropriate key attributes.
4. **Given** the user clicks a search result, **When** selected, **Then** the full detail view is displayed in context of its parent category.
5. **Given** search finds no results, **When** displayed, **Then** the system suggests alternative queries or related content.
6. **Given** a natural language question like "what happens when I fall?", **When** searched, **Then** semantically relevant rules are returned even without exact keyword matches.

---

### User Story 8 - AI DM Content Citation (Priority: P2)

As a player in an active session, I want the AI DM to automatically cite relevant rules and content when making rulings so that I can verify decisions and learn the game.

**Why this priority**: This integrates the content database with the core AI DM functionality. Depends on browsing and search being complete.

**Independent Test**: Can be tested by asking the AI DM "can I attack twice?" and verifying the response includes a citation link to the Extra Attack feature.

**Acceptance Scenarios**:

1. **Given** the AI DM is resolving a mechanical question, **When** the response is generated, **Then** relevant citations appear as clickable links within the response.
2. **Given** a citation link is clicked, **When** the user interacts with it, **Then** a popover displays the full content without leaving the session view.
3. **Given** the AI DM references a monster or spell, **When** the response is generated, **Then** the entity name is linked to its full detail view.
4. **Given** multiple content items apply, **When** the AI DM responds, **Then** all applicable items are cited with brief explanations.

---

### User Story 9 - Reference Data Lookup (Priority: P2)

As a DM or player, I want quick access to reference data (conditions, skills, abilities) so that I can understand game mechanics.

**Why this priority**: Reference data is frequently needed to understand rules and effects but is secondary to main content browsing.

**Independent Test**: Can be tested by searching "grappled" and seeing the condition definition; searching "athletics" and seeing the skill description.

**Acceptance Scenarios**:

1. **Given** a search query matches a condition name, **When** results are displayed, **Then** the condition definition appears prominently.
2. **Given** a skill is referenced, **When** viewed, **Then** the ability it uses and its description are displayed.
3. **Given** content references a condition or skill, **When** viewing that content, **Then** the reference is a clickable link to the definition.

---

### Edge Cases

- What happens when a search query matches hundreds of items? → Paginate results (20 per page) with "load more" functionality.
- How does search handle ambiguous queries like "fire"? → Show results grouped by type (spells, damage types, monsters, items) with relevance ranking.
- What happens if semantic search is unavailable? → Graceful degradation to full-text search with user notification.
- How are very long content entries displayed? → Collapsible sections with "show more" for descriptions over 500 characters.
- What happens when filtering returns no results? → Display "No matches" with option to clear filters or broaden search.
- How are related items shown? → Cross-references (e.g., class spell lists, monster actions referencing conditions) are clickable links.

---

## Requirements *(mandatory)*

### Functional Requirements

**Navigation & Browsing**
- **FR-001**: System MUST display a tabbed interface with categories: Rules, Characters, Spells, Bestiary, Equipment.
- **FR-002**: System MUST display content as summary cards showing 3-5 key attributes per entity type.
- **FR-003**: System MUST provide a detail view for each content item showing all attributes.
- **FR-004**: System MUST support hierarchical browsing for rule categories (parent/child relationships).
- **FR-005**: System MUST provide sub-navigation within Characters tab for Classes, Races, Backgrounds, Feats.

**Search**
- **FR-006**: System MUST provide a unified search bar accessible from all tabs.
- **FR-007**: System MUST use semantic search to infer query intent and return relevant results across all content types.
- **FR-008**: System MUST group search results by content type with relevance ranking.
- **FR-009**: System MUST highlight matching terms in search results.
- **FR-010**: System MUST support full-text search as fallback when semantic search is unavailable.

**Filtering**
- **FR-011**: Spells tab MUST support filtering by: level, school, class, concentration, ritual.
- **FR-012**: Bestiary tab MUST support filtering by: challenge rating range, size, monster type.
- **FR-013**: Equipment tab MUST support filtering by: item type, rarity.
- **FR-014**: Characters tab MUST support filtering classes by primary ability.

**Content Display**
- **FR-015**: Rule entries MUST display title, summary, full content, and category path.
- **FR-016**: Spell entries MUST display level, school, casting time, range, components, duration, concentration, ritual, description, and higher-level effects.
- **FR-017**: Monster entries MUST display full stat block: size, type, AC, HP, speed, ability scores, skills, senses, languages, CR, traits, actions, and special abilities.
- **FR-018**: Item entries MUST display type, rarity, attunement requirements, properties, and description.
- **FR-019**: Class entries MUST display hit die, proficiencies, features by level, and subclass options.
- **FR-020**: Race entries MUST display ability score increases, traits, speed, and subrace options.

**Cross-References & Integration**
- **FR-021**: System MUST render cross-references between content items as clickable links.
- **FR-022**: System MUST integrate with AI DM to enable content queries during session responses.
- **FR-023**: AI DM responses involving mechanics MUST include clickable citations to relevant content.
- **FR-024**: Citation links MUST display content in a popover without navigating away from session.

**Data Requirements**
- **FR-025**: System MUST support vector embeddings for semantic search on all content types.
- **FR-026**: System MUST support full-text search indexes on all text content fields.

---

### Key Entities

**Content Entities** (from database schema):

- **Rule**: Game rule content. Attributes: id, category_id, title, slug, content, summary, keywords, embedding.
- **RuleCategory**: Hierarchical rule organization. Attributes: id, name, slug, description, parent_id, sort_order, embedding.
- **Class**: Playable character class. Attributes: id, name, slug, hit_die, primary_ability, saving_throws, proficiencies, equipment, embedding.
- **Subclass**: Class specialization. Attributes: id, class_id, name, slug, subclass_level, features, embedding.
- **ClassFeature**: Class/subclass ability. Attributes: id, class_id, subclass_id, name, level, description, embedding.
- **Race**: Playable character race. Attributes: id, name, slug, ability_score_increase, traits, speed, languages, embedding.
- **Subrace**: Race variant. Attributes: id, race_id, name, slug, ability_score_increase, traits, embedding.
- **Spell**: Magic spell. Attributes: id, name, slug, level (0-9), school, casting_time, range, components, duration, concentration, ritual, description, at_higher_levels, embedding.
- **Monster**: Creature/enemy. Attributes: id, name, slug, size, type, alignment, AC, HP, speed, ability_scores, skills, senses, languages, CR, traits, actions, legendary_actions, embedding.
- **Item**: Equipment/magic item. Attributes: id, name, slug, item_type, rarity, attunement, damage, armor_class, properties, description, embedding.
- **Background**: Character background. Attributes: id, name, slug, feature, proficiencies, equipment, characteristics, embedding.
- **Feat**: Character feat. Attributes: id, name, slug, prerequisites, description, embedding.

**Reference Entities**:

- **Condition**: Game condition (e.g., grappled, stunned). Attributes: id, name, slug, description, embedding.
- **Skill**: Character skill. Attributes: id, name, ability_id, description.
- **Ability**: Core ability (STR, DEX, etc.). Attributes: id, name, abbreviation, description.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can find any specific content item within 10 seconds using tabs, browsing, or search.
- **SC-002**: Smart search returns relevant results for natural language queries with >80% relevance accuracy (measured by user feedback sampling).
- **SC-003**: Search returns results in under 1 second for 95th percentile queries.
- **SC-004**: 100% of AI DM mechanical rulings include at least one content citation when relevant content exists in the database.
- **SC-005**: All content types (rules, classes, races, spells, monsters, items, backgrounds, feats) are browsable and searchable.
- **SC-006**: Filter operations update results in under 500ms.
- **SC-007**: Cross-reference links successfully navigate to target content 100% of the time.
- **SC-008**: Tab navigation and content loading complete in under 2 seconds on standard connections.

---

## Assumptions

- Database schema from `/migrations/001-dnd-content.sql` provides all required entity tables with vector embedding support.
- Content has been ingested and embeddings generated via a separate admin/ingestion process.
- Vector similarity search (pgvector) is available and configured for semantic search functionality.
- The AI DM integration uses the same database and can query content during response generation.
