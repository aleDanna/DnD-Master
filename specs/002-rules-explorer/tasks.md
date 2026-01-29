# Implementation Tasks: Rules Explorer

**Feature**: 002-rules-explorer | **Date**: 2026-01-29
**Input**: Design documents from Phase 1 (plan.md, data-model.md, contracts/rules-api.yaml, research.md, quickstart.md)

---

## Task Format

```
- [ ] [TaskID] [Priority] [Story] Description
      └── File: path/to/file.ts
      └── Depends: TaskID (if applicable)
```

**Priorities**: P1 (Must Have), P2 (Should Have), P3 (Nice to Have)
**Stories**: US1 (Browse), US2 (Full-Text Search), US3 (Semantic Search), US4 (AI DM Citation), US5 (Document Ingestion)

---

## Phase 1: Setup

- [x] [T001] [P1] [Setup] Enable pgvector extension in Supabase
      └── File: `backend/src/migrations/002_rules_tables.sql`
      └── SQL: `CREATE EXTENSION IF NOT EXISTS vector;`

- [x] [T002] [P1] [Setup] Create database migration for rules tables
      └── File: `backend/src/migrations/002_rules_tables.sql`
      └── Tables: source_documents, rule_chapters, rule_sections, rule_entries, rule_categories, rule_entry_categories
      └── Depends: T001

- [x] [T003] [P1] [Setup] Create RLS policies for rules tables
      └── File: `backend/src/migrations/002_rules_tables.sql`
      └── Policies: Read access for authenticated users, write access for admins only
      └── Depends: T002

- [x] [T004] [P1] [Setup] Add is_admin column to profiles table
      └── File: `backend/src/migrations/002_rules_tables.sql`
      └── SQL: `ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;`
      └── Depends: T002

- [x] [T005] [P1] [Setup] Install pdf-parse dependency
      └── Command: `cd backend && npm install pdf-parse`

- [x] [T006] [P1] [Setup] Create TypeScript types for rules domain
      └── File: `backend/src/models/rules.types.ts`
      └── Types: SourceDocument, RuleChapter, RuleSection, RuleEntry, RuleCategory, SearchResult
      └── Depends: T002

---

## Phase 2: Foundational Services

### Embeddings Service

- [x] [T007] [P1] [US3] Create embeddings service module
      └── File: `backend/src/services/rules/embeddings.ts`
      └── Functions: generateEmbedding(text), generateEmbeddings(texts[])
      └── Depends: T006

- [x] [T008] [P1] [US3] Implement batch embedding generation with rate limiting
      └── File: `backend/src/services/rules/embeddings.ts`
      └── Batch size: 100, delay: 100ms between batches
      └── Depends: T007

### Ingestion Service

- [x] [T009] [P1] [US5] Create ingestion service module structure
      └── File: `backend/src/services/rules/ingestion.ts`
      └── Class: RulesIngestionService
      └── Depends: T006

- [x] [T010] [P1] [US5] Implement PDF text extraction
      └── File: `backend/src/services/rules/ingestion.ts`
      └── Function: extractTextFromPDF(buffer): Promise<ExtractedText>
      └── Depends: T005, T009

- [x] [T011] [P1] [US5] Implement TXT file processing
      └── File: `backend/src/services/rules/ingestion.ts`
      └── Function: extractTextFromTXT(buffer): Promise<ExtractedText>
      └── Depends: T009

- [x] [T012] [P1] [US5] Implement chapter detection heuristics
      └── File: `backend/src/services/rules/ingestion.ts`
      └── Function: detectChapters(text): Chapter[]
      └── Patterns: ALL CAPS, "CHAPTER X:", "Part X:"
      └── Depends: T009

- [x] [T013] [P1] [US5] Implement section detection within chapters
      └── File: `backend/src/services/rules/ingestion.ts`
      └── Function: detectSections(chapterText): Section[]
      └── Depends: T012

- [x] [T014] [P1] [US5] Implement rule entry extraction within sections
      └── File: `backend/src/services/rules/ingestion.ts`
      └── Function: extractEntries(sectionText): Entry[]
      └── Depends: T013

- [x] [T015] [P1] [US5] Implement document hash calculation for duplicate detection
      └── File: `backend/src/services/rules/ingestion.ts`
      └── Function: calculateFileHash(buffer): string
      └── Depends: T009

- [x] [T016] [P1] [US5] Implement full ingestion pipeline
      └── File: `backend/src/services/rules/ingestion.ts`
      └── Function: ingestDocument(file, name): Promise<DocumentId>
      └── Depends: T010, T011, T012, T013, T014, T015, T008

