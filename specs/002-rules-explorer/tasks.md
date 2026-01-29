# Tasks: Rules & Handbook

**Input**: Design documents from `/specs/002-rules-explorer/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.yaml ✅

**Tests**: Tests are OPTIONAL per template. Include if explicitly requested.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and configure project

- [ ] T001 [P] Create backend handbook directories: `backend/src/api/handbook/`, `backend/src/services/handbook/`
- [ ] T002 [P] Create frontend handbook directories: `frontend/src/app/handbook/`, `frontend/src/components/handbook/`, `frontend/src/hooks/handbook/`, `frontend/src/lib/handbook/`
- [ ] T003 [P] Create test directories: `backend/tests/unit/handbook/`, `backend/tests/integration/handbook/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### TypeScript Types

- [ ] T004 [P] Create shared handbook types in `frontend/src/lib/handbook/types.ts`:
  - SpellSummary, Spell, MonsterSummary, Monster, ItemSummary, Item
  - ClassSummary, Class, RaceSummary, Race, FeatSummary, Feat
  - BackgroundSummary, Background, RuleSummary, Rule, RuleCategory
  - Condition, Skill, Ability
  - SearchResult, SearchResponse, Citation
  - Filter types: SpellFilters, MonsterFilters, ItemFilters

### API Client

- [ ] T005 Create base API client in `frontend/src/lib/handbook/api.ts`:
  - Base fetch wrapper with error handling
  - Type-safe request/response handling
  - Endpoint URL construction

### Backend Services

- [ ] T006 [P] Create `backend/src/services/handbook/filterService.ts`:
  - buildSpellFilters(params): WhereClause
  - buildMonsterFilters(params): WhereClause
  - buildItemFilters(params): WhereClause
  - buildClassFilters(params): WhereClause

- [ ] T007 [P] Create `backend/src/services/handbook/contentService.ts`:
  - Base content retrieval patterns
  - Pagination helpers
  - Slug-based lookup utilities

- [ ] T008 Create `backend/src/services/handbook/searchService.ts` (depends on T006, T007):
  - generateQueryEmbedding(query): Promise<number[]>
  - semanticSearch(embedding, tables): Promise<SearchResult[]>
  - fullTextSearch(query, tables): Promise<SearchResult[]>
  - hybridSearch(query): Promise<SearchResponse> (RRF fusion)
  - getContext(query): Promise<Citation[]> (for AI DM)

### API Route Infrastructure

- [ ] T009 Create `backend/src/api/handbook/index.ts`:
  - Router setup for all handbook routes
  - Middleware configuration
  - Export handbook router for main app integration

- [ ] T010 Register handbook routes in main Express app (update `backend/src/index.ts` or router config)

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Browse Content by Category Tabs (Priority: P1) 🎯 MVP

**Goal**: Tabbed interface with Rules, Characters, Spells, Bestiary, Equipment categories

**Independent Test**: Open /handbook, see tabs, click each tab to verify content loads

### Backend Implementation

- [ ] T011 [P] [US1] Create `backend/src/api/handbook/rules.ts`:
  - GET /api/handbook/rules/categories - list rule categories
  - GET /api/handbook/rules - list rules with pagination
  - GET /api/handbook/rules/:slug - get rule by slug

- [ ] T012 [P] [US1] Create `backend/src/api/handbook/spells.ts`:
  - GET /api/handbook/spells - list spells with filters
  - GET /api/handbook/spells/:slug - get spell by slug

- [ ] T013 [P] [US1] Create `backend/src/api/handbook/bestiary.ts`:
  - GET /api/handbook/monsters - list monsters with filters
  - GET /api/handbook/monsters/:slug - get monster by slug

- [ ] T014 [P] [US1] Create `backend/src/api/handbook/equipment.ts`:
  - GET /api/handbook/items - list items with filters
  - GET /api/handbook/items/:slug - get item by slug

- [ ] T015 [P] [US1] Create `backend/src/api/handbook/characters.ts`:
  - GET /api/handbook/classes - list classes
  - GET /api/handbook/classes/:slug - get class with features
  - GET /api/handbook/races - list races
  - GET /api/handbook/races/:slug - get race with traits

### Frontend Hooks

- [ ] T016 [P] [US1] Create `frontend/src/hooks/handbook/useContent.ts`:
  - Generic content fetching with SWR/caching pattern
  - Loading and error states

### Frontend Components

