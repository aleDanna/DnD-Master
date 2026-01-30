# Tasks: Rules Explorer

**Input**: Design documents from `/specs/001-rules-explorer/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/openapi.yaml, research.md

**Tests**: Not explicitly requested in spec. Test tasks omitted. Add if needed.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`
- Based on plan.md structure (web application with separate frontend/backend)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create backend directory structure: `backend/src/models/content/`, `backend/src/services/search/`, `backend/src/services/content/`, `backend/src/routes/`
- [ ] T002 Create frontend directory structure: `frontend/src/components/layout/`, `frontend/src/components/search/`, `frontend/src/components/content/`, `frontend/src/lib/api/`, `frontend/src/lib/hooks/`
- [ ] T003 [P] Install backend dependencies (pg, pgvector) in `backend/package.json`
- [ ] T004 [P] Install frontend dependencies (react-query or swr) in `frontend/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [ ] T005 Create pgvector extension migration in `backend/src/migrations/001_enable_pgvector.sql`
- [ ] T006 Create rule_categories table migration in `backend/src/migrations/002_rule_categories.sql`
- [ ] T007 Create rules table with search_vector and embedding columns in `backend/src/migrations/003_rules.sql`
- [ ] T008 [P] Create classes and subclasses table migration in `backend/src/migrations/004_classes.sql`
- [ ] T009 [P] Create races and subraces table migration in `backend/src/migrations/005_races.sql`
- [ ] T010 [P] Create spells and spell_classes table migration in `backend/src/migrations/006_spells.sql`
- [ ] T011 [P] Create monsters table migration in `backend/src/migrations/007_monsters.sql`
- [ ] T012 [P] Create items table migration in `backend/src/migrations/008_items.sql`
- [ ] T013 [P] Create backgrounds table migration in `backend/src/migrations/009_backgrounds.sql`
- [ ] T014 [P] Create feats table migration in `backend/src/migrations/010_feats.sql`
- [ ] T015 [P] Create conditions table migration in `backend/src/migrations/011_conditions.sql`
- [ ] T016 [P] Create skills table migration in `backend/src/migrations/012_skills.sql`
- [ ] T017 Create search vector triggers for all content tables in `backend/src/migrations/013_search_triggers.sql`

### TypeScript Types

- [ ] T018 [P] Create shared content types (SourceCitation, BaseEntity) in `backend/src/types/content.types.ts`
- [ ] T019 [P] Create RuleCategory and Rule types in `backend/src/types/rules.types.ts`
- [ ] T020 [P] Create Class and Subclass types in `backend/src/types/classes.types.ts`
- [ ] T021 [P] Create Race and Subrace types in `backend/src/types/races.types.ts`
- [ ] T022 [P] Create Spell types in `backend/src/types/spells.types.ts`
- [ ] T023 [P] Create Monster types in `backend/src/types/monsters.types.ts`
- [ ] T024 [P] Create Item types in `backend/src/types/items.types.ts`
- [ ] T025 [P] Create Background, Feat, Condition, Skill types in `backend/src/types/misc.types.ts`
- [ ] T026 [P] Create SearchResult and NavigationTree types in `backend/src/types/search.types.ts`

### API Infrastructure

- [ ] T027 Create base content router setup in `backend/src/routes/index.ts`
- [ ] T028 Create error handling middleware in `backend/src/middleware/errorHandler.ts`
- [ ] T029 Create request logging middleware in `backend/src/middleware/requestLogger.ts`

### Frontend Types (shared)

- [ ] T030 [P] Create frontend content types (mirror backend types) in `frontend/src/types/content.types.ts`
- [ ] T031 [P] Create API response types in `frontend/src/types/api.types.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1+2 - Browse & View Content (Priority: P1) 🎯 MVP

**Goal**: Users can browse the hierarchical navigation tree and view full content details for any selected item

**Independent Test**: Navigate through category tree, select items, verify content displays with all fields and source citations

### Backend - Navigation API

- [ ] T032 [US1] Implement getNavigationTree service in `backend/src/services/content/navigationService.ts`
- [ ] T033 [US1] Create GET /api/rules/tree endpoint in `backend/src/routes/navigation.ts`

### Backend - Content Services