- [x] [T017] [P1] [US5] Implement ingestion progress tracking
      └── File: `backend/src/services/rules/ingestion.ts`
      └── Function: getIngestionStatus(documentId): IngestionStatus
      └── Depends: T016

### Search Service

- [x] [T018] [P1] [US2] Create search service module structure
      └── File: `backend/src/services/rules/search.ts`
      └── Class: RulesSearchService
      └── Depends: T006

- [x] [T019] [P1] [US2] Implement full-text search using tsvector
      └── File: `backend/src/services/rules/search.ts`
      └── Function: fulltextSearch(query, options): Promise<SearchResult[]>
      └── Depends: T018, T003

- [x] [T020] [P2] [US3] Implement semantic search using pgvector
      └── File: `backend/src/services/rules/search.ts`
      └── Function: semanticSearch(query, options): Promise<SearchResult[]>
      └── Depends: T018, T007

- [x] [T021] [P2] [US3] Implement hybrid search with RRF fusion
      └── File: `backend/src/services/rules/search.ts`
      └── Function: hybridSearch(query, options): Promise<SearchResult[]>
      └── K constant: 60
      └── Depends: T019, T020

- [x] [T022] [P1] [US2] Implement search result highlighting
      └── File: `backend/src/services/rules/search.ts`
      └── Function: highlightMatches(content, query): string[]
      └── Depends: T019

### Extended Rules Service

- [x] [T023] [P1] [US1] Extend RulesService with database-backed methods
      └── File: `backend/src/services/rules/service.ts`
      └── Methods: getDocuments(), getChapters(docId), getSections(chapterId), getEntries(sectionId), getEntry(entryId)
      └── Depends: T006, T003

- [x] [T024] [P1] [US1] Implement rule categories management
      └── File: `backend/src/services/rules/service.ts`
      └── Methods: getCategories(), getEntriesByCategory(categoryId)
      └── Depends: T023

---

## Phase 3: API Routes

### Browsing Endpoints

- [x] [T025] [P1] [US1] Create rules routes file structure
      └── File: `backend/src/api/routes/rules.ts`
      └── Depends: T023

- [x] [T026] [P1] [US1] Implement GET /rules/documents endpoint
      └── File: `backend/src/api/routes/rules.ts`
      └── Returns: List of source documents with chapter counts
      └── Depends: T025

- [x] [T027] [P1] [US1] Implement GET /rules/documents/:id/chapters endpoint
      └── File: `backend/src/api/routes/rules.ts`
      └── Returns: Chapters for a document with section counts
      └── Depends: T025

- [x] [T028] [P1] [US1] Implement GET /rules/chapters/:id/sections endpoint
      └── File: `backend/src/api/routes/rules.ts`
      └── Returns: Sections for a chapter with entry counts
      └── Depends: T025

- [x] [T029] [P1] [US1] Implement GET /rules/sections/:id/entries endpoint
      └── File: `backend/src/api/routes/rules.ts`
      └── Returns: Entries for a section
      └── Depends: T025

- [x] [T030] [P1] [US1] Implement GET /rules/entries/:id endpoint
      └── File: `backend/src/api/routes/rules.ts`
      └── Returns: Single entry with full context (section, chapter, document)
      └── Depends: T025

- [x] [T031] [P1] [US1] Implement GET /rules/categories endpoint
      └── File: `backend/src/api/routes/rules.ts`
      └── Returns: All rule categories
      └── Depends: T025, T024

- [x] [T032] [P1] [US1] Implement GET /rules/categories/:id/entries endpoint
      └── File: `backend/src/api/routes/rules.ts`
      └── Returns: Paginated entries for a category
      └── Depends: T025, T024

### Search Endpoint

- [x] [T033] [P1] [US2] Implement GET /rules/search endpoint
      └── File: `backend/src/api/routes/rules.ts`
      └── Query params: q, mode (fulltext|semantic|hybrid), limit, offset, documentId
      └── Depends: T025, T019, T020, T021

### Admin Endpoints

- [x] [T034] [P1] [US5] Create admin middleware for routes
      └── File: `backend/src/api/middleware/adminAuth.ts`
      └── Checks: is_admin flag in user profile
      └── Depends: T004

- [x] [T035] [P1] [US5] Implement POST /admin/rules/ingest endpoint
      └── File: `backend/src/api/routes/rules.ts`
      └── Accepts: multipart/form-data with file and name
      └── Returns: 202 with documentId and status
      └── Depends: T025, T034, T016

- [x] [T036] [P1] [US5] Implement GET /admin/rules/ingest/:id/status endpoint
      └── File: `backend/src/api/routes/rules.ts`
      └── Returns: Ingestion progress (chapters, sections, entries, embeddings processed)
      └── Depends: T025, T034, T017