- [ ] T017 [P] [US1] Create `frontend/src/components/handbook/TabNavigation.tsx`:
  - Horizontal tab bar for 5 categories
  - Active tab highlighting
  - URL-driven state

- [ ] T018 [P] [US1] Create `frontend/src/components/handbook/ContentCard.tsx`:
  - Generic summary card component
  - Slots for type-specific attributes
  - Click handler for detail navigation

### Frontend Pages

- [ ] T019 [US1] Create `frontend/src/app/handbook/layout.tsx` (depends on T017):
  - Handbook page wrapper
  - TabNavigation component
  - Content area for children

- [ ] T020 [US1] Create `frontend/src/app/handbook/page.tsx`:
  - Redirect to default tab (/handbook/rules)

- [ ] T021 [P] [US1] Create `frontend/src/app/handbook/rules/page.tsx`:
  - Display rule categories and rules list
  - Summary cards for rules

- [ ] T022 [P] [US1] Create `frontend/src/app/handbook/spells/page.tsx`:
  - Display spells list
  - Summary cards with level, school, casting time

- [ ] T023 [P] [US1] Create `frontend/src/app/handbook/bestiary/page.tsx`:
  - Display monsters list
  - Summary cards with CR, size, type

- [ ] T024 [P] [US1] Create `frontend/src/app/handbook/equipment/page.tsx`:
  - Display items list
  - Summary cards with type, rarity

- [ ] T025 [P] [US1] Create `frontend/src/app/handbook/characters/page.tsx`:
  - Display character options (classes, races, etc.)
  - Sub-navigation for option types

### API Client Functions

- [ ] T026 [US1] Add content fetch functions to `frontend/src/lib/handbook/api.ts` (depends on T005):
  - getRuleCategories(), getRules(), getRule(slug)
  - getSpells(filters), getSpell(slug)
  - getMonsters(filters), getMonster(slug)
  - getItems(filters), getItem(slug)
  - getClasses(), getClass(slug), getRaces(), getRace(slug)

**Checkpoint**: User Story 1 complete - tabs display content from all categories

---

## Phase 4: User Story 2 - Browse Rules by Hierarchy (Priority: P1)

**Goal**: Expandable rule category tree with parent/child navigation

**Independent Test**: Select Rules tab, expand categories, see child rules

### Backend Implementation

- [ ] T027 [US2] Extend `backend/src/api/handbook/rules.ts`:
  - GET /api/handbook/rules/categories/:id/children - get child categories
  - Include parent_id in category response for tree building

### Frontend Components

- [ ] T028 [US2] Create `frontend/src/components/handbook/RuleHierarchy.tsx`:
  - Collapsible tree view component
  - Expand/collapse icons
  - Lazy loading of children

- [ ] T029 [US2] Create `frontend/src/app/handbook/rules/[slug]/page.tsx`:
  - Rule detail view
  - Display title, summary, full content
  - Show category breadcrumb path

### Cross-Reference Support

- [ ] T030 [US2] Add rule cross-reference display in rule detail:
  - Query rule_references table
  - Render as clickable links to related rules

**Checkpoint**: User Story 2 complete - rule hierarchy fully navigable

---

## Phase 5: User Story 3 - Browse Character Options (Priority: P1)

**Goal**: Browse classes, races, backgrounds, feats with features/traits

**Independent Test**: View class with features by level, race with traits and subraces

### Backend Implementation

- [ ] T031 [P] [US3] Extend `backend/src/api/handbook/characters.ts`:
  - GET /api/handbook/classes/:slug/features - get features by level
  - GET /api/handbook/classes/:slug/subclasses - get subclass options
  - GET /api/handbook/races/:slug/subraces - get subrace options

- [ ] T032 [P] [US3] Add backgrounds endpoint to `backend/src/api/handbook/characters.ts`:
  - GET /api/handbook/backgrounds - list backgrounds
  - GET /api/handbook/backgrounds/:slug - get background detail

- [ ] T033 [P] [US3] Add feats endpoint to `backend/src/api/handbook/characters.ts`:
  - GET /api/handbook/feats - list feats
  - GET /api/handbook/feats/:slug - get feat detail

### Frontend Components

- [ ] T034 [P] [US3] Create `frontend/src/components/handbook/ClassDetail.tsx`:
  - Hit die, proficiencies display
  - Features by level table
  - Subclass list with level available