- [ ] T034 [P] [US2] Implement RuleCategoryService in `backend/src/services/content/ruleCategoryService.ts`
- [ ] T035 [P] [US2] Implement RuleService in `backend/src/services/content/ruleService.ts`
- [ ] T036 [P] [US2] Implement ClassService in `backend/src/services/content/classService.ts`
- [ ] T037 [P] [US2] Implement RaceService in `backend/src/services/content/raceService.ts`
- [ ] T038 [P] [US2] Implement SpellService in `backend/src/services/content/spellService.ts`
- [ ] T039 [P] [US2] Implement MonsterService in `backend/src/services/content/monsterService.ts`
- [ ] T040 [P] [US2] Implement ItemService in `backend/src/services/content/itemService.ts`
- [ ] T041 [P] [US2] Implement BackgroundService in `backend/src/services/content/backgroundService.ts`
- [ ] T042 [P] [US2] Implement FeatService in `backend/src/services/content/featService.ts`
- [ ] T043 [P] [US2] Implement ConditionService in `backend/src/services/content/conditionService.ts`
- [ ] T044 [P] [US2] Implement SkillService in `backend/src/services/content/skillService.ts`

### Backend - Content Endpoints

- [ ] T045 [P] [US2] Create rules routes (list, category, detail) in `backend/src/routes/rules.ts`
- [ ] T046 [P] [US2] Create classes routes (list, detail, subclass) in `backend/src/routes/classes.ts`
- [ ] T047 [P] [US2] Create races routes (list, detail, subrace) in `backend/src/routes/races.ts`
- [ ] T048 [P] [US2] Create spells routes (list with filters, detail) in `backend/src/routes/spells.ts`
- [ ] T049 [P] [US2] Create bestiary routes (list with filters, detail) in `backend/src/routes/bestiary.ts`
- [ ] T050 [P] [US2] Create items routes (list with filters, detail) in `backend/src/routes/items.ts`
- [ ] T051 [P] [US2] Create backgrounds routes in `backend/src/routes/backgrounds.ts`
- [ ] T052 [P] [US2] Create feats routes in `backend/src/routes/feats.ts`
- [ ] T053 [P] [US2] Create conditions routes in `backend/src/routes/conditions.ts`
- [ ] T054 [P] [US2] Create skills routes in `backend/src/routes/skills.ts`
- [ ] T055 [US2] Register all content routes in main router in `backend/src/routes/index.ts`

### Frontend - API Client

- [ ] T056 [P] [US1] Create navigation API client in `frontend/src/lib/api/navigationApi.ts`
- [ ] T057 [P] [US2] Create content API client (all categories) in `frontend/src/lib/api/contentApi.ts`

### Frontend - Hooks

- [ ] T058 [US1] Create useSidebar hook (expansion state, localStorage) in `frontend/src/lib/hooks/useSidebar.ts`
- [ ] T059 [US1] Create useNavigation hook (fetch tree, loading states) in `frontend/src/lib/hooks/useNavigation.ts`

### Frontend - Layout Components

- [ ] T060 [US1] Create RulesLayout component (sidebar + content area) in `frontend/src/components/layout/RulesLayout.tsx`
- [ ] T061 [US1] Create Sidebar component (hierarchical navigation) in `frontend/src/components/layout/Sidebar.tsx`
- [ ] T062 [US1] Create SidebarItem component (expandable tree node) in `frontend/src/components/layout/SidebarItem.tsx`
- [ ] T063 [US2] Create Breadcrumb component in `frontend/src/components/layout/Breadcrumb.tsx`
- [ ] T064 [US2] Create ContentPanel component (main display area) in `frontend/src/components/layout/ContentPanel.tsx`
- [ ] T065 [US2] Create SourceCitation component in `frontend/src/components/content/SourceCitation.tsx`

### Frontend - Content Display Components

- [ ] T066 [P] [US2] Create RuleCard component in `frontend/src/components/content/RuleCard.tsx`
- [ ] T067 [P] [US2] Create ClassDetail component in `frontend/src/components/content/ClassDetail.tsx`
- [ ] T068 [P] [US2] Create RaceDetail component in `frontend/src/components/content/RaceDetail.tsx`
- [ ] T069 [P] [US2] Create SpellCard component in `frontend/src/components/content/SpellCard.tsx`
- [ ] T070 [P] [US2] Create MonsterStatBlock component in `frontend/src/components/content/MonsterStatBlock.tsx`
- [ ] T071 [P] [US2] Create ItemCard component in `frontend/src/components/content/ItemCard.tsx`
- [ ] T072 [P] [US2] Create BackgroundCard component in `frontend/src/components/content/BackgroundCard.tsx`
- [ ] T073 [P] [US2] Create FeatCard component in `frontend/src/components/content/FeatCard.tsx`
- [ ] T074 [P] [US2] Create ConditionCard component in `frontend/src/components/content/ConditionCard.tsx`
- [ ] T075 [P] [US2] Create SkillCard component in `frontend/src/components/content/SkillCard.tsx`