- [x] [T037] [P1] [US5] Implement DELETE /admin/rules/ingest/:id endpoint
      └── File: `backend/src/api/routes/rules.ts`
      └── Cascades: Deletes document and all related rules
      └── Depends: T025, T034

- [x] [T038] [P2] [US5] Implement POST /admin/rules/categories endpoint
      └── File: `backend/src/api/routes/rules.ts`
      └── Creates: New rule category
      └── Depends: T025, T034, T024

- [x] [T039] [P1] [US1] Register rules routes in Express app
      └── File: `backend/src/api/index.ts` or `backend/src/app.ts`
      └── Depends: T026-T038

---

## Phase 4: Frontend - Hooks and State

- [x] [T040] [P1] [US1] Create useRulesDocuments hook
      └── File: `frontend/src/hooks/useRulesDocuments.ts`
      └── Functions: Fetch documents, chapters, sections, entries
      └── Depends: T026-T032

- [x] [T041] [P1] [US2] Create useRulesSearch hook
      └── File: `frontend/src/hooks/useRulesSearch.ts`
      └── State: query, mode, results, loading, error
      └── Depends: T033

---

## Phase 5: Frontend - Components

### Display Components

- [x] [T042] [P1] [US1] Create RuleCard component
      └── File: `frontend/src/components/rules/RuleCard.tsx`
      └── Props: entry, highlights (optional)
      └── Displays: Title, excerpt, source reference

- [x] [T043] [P1] [US1] Create RuleDetail component
      └── File: `frontend/src/components/rules/RuleDetail.tsx`
      └── Props: entryId
      └── Displays: Full content, breadcrumb navigation, categories

- [x] [T044] [P2] [US4] Create CitationPopover component
      └── File: `frontend/src/components/rules/CitationPopover.tsx`
      └── Props: citation object
      └── Displays: Rule excerpt, link to full rule

### Navigation Components

- [x] [T045] [P1] [US1] Create RulesBrowser component (hierarchical sidebar)
      └── File: `frontend/src/components/rules/RulesBrowser.tsx`
      └── Features: Expandable tree (documents → chapters → sections → entries)
      └── Depends: T040

- [x] [T046] [P1] [US2] Create RulesSearch component
      └── File: `frontend/src/components/rules/RulesSearch.tsx`
      └── Features: Search input, mode toggle (fulltext/semantic/hybrid)
      └── Depends: T041

- [x] [T047] [P1] [US2] Create SearchResults component
      └── File: `frontend/src/components/rules/SearchResults.tsx`
      └── Props: results, loading
      └── Features: Result list with highlighting, pagination
      └── Depends: T042

---

## Phase 6: Frontend - Pages

- [x] [T048] [P1] [US1] Create Rules Explorer main page
      └── File: `frontend/src/app/rules/page.tsx`
      └── Layout: Sidebar (RulesBrowser), main area (search/results or entry detail)
      └── Depends: T045, T046, T047

- [x] [T049] [P1] [US1] Create Rule detail page
      └── File: `frontend/src/app/rules/[id]/page.tsx`
      └── Displays: Full rule with context, related rules
      └── Depends: T043

- [x] [T050] [P1] [US1] Add Rules Explorer link to main navigation
      └── File: `frontend/src/components/Navigation.tsx` (or similar)
      └── Depends: T048

---

## Phase 7: AI DM Integration

- [x] [T051] [P2] [US4] Update DMService to use database-backed RulesService
      └── File: `backend/src/services/rules/dm-integration.ts`
      └── Change: Switch from file-based to Supabase-backed rule lookup
      └── Depends: T023

- [x] [T052] [P2] [US4] Implement rule citation generation in DMService
      └── File: `backend/src/services/rules/dm-integration.ts`
      └── Function: Add relevant rules to AI context, generate citations
      └── Depends: T051, T021

- [x] [T053] [P2] [US4] Update session view to render citations
      └── File: `frontend/src/components/chat/MessageBubble.tsx`
      └── Features: Render CitationPopover for each citation in AI response
      └── Depends: T044

---

## Phase 8: Testing

### Unit Tests

- [ ] [T054] [P1] [US5] Write unit tests for ingestion service
      └── File: `backend/tests/unit/rules/ingestion.test.ts`
      └── Tests: PDF extraction, chapter detection, section detection, duplicate detection
      └── Depends: T016

- [ ] [T055] [P1] [US2] Write unit tests for search service
      └── File: `backend/tests/unit/rules/search.test.ts`
      └── Tests: Full-text search, relevance scoring, highlighting
      └── Depends: T019

