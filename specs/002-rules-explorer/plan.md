# Implementation Plan: Rules & Handbook

**Branch**: `claude/add-rules-explorer-0KkRx` | **Date**: 2026-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-rules-explorer/spec.md`

## Summary

Build a "Rules & Handbook" page for the AI Dungeon Master application that enables DMs and players to browse, search, and reference D&D 5th Edition content. The page features:
- **Tabbed interface** with 5 categories: Rules, Characters, Spells, Bestiary, Equipment
- **Smart unified search** with AI-powered query intent inference across all content types
- **Summary cards** displaying 3-5 key attributes per entity type

Content is sourced from the existing PostgreSQL database schema (`/migrations/001-dnd-content.sql`) with pgvector embeddings for semantic search. The AI DM integration enables automatic citation of rules and content during gameplay sessions.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend and backend)
**Primary Dependencies**: Next.js 14 (App Router), React 18, Express.js, Tailwind CSS
**Storage**: PostgreSQL with pgvector extension (schema: `/migrations/001-dnd-content.sql`)
**Testing**: Jest (backend), React Testing Library (frontend)
**Target Platform**: Web (modern browsers)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: <1s search response (p95), <2s page load, <500ms filter operations
**Constraints**: Must use existing database schema, graceful degradation if semantic search unavailable
**Scale/Scope**: 14+ entity types, ~1000s of content items

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Rules-Grounded DM | AI must only reference in-app rulebook/handbook dataset | ✅ PASS | Feature provides the in-app dataset for AI DM citations |
| II. Stateful Game Engine | Game state stored in database, not AI memory | ✅ PASS | Content stored in PostgreSQL; read-only reference feature |
| III. Configurable Gameplay | Sensible defaults for zero-config play | ✅ PASS | No configuration required to browse content |
| IV. Multiplayer & Persistence | Campaigns resumable with recaps | N/A | Reference feature, not campaign state |
| V. Transparent Gameplay | AI decisions logged and explainable | ✅ PASS | Citations link to source content for verification |

**Engineering Quality Bars:**

| Bar | Requirement | Approach |
|-----|-------------|----------|
| Security | Campaign-level isolation | Content is shared (rules are same for all); no isolation needed |
| Reliability | State versioning, conflict resolution | Read-only feature; no state mutations |
| Testing | Deterministic tests for rules logic | Unit tests for search/filter logic; integration tests for API |
| Observability | AI decisions logged | Search queries logged; no AI decisions in browsing |

**Gate Status**: ✅ PASSED - No constitution violations

## Project Structure

### Documentation (this feature)

```text
specs/002-rules-explorer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   └── api.yaml         # OpenAPI specification
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   └── handbook/           # NEW: Handbook API routes
│   │       ├── index.ts        # Route registration
│   │       ├── rules.ts        # Rules endpoints
│   │       ├── characters.ts   # Classes, races, backgrounds, feats
│   │       ├── spells.ts       # Spells endpoints
│   │       ├── bestiary.ts     # Monsters endpoints
│   │       ├── equipment.ts    # Items endpoints
│   │       └── search.ts       # Unified search endpoint
│   ├── services/
│   │   └── handbook/           # NEW: Handbook business logic
│   │       ├── searchService.ts      # Search orchestration
│   │       ├── contentService.ts     # Content retrieval
│   │       └── filterService.ts      # Filter logic
│   └── models/                 # Existing models (extend if needed)
└── tests/
    ├── integration/
    │   └── handbook/           # NEW: API integration tests
    └── unit/
        └── handbook/           # NEW: Service unit tests

frontend/
├── src/
│   ├── app/
│   │   └── handbook/           # NEW: Handbook page route
│   │       ├── page.tsx        # Main handbook page
│   │       ├── layout.tsx      # Handbook layout with tabs
│   │       └── [category]/     # Dynamic category routes
│   │           ├── page.tsx    # Category list view
│   │           └── [slug]/     # Item detail routes
│   │               └── page.tsx
│   ├── components/
│   │   └── handbook/           # NEW: Handbook components
│   │       ├── TabNavigation.tsx     # Category tabs
│   │       ├── SearchBar.tsx         # Unified search
│   │       ├── FilterPanel.tsx       # Category-specific filters
│   │       ├── ContentCard.tsx       # Summary card component
│   │       ├── DetailView.tsx        # Full content display
│   │       ├── RuleHierarchy.tsx     # Rules tree view
│   │       ├── SpellCard.tsx         # Spell-specific card
│   │       ├── MonsterStatBlock.tsx  # Monster stat block
│   │       └── ItemCard.tsx          # Item-specific card
│   ├── hooks/
│   │   └── handbook/           # NEW: Handbook hooks
│   │       ├── useSearch.ts          # Search state & logic
│   │       ├── useFilters.ts         # Filter state management
│   │       └── useContent.ts         # Content fetching
│   └── lib/
│       └── handbook/           # NEW: Handbook utilities
│           ├── types.ts              # TypeScript types
│           └── api.ts                # API client functions
└── tests/
    └── handbook/               # NEW: Component tests
```

**Structure Decision**: Web application structure with separate `frontend/` and `backend/` directories. New code organized under `handbook/` subdirectories to keep feature code isolated and maintainable.

## Complexity Tracking

> No constitution violations requiring justification.

| Decision | Rationale |
|----------|-----------|
| Separate handbook/ directories | Isolates feature code; easier to maintain and test |
| Unified search endpoint | Single entry point simplifies client; server handles routing |
| Component per entity type | Allows specialized rendering (spell cards vs monster stat blocks) |
| pgvector for semantic search | Already available in PostgreSQL schema; enables vector similarity |