### Frontend - Pages (App Router)

- [ ] T076 [US1] Create rules layout with sidebar in `frontend/src/app/(rules)/layout.tsx`
- [ ] T077 [US1] Create rules landing page in `frontend/src/app/(rules)/rules/page.tsx`
- [ ] T078 [P] [US2] Create rule category page in `frontend/src/app/(rules)/rules/[category]/page.tsx`
- [ ] T079 [P] [US2] Create rule detail page in `frontend/src/app/(rules)/rules/[category]/[slug]/page.tsx`
- [ ] T080 [P] [US2] Create classes list page in `frontend/src/app/(rules)/classes/page.tsx`
- [ ] T081 [P] [US2] Create class detail page in `frontend/src/app/(rules)/classes/[slug]/page.tsx`
- [ ] T082 [P] [US2] Create subclass detail page in `frontend/src/app/(rules)/classes/[slug]/[subclass]/page.tsx`
- [ ] T083 [P] [US2] Create races list page in `frontend/src/app/(rules)/races/page.tsx`
- [ ] T084 [P] [US2] Create race detail page in `frontend/src/app/(rules)/races/[slug]/page.tsx`
- [ ] T085 [P] [US2] Create spells list page in `frontend/src/app/(rules)/spells/page.tsx`
- [ ] T086 [P] [US2] Create spell detail page in `frontend/src/app/(rules)/spells/[slug]/page.tsx`
- [ ] T087 [P] [US2] Create bestiary list page in `frontend/src/app/(rules)/bestiary/page.tsx`
- [ ] T088 [P] [US2] Create monster detail page in `frontend/src/app/(rules)/bestiary/[slug]/page.tsx`
- [ ] T089 [P] [US2] Create items list page in `frontend/src/app/(rules)/items/page.tsx`
- [ ] T090 [P] [US2] Create item detail page in `frontend/src/app/(rules)/items/[slug]/page.tsx`
- [ ] T091 [P] [US2] Create backgrounds list page in `frontend/src/app/(rules)/backgrounds/page.tsx`
- [ ] T092 [P] [US2] Create background detail page in `frontend/src/app/(rules)/backgrounds/[slug]/page.tsx`
- [ ] T093 [P] [US2] Create feats list page in `frontend/src/app/(rules)/feats/page.tsx`
- [ ] T094 [P] [US2] Create feat detail page in `frontend/src/app/(rules)/feats/[slug]/page.tsx`
- [ ] T095 [P] [US2] Create conditions list page in `frontend/src/app/(rules)/conditions/page.tsx`
- [ ] T096 [P] [US2] Create condition detail page in `frontend/src/app/(rules)/conditions/[slug]/page.tsx`
- [ ] T097 [P] [US2] Create skills list page in `frontend/src/app/(rules)/skills/page.tsx`
- [ ] T098 [P] [US2] Create skill detail page in `frontend/src/app/(rules)/skills/[slug]/page.tsx`

### Error Handling

- [ ] T099 [US2] Create 404 not-found page in `frontend/src/app/(rules)/[...slug]/page.tsx`
- [ ] T100 [US2] Create empty state component in `frontend/src/components/layout/EmptyState.tsx`

**Checkpoint**: MVP complete - Users can browse all categories and view full content details

---

## Phase 4: User Story 3 - Search by Keyword (Priority: P2)

**Goal**: Users can search for content using keywords and see grouped results with snippets

**Independent Test**: Search for terms like "grapple", verify results appear grouped with highlighted snippets

### Backend - Search

- [ ] T101 [US3] Implement FullTextSearchService in `backend/src/services/search/fullTextSearchService.ts`
- [ ] T102 [US3] Create GET /api/search endpoint (full-text mode) in `backend/src/routes/search.ts`
- [ ] T103 [US3] Add search route to main router in `backend/src/routes/index.ts`