- [ ] T035 [P] [US3] Create `frontend/src/components/handbook/RaceDetail.tsx`:
  - Ability score increases
  - Traits list
  - Subrace options

### Frontend Pages

- [ ] T036 [US3] Create `frontend/src/app/handbook/characters/[type]/[slug]/page.tsx`:
  - Dynamic route for class/race/background/feat detail
  - Route to appropriate detail component

### API Client Functions

- [ ] T037 [US3] Add character functions to `frontend/src/lib/handbook/api.ts`:
  - getClassFeatures(slug), getSubclasses(classSlug)
  - getSubraces(raceSlug)
  - getBackgrounds(), getBackground(slug)
  - getFeats(), getFeat(slug)

**Checkpoint**: User Story 3 complete - all character options browsable

---

## Phase 6: User Story 4 - Browse Spells (Priority: P1)

**Goal**: Spell list with filtering by level, school, class, concentration, ritual

**Independent Test**: Filter spells by level 3 and Evocation, see Fireball

### Backend Implementation

- [ ] T038 [US4] Extend spell filtering in `backend/src/services/handbook/filterService.ts`:
  - Add concentration filter (boolean)
  - Add ritual filter (boolean)
  - Add class filter (join with class_spells)

### Frontend Components

- [ ] T039 [P] [US4] Create `frontend/src/components/handbook/SpellCard.tsx`:
  - Level, school badge
  - Casting time, concentration indicator
  - Ritual indicator

- [ ] T040 [P] [US4] Create `frontend/src/components/handbook/FilterPanel.tsx`:
  - Generic filter component accepting filter config
  - Multi-select for enums (school, class)
  - Range select for level (0-9)
  - Toggle switches for concentration/ritual

- [ ] T041 [US4] Create `frontend/src/components/handbook/SpellDetail.tsx`:
  - Full spell display: all attributes
  - Components with material details
  - At higher levels section

### Frontend Hooks

- [ ] T042 [US4] Create `frontend/src/hooks/handbook/useFilters.ts`:
  - Parse filters from URL query params
  - Update URL on filter change
  - Debounced filter application

### Frontend Pages

- [ ] T043 [US4] Create `frontend/src/app/handbook/spells/[slug]/page.tsx`:
  - Spell detail view using SpellDetail component

- [ ] T044 [US4] Update `frontend/src/app/handbook/spells/page.tsx`:
  - Integrate FilterPanel
  - Use useFilters hook for state

**Checkpoint**: User Story 4 complete - spells filterable and viewable

---

## Phase 7: User Story 5 - Browse Bestiary (Priority: P1)

**Goal**: Monster list with filtering by CR range, size, type

**Independent Test**: Filter by CR 1-5 and see appropriate monsters

### Frontend Components

- [ ] T045 [P] [US5] Create `frontend/src/components/handbook/MonsterCard.tsx`:
  - CR badge, size, type
  - AC, HP preview

- [ ] T046 [P] [US5] Create `frontend/src/components/handbook/MonsterStatBlock.tsx`:
  - D&D-style stat block layout
  - Ability score grid
  - Actions, traits, legendary actions sections
  - Collapsible sections for long content

### Frontend Pages

- [ ] T047 [US5] Create `frontend/src/app/handbook/bestiary/[slug]/page.tsx`:
  - Monster detail view using MonsterStatBlock

- [ ] T048 [US5] Update `frontend/src/app/handbook/bestiary/page.tsx`:
  - Integrate FilterPanel for CR/size/type
  - MonsterCard for list items

**Checkpoint**: User Story 5 complete - bestiary fully browsable

---

## Phase 8: User Story 6 - Browse Equipment (Priority: P1)

**Goal**: Item list with filtering by type, rarity

**Independent Test**: Filter by magic items of rare rarity

### Frontend Components

- [ ] T049 [P] [US6] Create `frontend/src/components/handbook/ItemCard.tsx`:
  - Type icon, rarity badge
  - Attunement indicator

- [ ] T050 [US6] Create `frontend/src/components/handbook/ItemDetail.tsx`:
  - Full item display
  - Damage/AC for weapons/armor
  - Properties list
  - Attunement requirements highlighted

### Frontend Pages

- [ ] T051 [US6] Create `frontend/src/app/handbook/equipment/[slug]/page.tsx`:
  - Item detail view using ItemDetail

- [ ] T052 [US6] Update `frontend/src/app/handbook/equipment/page.tsx`:
  - Integrate FilterPanel for type/rarity
  - ItemCard for list items

