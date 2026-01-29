# Implementation Plan: Rules Explorer

**Branch**: `002-rules-explorer` | **Date**: 2026-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-rules-explorer/spec.md`

## Summary

Add a Rules Explorer feature allowing users to browse, search, and reference D&D rules extracted from PDF/TXT source documents. The system will store rules in Supabase with vector embeddings for semantic search, and integrate with the AI DM to cite rules during sessions. This builds on the existing RulesService infrastructure by migrating from file-based to database-backed storage.

## Technical Context

**Language/Version**: TypeScript 5.5+ (Node.js backend), TypeScript 5.x (Next.js frontend)
**Primary Dependencies**: Express.js (backend), Next.js 14 (frontend), Supabase (database + auth), pdf-parse or pdfjs-dist (PDF extraction)
**Storage**: Supabase PostgreSQL with pgvector extension for vector embeddings
**Testing**: Jest (backend), React Testing Library (frontend)
**Target Platform**: Web application (modern browsers)
**Project Type**: Web application (monorepo: frontend/ + backend/)
**Performance Goals**: Full-text search <500ms p95, semantic search <1s p95, 300-page PDF ingestion <5min
**Constraints**: Must integrate with existing RulesService patterns, leverage existing Supabase infrastructure
**Scale/Scope**: ~5 new database tables, ~10 new API endpoints, ~5 new frontend pages/components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Compliance |
|-----------|-------------|------------|
| I. Rules-Grounded DM | AI must only use in-app rulebook dataset | PASS - Rules Explorer provides structured in-app rule storage with citations |
| II. Stateful Game Engine | Canonical truth in database, explicit logging | PASS - Rules stored in Supabase, citations logged with AI responses |
| III. Configurable Systems | Sensible defaults for gameplay systems | N/A - Rules Explorer is reference functionality, not gameplay config |
| IV. Multiplayer & Persistence | Resumable sessions, data persistence | PASS - Rules persist in database, citations trackable across sessions |
| V. Transparent Gameplay | Explainable AI decisions with logging | PASS - Citations provide explicit rule references for AI rulings |

**Engineering Quality Bars:**

| Standard | Requirement | Compliance |
|----------|-------------|------------|
| Security | Campaign-level isolation | PASS - Rules are shared content (not campaign-specific), auth required for admin functions |
| Reliability | State versioning, conflict detection | PASS - Document checksums prevent duplicate ingestion, transaction-safe updates |
| Testing | Deterministic tests for rules logic | PASS - Unit tests for search ranking, integration tests for ingestion pipeline |
| Observability | Logged AI decisions and state changes | PASS - Search queries logged, ingestion events tracked, citation usage recorded |

**Gate Status**: PASSED - No violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/002-rules-explorer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
│   └── rules-api.yaml
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── rules.types.ts       # Extended rule types for database
│   ├── services/
│   │   └── rules/
│   │       ├── service.ts       # Existing RulesService (to be extended)
│   │       ├── ingestion.ts     # NEW: Document ingestion pipeline
│   │       ├── search.ts        # NEW: Search service (full-text + semantic)
│   │       └── embeddings.ts    # NEW: Vector embedding generation
│   ├── api/
│   │   └── routes/
│   │       └── rules.ts         # NEW: Rules API endpoints
│   └── migrations/
│       └── 002_rules_tables.sql # NEW: Database schema migration
└── tests/
    ├── unit/
    │   └── rules/               # Unit tests for rules services
    └── integration/
        └── rules/               # Integration tests for ingestion + search

frontend/
├── src/
│   ├── app/
│   │   └── rules/
│   │       ├── page.tsx         # NEW: Rules Explorer main page
│   │       └── [id]/
│   │           └── page.tsx     # NEW: Rule detail view
│   ├── components/
│   │   └── rules/
│   │       ├── RulesBrowser.tsx    # NEW: Hierarchical sidebar
│   │       ├── RulesSearch.tsx     # NEW: Search bar with mode toggle
│   │       ├── RuleCard.tsx        # NEW: Rule result display
│   │       ├── RuleDetail.tsx      # NEW: Full rule content view
│   │       └── CitationPopover.tsx # NEW: Inline citation display
│   └── hooks/
│       └── useRulesSearch.ts    # NEW: Search state management
└── tests/
    └── components/
        └── rules/               # Component tests
```

**Structure Decision**: Web application pattern - extends existing monorepo with `backend/` and `frontend/` directories. New code follows established patterns (services in `backend/src/services/`, routes in `backend/src/api/routes/`, pages in `frontend/src/app/`).

## Complexity Tracking

> No Constitution violations requiring justification. Standard feature addition following established patterns.

| Item | Decision | Rationale |
|------|----------|-----------|
| pgvector | Required for semantic search | PostgreSQL extension already available in Supabase; enables vector similarity without separate service |
| Embedding API | Use OpenAI embeddings | Already integrated for AI DM; consistent provider reduces complexity |
| Ingestion | Server-side processing | Keeps PDF parsing secure, enables progress tracking, supports large files |