### Frontend - Search

- [ ] T104 [US3] Create useDebounce hook in `frontend/src/lib/hooks/useDebounce.ts`
- [ ] T105 [US3] Create useSearch hook (query, results, loading) in `frontend/src/lib/hooks/useSearch.ts`
- [ ] T106 [US3] Create useRecentSearches hook (localStorage) in `frontend/src/lib/hooks/useRecentSearches.ts`
- [ ] T107 [US3] Create search API client in `frontend/src/lib/api/searchApi.ts`
- [ ] T108 [US3] Create SearchBar component in `frontend/src/components/search/SearchBar.tsx`
- [ ] T109 [US3] Create SearchResults component (grouped display) in `frontend/src/components/search/SearchResults.tsx`
- [ ] T110 [US3] Create SearchResultItem component (with snippet highlight) in `frontend/src/components/search/SearchResultItem.tsx`
- [ ] T111 [US3] Create RecentSearches component in `frontend/src/components/search/RecentSearches.tsx`
- [ ] T112 [US3] Create NoResults component with suggestions in `frontend/src/components/search/NoResults.tsx`
- [ ] T113 [US3] Integrate SearchBar into Sidebar component in `frontend/src/components/layout/Sidebar.tsx`

**Checkpoint**: Keyword search functional - Users can find content by term

---

## Phase 5: User Story 5 - Mobile Navigation (Priority: P2)

**Goal**: Mobile users can access the full feature set with touch-friendly navigation

**Independent Test**: Test on mobile viewport (< 768px), verify hamburger menu, slide-over drawer, and touch targets

### Frontend - Mobile Components

- [ ] T114 [US5] Create MobileDrawer component (slide-over) in `frontend/src/components/layout/MobileDrawer.tsx`
- [ ] T115 [US5] Create HamburgerButton component in `frontend/src/components/layout/HamburgerButton.tsx`
- [ ] T116 [US5] Create useMobileDrawer hook in `frontend/src/lib/hooks/useMobileDrawer.ts`
- [ ] T117 [US5] Update RulesLayout with mobile responsive breakpoints in `frontend/src/components/layout/RulesLayout.tsx`
- [ ] T118 [US5] Update Sidebar for mobile drawer integration in `frontend/src/components/layout/Sidebar.tsx`
- [ ] T119 [US5] Add mobile search access (in header when sidebar collapsed) in `frontend/src/components/layout/MobileSearchButton.tsx`
- [ ] T120 [US5] Apply mobile touch target styles (min 44px) across all interactive components

**Checkpoint**: Mobile experience complete - All features accessible on mobile devices

---

## Phase 6: User Story 4 - Semantic Search (Priority: P3)

**Goal**: Users can search by concept and find semantically related content

**Independent Test**: Search "how to hide from enemies", verify results include Stealth rules, Hide action, Invisibility

### Backend - Semantic Search

- [ ] T121 [US4] Implement SemanticSearchService (pgvector queries) in `backend/src/services/search/semanticSearchService.ts`
- [ ] T122 [US4] Add semantic search mode to GET /api/search endpoint in `backend/src/routes/search.ts`
- [ ] T123 [US4] Add fallback logic when embeddings unavailable in `backend/src/services/search/semanticSearchService.ts`

### Frontend - Semantic Search

- [ ] T124 [US4] Update SearchBar with search mode toggle in `frontend/src/components/search/SearchBar.tsx`
- [ ] T125 [US4] Update useSearch hook to support semantic mode in `frontend/src/lib/hooks/useSearch.ts`
- [ ] T126 [US4] Add AI-powered indicator to search results in `frontend/src/components/search/SearchResults.tsx`
- [ ] T127 [US4] Update search API client for semantic type in `frontend/src/lib/api/searchApi.ts`