**Checkpoint**: User Story 6 complete - equipment fully browsable

---

## Phase 9: User Story 7 - Smart Unified Search (Priority: P1)

**Goal**: AI-powered search across all content with intent inference

**Independent Test**: Search "fire damage spell level 3" returns Fireball

### Backend Implementation

- [ ] T053 [US7] Create `backend/src/api/handbook/search.ts`:
  - GET /api/handbook/search - unified search endpoint
  - Query param: q (search query)
  - Query param: type (optional filter)
  - Returns grouped results by content type

- [ ] T054 [US7] Implement query intent classification in `backend/src/services/handbook/searchService.ts`:
  - Pattern matching for type indicators
  - Extract numeric filters (level, CR)
  - Keyword extraction for attributes

### Frontend Components

- [ ] T055 [US7] Create `frontend/src/components/handbook/SearchBar.tsx`:
  - Search input with debounce
  - Loading indicator
  - Clear button

- [ ] T056 [US7] Create `frontend/src/components/handbook/SearchResults.tsx`:
  - Grouped results by type
  - Type headers with counts
  - ContentCard for each result

### Frontend Hooks

- [ ] T057 [US7] Create `frontend/src/hooks/handbook/useSearch.ts`:
  - Search state management
  - Debounced API calls
  - Results caching

### Frontend Integration

- [ ] T058 [US7] Integrate SearchBar into `frontend/src/app/handbook/layout.tsx`:
  - Add search bar above tabs
  - Show results overlay when searching

### API Client Functions

- [ ] T059 [US7] Add search function to `frontend/src/lib/handbook/api.ts`:
  - searchHandbook(query, options): Promise<SearchResponse>

**Checkpoint**: User Story 7 complete - smart search operational

---

## Phase 10: User Story 8 - AI DM Content Citation (Priority: P2)

**Goal**: AI DM responses include clickable citations to handbook content

**Independent Test**: Ask AI DM rules question, see citation links in response

### Backend Implementation

- [ ] T060 [US8] Create context endpoint in `backend/src/api/handbook/search.ts`:
  - GET /api/handbook/context - for AI DM to fetch relevant content
  - Returns top 3-5 relevant items with excerpts
  - Returns in Citation format for prompt injection

- [ ] T061 [US8] Integrate handbook context into AI DM service:
  - Call /api/handbook/context during prompt construction
  - Include citations in response format

### Frontend Components

- [ ] T062 [US8] Create `frontend/src/components/CitationPopover.tsx`:
  - Fetch content on hover/click
  - Display summary in popover
  - "Open in Handbook" link

- [ ] T063 [US8] Create citation link renderer for AI DM chat UI:
  - Detect citation patterns in responses
  - Render as clickable links
  - Attach popover on interaction

**Checkpoint**: User Story 8 complete - AI DM cites handbook content

---

## Phase 11: User Story 9 - Reference Data Lookup (Priority: P2)

**Goal**: Quick access to conditions, skills, abilities

**Independent Test**: Search "grappled" shows condition definition

### Backend Implementation

- [ ] T064 [P] [US9] Create `backend/src/api/handbook/reference.ts`:
  - GET /api/handbook/conditions - list conditions
  - GET /api/handbook/conditions/:slug - get condition
  - GET /api/handbook/skills - list skills
  - GET /api/handbook/abilities - list abilities

### Frontend Components

- [ ] T065 [P] [US9] Create inline reference link component:
  - Detect condition/skill references in text
  - Render as clickable with popover
  - Display definition on hover

### API Client Functions

- [ ] T066 [US9] Add reference functions to `frontend/src/lib/handbook/api.ts`:
  - getConditions(), getCondition(slug)
  - getSkills(), getAbilities()

**Checkpoint**: User Story 9 complete - reference data accessible

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements across all stories

- [ ] T067 [P] Add loading states and skeletons to all list views
- [ ] T068 [P] Add error boundaries and error states
- [ ] T069 [P] Implement pagination for large result sets (20 per page)
- [ ] T070 [P] Add "no results" states with suggestions
- [ ] T071 Optimize database queries with proper indexing verification
- [ ] T072 Add response caching headers for static content
- [ ] T073 Run quickstart.md verification steps

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational ← BLOCKS ALL STORIES
    ↓