- [ ] [T056] [P2] [US3] Write unit tests for hybrid search
      └── File: `backend/tests/unit/rules/search.test.ts`
      └── Tests: RRF fusion, semantic ranking
      └── Depends: T021

- [ ] [T057] [P1] [US3] Write unit tests for embeddings service
      └── File: `backend/tests/unit/rules/embeddings.test.ts`
      └── Tests: Batch processing, rate limiting
      └── Depends: T008

### Integration Tests

- [ ] [T058] [P1] [US1] Write integration tests for rules API browsing
      └── File: `backend/tests/integration/rules/api.test.ts`
      └── Tests: Document listing, hierarchy navigation
      └── Depends: T039

- [ ] [T059] [P1] [US2] Write integration tests for search API
      └── File: `backend/tests/integration/rules/api.test.ts`
      └── Tests: Search modes, pagination, filtering
      └── Depends: T033

- [ ] [T060] [P1] [US5] Write integration tests for admin ingestion API
      └── File: `backend/tests/integration/rules/api.test.ts`
      └── Tests: File upload, admin authorization, status tracking
      └── Depends: T035, T036, T037

### Frontend Tests

- [ ] [T061] [P2] [US1] Write component tests for RulesBrowser
      └── File: `frontend/tests/components/rules/RulesBrowser.test.tsx`
      └── Tests: Expand/collapse, selection
      └── Depends: T045

- [ ] [T062] [P2] [US2] Write component tests for RulesSearch
      └── File: `frontend/tests/components/rules/RulesSearch.test.tsx`
      └── Tests: Mode toggle, loading state, result display
      └── Depends: T046

---

## Phase 9: Polish & Cross-Cutting

- [x] [T063] [P2] [Setup] Add environment variable validation for rules feature
      └── File: `backend/src/config/env.ts`
      └── Variables: OPENAI_API_KEY (required for embeddings)

- [ ] [T064] [P3] [US1] Add keyboard navigation to RulesBrowser
      └── File: `frontend/src/components/rules/RulesBrowser.tsx`
      └── Features: Arrow key navigation, Enter to select
      └── Depends: T045

- [ ] [T065] [P3] [US2] Add search history/suggestions
      └── File: `frontend/src/components/rules/RulesSearch.tsx`
      └── Features: Recent searches, popular queries
      └── Depends: T046

- [x] [T066] [P2] [US1] Add loading skeletons for rules content
      └── File: `frontend/src/components/rules/RuleCard.tsx`, `RuleDetail.tsx`
      └── Depends: T042, T043

- [ ] [T067] [P2] [US5] Add ingestion progress UI for admins
      └── File: `frontend/src/app/admin/rules/page.tsx`
      └── Features: Upload form, progress bar, status display
      └── Depends: T035, T036

---

## Summary

| Phase | Tasks | Priority Breakdown |
|-------|-------|-------------------|
| Phase 1: Setup | T001-T006 | 6 P1 |
| Phase 2: Foundational | T007-T024 | 14 P1, 4 P2 |
| Phase 3: API Routes | T025-T039 | 14 P1, 1 P2 |
| Phase 4: Frontend Hooks | T040-T041 | 2 P1 |
| Phase 5: Frontend Components | T042-T047 | 5 P1, 1 P2 |
| Phase 6: Frontend Pages | T048-T050 | 3 P1 |
| Phase 7: AI DM Integration | T051-T053 | 3 P2 |
| Phase 8: Testing | T054-T062 | 6 P1, 3 P2 |
| Phase 9: Polish | T063-T067 | 1 P2, 2 P3 |
| **Total** | **67 tasks** | **50 P1, 13 P2, 2 P3** |

### User Story Coverage

| Story | Tasks | Description |
|-------|-------|-------------|
| US1 (Browse) | T023-T032, T040, T042-T043, T045, T048-T050, T058, T061, T064, T066 | Hierarchical browsing of rules |
| US2 (Full-Text Search) | T018-T019, T022, T033, T041, T046-T047, T055, T059, T062, T065 | Keyword-based search |
| US3 (Semantic Search) | T007-T008, T020-T021, T056-T057 | AI-powered semantic search |
| US4 (AI DM Citation) | T044, T051-T053 | Citation integration in AI responses |
| US5 (Document Ingestion) | T009-T017, T034-T038, T054, T060, T067 | Admin document upload and processing |

---

## Recommended Implementation Order

1. **Phase 1** (Setup) - Database and dependencies
2. **Phase 2** (Foundational) - Core services
3. **Phase 3** (API Routes) - Backend endpoints
4. **Phase 4-6** (Frontend) - UI implementation
5. **Phase 7** (Integration) - AI DM updates
6. **Phase 8** (Testing) - Test coverage
7. **Phase 9** (Polish) - Enhancements