**Checkpoint**: Semantic search complete - Users can search by concept

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T128 [P] Add loading skeletons for all content pages in `frontend/src/components/layout/ContentSkeleton.tsx`
- [ ] T129 [P] Add error boundary for content display in `frontend/src/components/layout/ErrorBoundary.tsx`
- [ ] T130 Optimize database queries with proper indexing verification
- [ ] T131 Add request caching headers for content endpoints
- [ ] T132 Performance audit: Ensure search < 1s, page load < 3s
- [ ] T133 Accessibility audit: Ensure ARIA labels, keyboard navigation
- [ ] T134 Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] T135 Validate against quickstart.md development workflow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US1+US2 (Phase 3)**: Depends on Foundational - Core MVP
- **US3 (Phase 4)**: Depends on Foundational - Can run parallel to US1+US2 if staffed
- **US5 (Phase 5)**: Depends on US1+US2 completion (enhances existing UI)
- **US4 (Phase 6)**: Depends on US3 completion (extends search)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Foundational (Phase 2)
        │
        ├──────────────────────┐
        ▼                      ▼
    US1+US2 (P1)          US3 (P2)
    Browse + View         Keyword Search
        │                      │
        ▼                      ▼
    US5 (P2)              US4 (P3)
    Mobile                Semantic Search
        │                      │
        └──────────┬───────────┘
                   ▼
             Polish (Final)
```

### Parallel Opportunities

**Within Phase 2 (Foundational):**
- All migration files T006-T016 can run in parallel
- All type files T018-T026 can run in parallel

**Within Phase 3 (US1+US2):**
- All content services T034-T044 can run in parallel
- All content routes T045-T054 can run in parallel
- All content display components T066-T075 can run in parallel
- All detail pages T078-T098 can run in parallel

**Across Phases:**
- US1+US2 and US3 can run in parallel (different teams/developers)

---

## Parallel Examples

### Phase 2 - Schema Migrations
```bash
# All table migrations in parallel:
Task: "Create classes and subclasses table migration in backend/src/migrations/004_classes.sql"
Task: "Create races and subraces table migration in backend/src/migrations/005_races.sql"
Task: "Create spells and spell_classes table migration in backend/src/migrations/006_spells.sql"
Task: "Create monsters table migration in backend/src/migrations/007_monsters.sql"
```

### Phase 3 - Content Services
```bash
# All content services in parallel:
Task: "Implement ClassService in backend/src/services/content/classService.ts"
Task: "Implement RaceService in backend/src/services/content/raceService.ts"
Task: "Implement SpellService in backend/src/services/content/spellService.ts"
Task: "Implement MonsterService in backend/src/services/content/monsterService.ts"
```

### Phase 3 - Content Display Components
```bash
# All display components in parallel:
Task: "Create ClassDetail component in frontend/src/components/content/ClassDetail.tsx"
Task: "Create RaceDetail component in frontend/src/components/content/RaceDetail.tsx"
Task: "Create SpellCard component in frontend/src/components/content/SpellCard.tsx"
Task: "Create MonsterStatBlock component in frontend/src/components/content/MonsterStatBlock.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1+2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Stories 1+2 (Browse + View)
4. **STOP and VALIDATE**: Test browsing and content display independently
5. Deploy/demo if ready - users can browse all content

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1+US2 → Test → Deploy (MVP! Users can browse & view)
3. Add US3 → Test → Deploy (Users can search by keyword)
4. Add US5 → Test → Deploy (Mobile users can access)
5. Add US4 → Test → Deploy (Semantic search available)
6. Polish → Final release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1+US2 (Browse + View)
   - Developer B: US3 (Keyword Search)
3. After core complete:
   - Developer A: US5 (Mobile)
   - Developer B: US4 (Semantic Search)
4. Team completes Polish together

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 135 |
| **Setup Tasks** | 4 |
| **Foundational Tasks** | 27 |
| **US1+US2 Tasks (MVP)** | 69 |
| **US3 Tasks** | 13 |
| **US5 Tasks** | 7 |
| **US4 Tasks** | 7 |
| **Polish Tasks** | 8 |
| **Parallelizable Tasks** | 78 (58%) |

### Independent Test Criteria

| Story | Test Criteria |
|-------|---------------|
| US1+US2 | Navigate tree → select item → view full content with source citation |
| US3 | Search "grapple" → see grouped results → click to navigate |
| US4 | Toggle semantic → search "hide from enemies" → see related rules |
| US5 | Mobile viewport → hamburger menu → drawer navigation → touch targets |

### Suggested MVP Scope

**Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (US1+US2)**

This delivers:
- Full hierarchical navigation
- All content types viewable
- Deep linking support
- Source citations
- Desktop experience complete

Users can browse and view all D&D 5e reference content.

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [US#] label maps task to specific user story
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Database must have SRD content seeded for testing (prerequisite from spec)