┌───────────────────────────────────────────────┐
│  User Stories (can run in parallel after P2)  │
├───────────────────────────────────────────────┤
│  Phase 3: US1 - Tabs & Navigation      (P1)  │
│  Phase 4: US2 - Rules Hierarchy        (P1)  │
│  Phase 5: US3 - Character Options      (P1)  │
│  Phase 6: US4 - Spells Filtering       (P1)  │
│  Phase 7: US5 - Bestiary               (P1)  │
│  Phase 8: US6 - Equipment              (P1)  │
│  Phase 9: US7 - Smart Search           (P1)  │
│  Phase 10: US8 - AI DM Citation        (P2)  │
│  Phase 11: US9 - Reference Data        (P2)  │
└───────────────────────────────────────────────┘
    ↓
Phase 12: Polish (after desired stories complete)
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 | Phase 2 only | US2-US9 |
| US2 | Phase 2, US1 (layout) | US3-US9 |
| US3 | Phase 2, US1 (tabs/layout) | US4-US9 |
| US4 | Phase 2, US1 (spells page shell) | US5-US9 |
| US5 | Phase 2, US1 (bestiary page shell) | US4, US6-US9 |
| US6 | Phase 2, US1 (equipment page shell) | US4, US5, US7-US9 |
| US7 | Phase 2, US1 (layout for search bar) | US2-US6, US8-US9 |
| US8 | Phase 2, US7 (search service) | US9 |
| US9 | Phase 2 only | US1-US8 |

### Within Each User Story

1. Backend API routes (can parallel within story)
2. API client functions
3. Frontend hooks
4. Frontend components (can parallel within story)
5. Frontend pages (depends on components)

---

## Parallel Examples

### Phase 2 Parallel Launch

```bash
# All foundational tasks can run in parallel:
Task T004: "Create shared handbook types in frontend/src/lib/handbook/types.ts"
Task T006: "Create backend/src/services/handbook/filterService.ts"
Task T007: "Create backend/src/services/handbook/contentService.ts"
```

### User Story 1 Backend Parallel

```bash
# All backend routes can be created in parallel:
Task T011: "Create backend/src/api/handbook/rules.ts"
Task T012: "Create backend/src/api/handbook/spells.ts"
Task T013: "Create backend/src/api/handbook/bestiary.ts"
Task T014: "Create backend/src/api/handbook/equipment.ts"
Task T015: "Create backend/src/api/handbook/characters.ts"
```

### User Story 1 Frontend Pages Parallel

```bash
# All category pages can be created in parallel:
Task T021: "Create frontend/src/app/handbook/rules/page.tsx"
Task T022: "Create frontend/src/app/handbook/spells/page.tsx"
Task T023: "Create frontend/src/app/handbook/bestiary/page.tsx"
Task T024: "Create frontend/src/app/handbook/equipment/page.tsx"
Task T025: "Create frontend/src/app/handbook/characters/page.tsx"
```

### Cross-Story Parallel (Different Developers)

```bash
# After Phase 2, multiple stories can progress simultaneously:
Developer A: Phase 3 (US1 - Tabs) + Phase 4 (US2 - Rules)
Developer B: Phase 6 (US4 - Spells) + Phase 7 (US5 - Bestiary)
Developer C: Phase 9 (US7 - Search)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Tabs & Navigation)
4. **STOP and VALIDATE**: Test all tabs display content
5. Deploy MVP with basic browsing

### Incremental P1 Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Tabs) → Basic browsing → Demo
3. US2 (Rules) + US3 (Characters) → Rule/character browsing
4. US4 (Spells) + US5 (Bestiary) + US6 (Equipment) → Full filtering
5. US7 (Search) → Smart search operational
6. Polish → Production ready

### Full Feature Delivery

1. Complete all P1 stories (US1-US7)
2. Add P2 stories (US8 AI DM Citation, US9 Reference Data)
3. Complete Polish phase
4. Full feature deployment

---

## Summary

| Category | Count |
|----------|-------|
| Total Tasks | 73 |
| Phase 1 (Setup) | 3 |
| Phase 2 (Foundational) | 7 |
| P1 User Stories (US1-US7) | 49 |
| P2 User Stories (US8-US9) | 7 |
| Polish | 7 |
| Parallelizable Tasks | 38 |

**MVP Scope**: Phases 1-3 (T001-T026) = 26 tasks for basic tab browsing
**P1 Complete**: Phases 1-9 (T001-T059) = 59 tasks for full P1 functionality
