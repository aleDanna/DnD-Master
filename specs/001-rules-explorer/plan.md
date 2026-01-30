# Implementation Plan: Rules Explorer

**Branch**: `001-rules-explorer` | **Date**: 2026-01-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-rules-explorer/spec.md`

## Summary

Build a comprehensive D&D 5th Edition reference interface with hierarchical sidebar navigation, full-text search, semantic search, and mobile-responsive content display. The feature provides quick access to rules, classes, races, spells, monsters, items, and other game content with source citations.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 14 (App Router), Express.js, Tailwind CSS, pg (node-postgres)
**Storage**: PostgreSQL with pgvector extension for semantic search embeddings
**Testing**: Jest + React Testing Library (frontend), Jest (backend)
**Target Platform**: Web (modern browsers, responsive down to 320px)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Search results < 1 second for 95% of queries, page load < 3 seconds
**Constraints**: Mobile-first responsive design, touch targets >= 44px, no horizontal scroll on mobile
**Scale/Scope**: ~10 content types, ~1000+ content entries, 100+ concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Rules-Grounded DM | PASS | Rules Explorer displays existing SRD content from database; does not generate or invent rules |
| II. Stateful Game Engine First | PASS | Content is read from database, not AI memory; no state mutations in this feature |
| III. Configurable Gameplay Systems | N/A | Rules Explorer is read-only reference; no gameplay configuration involved |
| IV. Multiplayer and Persistence | N/A | Public reference tool; no user sessions or campaign state |
| V. Transparent Gameplay | PASS | All content sourced from database with explicit source citations |

**Engineering Quality Bars:**

| Standard | Status | Implementation Approach |
|----------|--------|------------------------|
| Security | PASS | Public read-only feature; no auth required; content sanitized on display |
| Reliability | PASS | Static content queries; graceful degradation for semantic search |
| Testing | PLAN | Unit tests for search logic, integration tests for content display flows |
| Observability | PLAN | Search queries logged, error conditions produce actionable logs |

**Constitution Gate**: PASSED - No violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/001-rules-explorer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── content/           # Content entity models (rules, spells, etc.)
│   ├── services/
│   │   ├── search/            # Full-text and semantic search services
│   │   └── content/           # Content retrieval services
│   └── api/
│       ├── search/            # Search endpoints
│       └── content/           # Content endpoints (rules, spells, etc.)
└── tests/
    ├── unit/
    └── integration/

frontend/
├── src/
│   ├── components/
│   │   ├── layout/            # RulesLayout, Sidebar, MobileDrawer, Breadcrumb
│   │   ├── search/            # SearchBar, SearchResults, RecentSearches
│   │   └── content/           # RuleCard, SpellCard, MonsterStatBlock, etc.
│   ├── app/
│   │   ├── rules/             # /rules routes
│   │   ├── classes/           # /classes routes
│   │   ├── spells/            # /spells routes
│   │   ├── bestiary/          # /bestiary routes
│   │   └── [other-categories]/
│   └── lib/
│       ├── api/               # API client functions
│       └── hooks/             # useSearch, useSidebar, etc.
└── tests/
    ├── unit/
    └── integration/
```

**Structure Decision**: Web application structure with separate frontend (Next.js) and backend (Express.js) as established in the project. New code organized by feature domain (search, content) within existing src directories.

## Complexity Tracking

> No Constitution violations requiring justification.

| Decision | Rationale |
|----------|-----------|
| pgvector for semantic search | Required for conceptual search feature; PostgreSQL extension integrates with existing database |
| Separate content display components | Each content type (spell, monster, rule) has distinct fields requiring specialized UI |
